package com.boutique.ecommerce.adminnotification.service;

import com.boutique.ecommerce.adminnotification.entity.AdminNotificationDelivery;
import com.boutique.ecommerce.adminnotification.entity.PushDeliveryStatus;
import com.boutique.ecommerce.adminnotification.repository.AdminNotificationDeliveryRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PushDeliveryClaimService {

    private final AdminNotificationDeliveryRepository deliveryRepository;

    public PushDeliveryClaimService(AdminNotificationDeliveryRepository deliveryRepository) {
        this.deliveryRepository = deliveryRepository;
    }

    @Transactional
    public List<Long> claimDueDeliveries(int batchSize) {
        LocalDateTime now = LocalDateTime.now();
        deliveryRepository.recoverStaleProcessing(
                PushDeliveryStatus.PROCESSING,
                PushDeliveryStatus.RETRY,
                now.minusMinutes(5),
                now,
                "Delivery worker interrupted before completion."
        );
        List<AdminNotificationDelivery> deliveries = deliveryRepository.findDueForUpdate(
                List.of(PushDeliveryStatus.PENDING, PushDeliveryStatus.RETRY),
                now,
                PageRequest.of(0, batchSize)
        );
        deliveries.forEach(delivery -> delivery.setStatus(PushDeliveryStatus.PROCESSING));
        deliveryRepository.flush();
        return deliveries.stream().map(AdminNotificationDelivery::getId).toList();
    }
}
