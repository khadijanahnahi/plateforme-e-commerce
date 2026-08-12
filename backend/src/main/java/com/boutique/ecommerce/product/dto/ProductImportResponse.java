package com.boutique.ecommerce.product.dto;

import java.util.List;

public record ProductImportResponse(
        int totalRows,
        int validCount,
        int importedCount,
        int failedCount,
        boolean dryRun,
        List<ProductImportRowResponse> rows
) {
}
