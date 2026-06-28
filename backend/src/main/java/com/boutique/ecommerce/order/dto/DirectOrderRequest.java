package com.boutique.ecommerce.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record DirectOrderRequest(
        @NotNull(message = "Product id is required.")
        Long productId,

        @NotNull(message = "Quantity is required.")
        @Min(value = 1, message = "Quantity must be greater than 0.")
        Integer quantity,

        String shippingAddress
) {
}
