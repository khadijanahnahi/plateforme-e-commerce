package com.boutique.ecommerce.invoice.dto;

import java.math.BigDecimal;

public record InvoiceItemResponse(
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
}
