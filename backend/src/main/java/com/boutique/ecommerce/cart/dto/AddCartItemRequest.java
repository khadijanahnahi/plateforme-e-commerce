package com.boutique.ecommerce.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AddCartItemRequest(
        @NotNull(message = "Product id is required.")
        Long productId,

        Long variantId,

        @NotNull(message = "Quantity is required.")
        @Min(value = 1, message = "Quantity must be greater than 0.")
        Integer quantity
) {
}
