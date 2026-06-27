package com.boutique.ecommerce.order.dto;

import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        BigDecimal totalAmount,
        OrderStatus status,
        PaymentStatus paymentStatus,
        String shippingAddress,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
) {
}
