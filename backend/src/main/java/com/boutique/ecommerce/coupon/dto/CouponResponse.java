package com.boutique.ecommerce.coupon.dto;

import com.boutique.ecommerce.coupon.entity.DiscountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CouponResponse(
        Long id,
        String code,
        String name,
        String description,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal minimumOrderAmount,
        BigDecimal maxDiscountAmount,
        Integer usageLimit,
        Integer usedCount,
        Integer perUserLimit,
        boolean active,
        boolean publiclyVisible,
        LocalDateTime startsAt,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
