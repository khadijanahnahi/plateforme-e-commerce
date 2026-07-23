package com.boutique.ecommerce.coupon.dto;

import com.boutique.ecommerce.coupon.entity.DiscountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PublicCouponResponse(
        Long id,
        String code,
        String name,
        String description,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal minimumOrderAmount,
        BigDecimal maxDiscountAmount,
        LocalDateTime startsAt,
        LocalDateTime expiresAt
) {
}
