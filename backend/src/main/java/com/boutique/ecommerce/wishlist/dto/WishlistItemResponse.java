package com.boutique.ecommerce.wishlist.dto;

import com.boutique.ecommerce.product.entity.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WishlistItemResponse(
        Long id,
        Long productId,
        String productName,
        String description,
        String imageUrl,
        ProductStatus status,
        Integer stockQuantity,
        BigDecimal price,
        BigDecimal originalPrice,
        BigDecimal effectivePrice,
        Boolean promotionActive,
        BigDecimal promotionalPrice,
        BigDecimal discountPercentage,
        LocalDateTime promotionEndsAt,
        String promotionBadgeLabel,
        Long categoryId,
        String categoryName,
        Double averageRating,
        Long reviewCount,
        LocalDateTime createdAt
) {
}
