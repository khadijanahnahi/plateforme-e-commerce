package com.boutique.ecommerce.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        String productName,
        BigDecimal unitPrice,
        BigDecimal originalPrice,
        BigDecimal discountAmount,
        String promotionTitle,
        Integer quantity,
        BigDecimal subtotal
) {
}
