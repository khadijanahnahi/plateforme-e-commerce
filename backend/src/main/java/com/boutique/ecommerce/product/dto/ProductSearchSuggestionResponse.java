package com.boutique.ecommerce.product.dto;

import java.math.BigDecimal;

public record ProductSearchSuggestionResponse(
        Long id,
        String name,
        String imageUrl,
        String categoryName,
        BigDecimal originalPrice,
        BigDecimal effectivePrice,
        Boolean promotionActive,
        BigDecimal discountPercentage,
        Integer stockQuantity
) {
}
