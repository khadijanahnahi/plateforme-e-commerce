package com.boutique.ecommerce.product.dto;

import com.boutique.ecommerce.product.entity.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        BigDecimal originalPrice,
        BigDecimal effectivePrice,
        Boolean promotionActive,
        BigDecimal promotionalPrice,
        BigDecimal discountPercentage,
        LocalDateTime promotionEndsAt,
        String promotionBadgeLabel,
        Integer stockQuantity,
        String imageUrl,
        String sku,
        ProductStatus status,
        Long categoryId,
        String categoryName,
        Double averageRating,
        Long reviewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
