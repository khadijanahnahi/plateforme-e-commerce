package com.boutique.ecommerce.adminnotification.service;

import com.boutique.ecommerce.adminnotification.config.WebPushProperties;
import com.boutique.ecommerce.adminnotification.entity.AdminNotificationDelivery;
import com.boutique.ecommerce.adminnotification.entity.PushDeliveryStatus;
import com.boutique.ecommerce.adminnotification.entity.PushSubscription;
import com.boutique.ecommerce.adminnotification.repository.AdminNotificationDeliveryRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jose4j.lang.JoseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WebPushSender {

    private static final Logger log = LoggerFactory.getLogger(WebPushSender.class);
    private final AdminNotificationDeliveryRepository deliveryRepository;
    private final PushSubscriptionCrypto crypto;
    private final WebPushProperties properties;
    private final ObjectMapper objectMapper;

    public WebPushSender(
            AdminNotificationDeliveryRepository deliveryRepository,
            PushSubscriptionCrypto crypto,
            WebPushProperties properties,
            ObjectMapper objectMapper
    ) {
        this.deliveryRepository = deliveryRepository;
        this.crypto = crypto;
        this.properties = properties;
        this.objectMapper = objectMapper;
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    @Transactional
    public void send(Long deliveryId) {
        AdminNotificationDelivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
        if (delivery == null || delivery.getStatus() != PushDeliveryStatus.PROCESSING) {
            return;
        }
        PushSubscription subscription = delivery.getSubscription();
        if (!properties.isConfigured() || !subscription.isEnabled()) {
            markFailed(delivery, "Web Push is disabled or the subscription is inactive.");
            return;
        }

        try {
            PushService pushService = new PushService(
                    properties.publicKey(),
                    properties.privateKey(),
                    properties.subject()
            );
            Notification notification = new Notification(
                    crypto.decrypt(subscription.getEndpointEncrypted()),
                    crypto.decrypt(subscription.getP256dhEncrypted()),
                    crypto.decrypt(subscription.getAuthEncrypted()),
                    payload(delivery).getBytes(StandardCharsets.UTF_8),
                    Math.max(properties.ttlSeconds(), 60)
            );
            HttpResponse response = pushService.send(notification);
            int statusCode = response.getStatusLine().getStatusCode();
            if (statusCode >= 200 && statusCode < 300) {
                delivery.setStatus(PushDeliveryStatus.SENT);
                delivery.setSentAt(LocalDateTime.now());
                delivery.setLastError(null);
                subscription.setLastSuccessAt(LocalDateTime.now());
            } else if (statusCode == 404 || statusCode == 410) {
                subscription.setEnabled(false);
                subscription.setLastFailureAt(LocalDateTime.now());
                markFailed(delivery, "Push subscription expired (HTTP " + statusCode + ").");
            } else {
                scheduleRetry(delivery, "Push provider returned HTTP " + statusCode + ".");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            scheduleRetry(delivery, "Push delivery interrupted.");
        } catch (GeneralSecurityException | java.io.IOException | ExecutionException | JoseException
                | RuntimeException exception) {
            log.warn("web push delivery failed deliveryId={} attempt={}", deliveryId, delivery.getAttempts() + 1);
            scheduleRetry(delivery, "Temporary Web Push delivery failure.");
        }
    }

    private String payload(AdminNotificationDelivery delivery) throws JsonProcessingException {
        Long orderId = delivery.getNotification().getOrder() == null
                ? null
                : delivery.getNotification().getOrder().getId();
        return objectMapper.writeValueAsString(Map.of(
                "title", delivery.getNotification().getTitle(),
                "body", delivery.getNotification().getMessage(),
                "url", orderId == null ? "/admin/orders" : "/admin/orders/" + orderId,
                "tag", delivery.getNotification().getEventKey()
        ));
    }

    private void scheduleRetry(AdminNotificationDelivery delivery, String error) {
        int attempts = delivery.getAttempts() + 1;
        delivery.setAttempts(attempts);
        delivery.setLastError(error);
        delivery.getSubscription().setLastFailureAt(LocalDateTime.now());
        if (attempts >= Math.max(properties.maxAttempts(), 1)) {
            delivery.setStatus(PushDeliveryStatus.FAILED);
            return;
        }
        delivery.setStatus(PushDeliveryStatus.RETRY);
        delivery.setNextAttemptAt(LocalDateTime.now().plusMinutes(Math.min(30, 1L << Math.min(attempts, 4))));
    }

    private void markFailed(AdminNotificationDelivery delivery, String error) {
        delivery.setAttempts(delivery.getAttempts() + 1);
        delivery.setStatus(PushDeliveryStatus.FAILED);
        delivery.setLastError(error);
    }
}
