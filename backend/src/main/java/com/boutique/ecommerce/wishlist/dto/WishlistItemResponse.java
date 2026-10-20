package com.boutique.ecommerce.wishlist.dto;

import com.boutique.ecommerce.product.entity.ProductStatus;
import com.boutique.ecommerce.product.dto.ProductVariantResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
        LocalDateTime createdAt,
        List<ProductVariantResponse> variants
) {
}
