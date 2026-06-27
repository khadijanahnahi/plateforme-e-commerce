package com.boutique.ecommerce.product.dto;

import com.boutique.ecommerce.product.entity.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "Product name is required.")
        @Size(max = 150, message = "Product name must not exceed 150 characters.")
        String name,

        String description,

        @NotNull(message = "Product price is required.")
        @DecimalMin(value = "0.00", message = "Product price must be greater than or equal to 0.")
        BigDecimal price,

        @NotNull(message = "Stock quantity is required.")
        @Min(value = 0, message = "Stock quantity must be greater than or equal to 0.")
        Integer stockQuantity,

        String imageUrl,

        @Size(max = 100, message = "SKU must not exceed 100 characters.")
        String sku,

        ProductStatus status,

        @NotNull(message = "Category id is required.")
        Long categoryId
) {
}
