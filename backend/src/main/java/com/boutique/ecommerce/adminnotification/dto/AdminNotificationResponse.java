package com.boutique.ecommerce.adminnotification.dto;

import com.boutique.ecommerce.adminnotification.entity.AdminNotificationType;
import java.time.LocalDateTime;

public record AdminNotificationResponse(
        Long id,
        AdminNotificationType type,
        String title,
        String message,
        Long orderId,
        String actionUrl,
        boolean read,
        LocalDateTime createdAt
) {
}
