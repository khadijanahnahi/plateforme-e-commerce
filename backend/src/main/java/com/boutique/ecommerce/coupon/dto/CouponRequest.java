package com.boutique.ecommerce.coupon.dto;

import com.boutique.ecommerce.coupon.entity.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CouponRequest(
        @NotBlank(message = "Coupon code is required.")
        @Size(max = 50, message = "Coupon code must not exceed 50 characters.")
        String code,

        @NotBlank(message = "Coupon name is required.")
        @Size(max = 120, message = "Coupon name must not exceed 120 characters.")
        String name,

        @Size(max = 1000, message = "Coupon description must not exceed 1000 characters.")
        String description,

        @NotNull(message = "Discount type is required.")
        DiscountType discountType,

        @NotNull(message = "Discount value is required.")
        @DecimalMin(value = "0.01", message = "Discount value must be greater than 0.")
        BigDecimal discountValue,

        @DecimalMin(value = "0.00", message = "Minimum order amount must be >= 0.")
        BigDecimal minimumOrderAmount,

        @DecimalMin(value = "0.00", message = "Max discount amount must be >= 0.")
        BigDecimal maxDiscountAmount,

        Integer usageLimit,

        Integer perUserLimit,

        Boolean active,

        LocalDateTime startsAt,

        LocalDateTime expiresAt
) {
}
