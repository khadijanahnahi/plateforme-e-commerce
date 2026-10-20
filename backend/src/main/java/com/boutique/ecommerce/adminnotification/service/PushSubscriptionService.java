package com.boutique.ecommerce.adminnotification.service;

import com.boutique.ecommerce.adminnotification.config.WebPushProperties;
import com.boutique.ecommerce.adminnotification.dto.PushEndpointRequest;
import com.boutique.ecommerce.adminnotification.dto.PushSubscriptionRequest;
import com.boutique.ecommerce.adminnotification.dto.PushSubscriptionStatusResponse;
import com.boutique.ecommerce.adminnotification.entity.PushSubscription;
import com.boutique.ecommerce.adminnotification.repository.PushSubscriptionRepository;
import com.boutique.ecommerce.common.exception.UnauthorizedException;
import com.boutique.ecommerce.user.entity.AppUser;
import com.boutique.ecommerce.user.repository.UserRepository;
import java.net.URI;
import java.net.URISyntaxException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PushSubscriptionService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PushSubscriptionCrypto crypto;
    private final WebPushProperties properties;

    public PushSubscriptionService(
            PushSubscriptionRepository subscriptionRepository,
            UserRepository userRepository,
            PushSubscriptionCrypto crypto,
            WebPushProperties properties
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.crypto = crypto;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public PushSubscriptionStatusResponse getStatus() {
        AppUser admin = getCurrentAdmin();
        return new PushSubscriptionStatusResponse(
                properties.isConfigured(),
                subscriptionRepository.existsByAdminIdAndEnabledTrue(admin.getId()),
                properties.isConfigured() ? properties.publicKey() : null
        );
    }

    @Transactional
    public PushSubscriptionStatusResponse subscribe(PushSubscriptionRequest request, String userAgent) {
        if (!properties.isConfigured()) {
            throw new IllegalStateException("Web Push is not configured on the server.");
        }
        validateEndpoint(request.endpoint());
        AppUser admin = getCurrentAdmin();
        String endpointHash = crypto.endpointHash(request.endpoint());
        PushSubscription subscription = subscriptionRepository.findByEndpointHash(endpointHash)
                .orElseGet(PushSubscription::new);
        subscription.setAdmin(admin);
        subscription.setEndpointHash(endpointHash);
        subscription.setEndpointEncrypted(crypto.encrypt(request.endpoint()));
        subscription.setP256dhEncrypted(crypto.encrypt(request.keys().p256dh()));
        subscription.setAuthEncrypted(crypto.encrypt(request.keys().auth()));
        subscription.setDeviceName(normalize(request.deviceName(), 120));
        subscription.setUserAgent(normalize(userAgent, 500));
        subscription.setEnabled(true);
        subscriptionRepository.save(subscription);
        return new PushSubscriptionStatusResponse(true, true, properties.publicKey());
    }

    @Transactional
    public void unsubscribe(PushEndpointRequest request) {
        AppUser admin = getCurrentAdmin();
        subscriptionRepository.findByEndpointHash(crypto.endpointHash(request.endpoint()))
                .filter(subscription -> subscription.getAdmin().getId().equals(admin.getId()))
                .ifPresent(subscription -> subscription.setEnabled(false));
    }

    private void validateEndpoint(String endpoint) {
        try {
            URI uri = new URI(endpoint);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                throw new IllegalArgumentException("Invalid push subscription endpoint.");
            }
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("Invalid push subscription endpoint.");
        }
    }

    private AppUser getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication is required.");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
    }

    private String normalize(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }
}
