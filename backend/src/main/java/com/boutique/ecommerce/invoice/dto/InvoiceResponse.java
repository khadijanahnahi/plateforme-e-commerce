package com.boutique.ecommerce.invoice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        Long orderId,
        String orderNumber,
        String customerName,
        String customerEmail,
        String customerPhone,
        String billingAddress,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        BigDecimal deliveryFee,
        BigDecimal totalAmount,
        String paymentMethod,
        String paymentStatus,
        LocalDateTime issuedAt,
        String pdfUrl,
        List<InvoiceItemResponse> items
) {
}
