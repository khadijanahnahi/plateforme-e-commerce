package com.boutique.ecommerce.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Long id,
        Long productId,
        String productName,
        String imageUrl,
        BigDecimal unitPrice,
        BigDecimal originalPrice,
        Boolean promotionActive,
        BigDecimal promotionalPrice,
        BigDecimal discountPercentage,
        java.time.LocalDateTime promotionEndsAt,
        String promotionBadgeLabel,
        Integer quantity,
        BigDecimal subtotal,
        Integer availableStock
) {
}
