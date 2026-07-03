package com.boutique.ecommerce.review.dto;

public record ReviewEligibilityResponse(
        boolean eligible,
        String reason
) {
}
