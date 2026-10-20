package com.boutique.ecommerce.order.dto;

import com.boutique.ecommerce.order.entity.OrderStatus;
import com.boutique.ecommerce.order.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        String customerName,
        String customerEmail,
        String customerPhone,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        String couponCode,
        BigDecimal deliveryFee,
        BigDecimal totalAmount,
        OrderStatus status,
        PaymentStatus paymentStatus,
        String shippingAddress,
        String shippingStreetAddress,
        String shippingCity,
        String shippingPostalCode,
        String deliveryNotes,
        LocalDateTime createdAt,
        List<OrderItemResponse> items
) {
}
