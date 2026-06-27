package com.boutique.ecommerce.product.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateProductStockRequest(
        @NotNull(message = "Stock quantity is required.")
        @Min(value = 0, message = "Stock quantity must be greater than or equal to 0.")
        Integer stockQuantity
) {
}
