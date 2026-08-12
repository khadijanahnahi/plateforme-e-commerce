package com.boutique.ecommerce.order.dto;

import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import java.time.LocalDateTime;

public record ClientOrderUpdateResponse(
        Long orderId,
        OrderStatus status,
        PaymentStatus paymentStatus,
        LocalDateTime updatedAt
) {
}
