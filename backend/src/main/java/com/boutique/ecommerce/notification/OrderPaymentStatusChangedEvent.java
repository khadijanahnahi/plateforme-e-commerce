package com.boutique.ecommerce.notification;

import com.boutique.ecommerce.order.entity.PaymentStatus;

public record OrderPaymentStatusChangedEvent(
        Long orderId,
        PaymentStatus oldStatus,
        PaymentStatus newStatus
) {
}
