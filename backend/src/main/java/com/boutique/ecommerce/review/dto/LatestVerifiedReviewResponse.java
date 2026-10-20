package com.boutique.ecommerce.review.dto;

import java.time.LocalDateTime;

public record LatestVerifiedReviewResponse(
        Long reviewId,
        Integer rating,
        String comment,
        String customerDisplayName,
        boolean verifiedPurchase,
        Long productId,
        String productName,
        String productImageUrl,
        LocalDateTime createdAt
) {
}
