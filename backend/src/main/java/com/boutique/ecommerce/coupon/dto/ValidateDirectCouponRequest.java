package com.boutique.ecommerce.coupon.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ValidateDirectCouponRequest(
        @NotBlank(message = "Coupon code is required.")
        String code,

        @NotNull(message = "Product id is required.")
        Long productId,

        @NotNull(message = "Quantity is required.")
        @Min(value = 1, message = "Quantity must be greater than 0.")
        Integer quantity
) {
}
