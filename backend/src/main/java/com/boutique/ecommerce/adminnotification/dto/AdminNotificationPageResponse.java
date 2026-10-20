package com.boutique.ecommerce.adminnotification.dto;

import java.util.List;

public record AdminNotificationPageResponse(
        List<AdminNotificationResponse> notifications,
        long unreadCount
) {
}
