package com.boutique.ecommerce.adminnotification.worker;

import com.boutique.ecommerce.adminnotification.config.WebPushProperties;
import com.boutique.ecommerce.adminnotification.service.PushDeliveryClaimService;
import com.boutique.ecommerce.adminnotification.service.WebPushSender;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class WebPushDeliveryWorker {

    private final PushDeliveryClaimService claimService;
    private final WebPushSender webPushSender;
    private final WebPushProperties properties;

    public WebPushDeliveryWorker(
            PushDeliveryClaimService claimService,
            WebPushSender webPushSender,
            WebPushProperties properties
    ) {
        this.claimService = claimService;
        this.webPushSender = webPushSender;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${app.web-push.worker-delay-ms:5000}")
    public void deliverPendingNotifications() {
        if (!properties.isConfigured()) {
            return;
        }
        List<Long> deliveryIds = claimService.claimDueDeliveries(25);
        deliveryIds.forEach(webPushSender::send);
    }
}
