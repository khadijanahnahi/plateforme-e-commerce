package com.boutique.ecommerce.product.dto;

import com.boutique.ecommerce.product.entity.ProductSize;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductVariantRequest(
        Long id,

        @NotNull(message = "Variant size is required.")
        ProductSize size,

        @NotNull(message = "Variant stock is required.")
        @Min(value = 0, message = "Variant stock must be greater than or equal to 0.")
        Integer stockQuantity,

        @Size(max = 100, message = "Variant SKU must not exceed 100 characters.")
        String sku,

        Boolean active
) {
}
