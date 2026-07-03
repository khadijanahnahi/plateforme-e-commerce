package com.boutique.ecommerce.promotion.dto;

import com.boutique.ecommerce.promotion.entity.PromotionStatus;
import com.boutique.ecommerce.promotion.entity.PromotionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionResponse(
        Long id,
        Long productId,
        String productName,
        String title,
        String description,
        PromotionType promotionType,
        BigDecimal originalPrice,
        BigDecimal promotionalPrice,
        BigDecimal discountPercentage,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        PromotionStatus status,
        Integer priority,
        String badgeLabel,
        Boolean activeNow,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
