package com.boutique.ecommerce.coupon.dto;

import java.math.BigDecimal;

public record CouponValidationResponse(
        String code,
        boolean valid,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        String message
) {
}
