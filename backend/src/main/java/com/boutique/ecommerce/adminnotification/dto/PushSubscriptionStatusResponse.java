package com.boutique.ecommerce.adminnotification.dto;

public record PushSubscriptionStatusResponse(
        boolean configured,
        boolean subscribed,
        String publicKey
) {
}
