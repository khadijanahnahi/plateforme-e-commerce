package com.boutique.ecommerce.promotion.dto;

import com.boutique.ecommerce.promotion.entity.PromotionStatus;
import com.boutique.ecommerce.promotion.entity.PromotionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PromotionRequest(
        @NotNull(message = "Product id is required.")
        Long productId,

        @NotBlank(message = "Promotion title is required.")
        @Size(max = 160, message = "Promotion title must not exceed 160 characters.")
        String title,

        @Size(max = 1000, message = "Promotion description must not exceed 1000 characters.")
        String description,

        @NotNull(message = "Promotion type is required.")
        PromotionType promotionType,

        @DecimalMin(value = "0.01", message = "Original price must be greater than 0.")
        BigDecimal originalPrice,

        @NotNull(message = "Promotional price is required.")
        @DecimalMin(value = "0.01", message = "Promotional price must be greater than 0.")
        BigDecimal promotionalPrice,

        @NotNull(message = "Start date is required.")
        LocalDateTime startsAt,

        @NotNull(message = "End date is required.")
        LocalDateTime endsAt,

        PromotionStatus status,

        @Min(value = 0, message = "Priority must be >= 0.")
        Integer priority,

        @Size(max = 80, message = "Badge label must not exceed 80 characters.")
        String badgeLabel
) {
        public PromotionRequest(
                        Long productId,
                        String title,
                        String description,
                        PromotionType promotionType,
                        BigDecimal promotionalPrice,
                        LocalDateTime startsAt,
                        LocalDateTime endsAt,
                        PromotionStatus status,
                        Integer priority,
                        String badgeLabel
        ) {
                this(productId, title, description, promotionType, null, promotionalPrice, startsAt, endsAt, status, priority, badgeLabel);
        }
}
