package com.boutique.ecommerce.promotion.dto;

import com.boutique.ecommerce.product.dto.ProductResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionProductResponse(
        Long promotionId,
        String title,
        String badgeLabel,
        BigDecimal originalPrice,
        BigDecimal promotionalPrice,
        BigDecimal discountPercentage,
        LocalDateTime endsAt,
        Integer priority,
        ProductResponse product
) {
}
