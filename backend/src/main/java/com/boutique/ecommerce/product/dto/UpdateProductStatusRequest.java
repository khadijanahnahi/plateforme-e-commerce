package com.boutique.ecommerce.product.dto;

import com.boutique.ecommerce.product.entity.ProductStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateProductStatusRequest(
        @NotNull(message = "Product status is required.")
        ProductStatus status
) {
}
