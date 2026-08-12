package com.boutique.ecommerce.product.dto;

import com.boutique.ecommerce.product.entity.ProductSize;

public record ProductVariantResponse(
        Long id,
        ProductSize size,
        String sku,
        Integer stockQuantity,
        Boolean active
) {
}
