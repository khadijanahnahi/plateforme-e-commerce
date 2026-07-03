package com.boutique.ecommerce.review.dto;

import com.boutique.ecommerce.review.entity.ReviewStatus;
import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long productId,
        String productName,
        Long userId,
        String customerName,
        Long orderId,
        String orderNumber,
        Integer rating,
        String comment,
        ReviewStatus status,
        boolean verifiedPurchase,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
