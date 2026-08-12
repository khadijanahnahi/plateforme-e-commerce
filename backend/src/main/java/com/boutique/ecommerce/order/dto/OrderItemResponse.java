package com.boutique.ecommerce.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        Long variantId,
        String size,
        String variantSku,
        String productName,
        BigDecimal unitPrice,
        BigDecimal originalPrice,
        BigDecimal discountAmount,
        String promotionTitle,
        Integer quantity,
        BigDecimal subtotal
) {
}
