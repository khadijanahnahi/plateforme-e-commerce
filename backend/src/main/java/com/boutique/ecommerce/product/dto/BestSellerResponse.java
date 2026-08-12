package com.boutique.ecommerce.product.dto;

import java.math.BigDecimal;
import java.util.List;

public record BestSellerResponse(
        Long productId,
        String name,
        String description,
        String imageUrl,
        String categoryName,
        BigDecimal originalPrice,
        BigDecimal effectivePrice,
        Boolean promotionActive,
        BigDecimal discountPercentage,
        Double averageRating,
        Long reviewCount,
        Long quantitySold,
        Integer stockQuantity,
        List<ProductVariantResponse> variants
) {
}
