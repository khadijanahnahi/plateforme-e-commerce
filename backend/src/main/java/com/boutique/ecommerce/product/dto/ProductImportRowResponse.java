package com.boutique.ecommerce.product.dto;

public record ProductImportRowResponse(
        int rowNumber,
        String sku,
        String name,
        String status,
        Long productId,
        String message
) {
}
