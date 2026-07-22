package com.boutique.ecommerce.returnrequest.dto;

import com.boutique.ecommerce.returnrequest.entity.ReturnReason;
import com.boutique.ecommerce.returnrequest.entity.ReturnRequestStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ReturnRequestResponse(
        Long id,
        String customerName,
        String customerEmail,
        Long orderId,
        String orderNumber,
        Long orderItemId,
        Long productId,
        String productName,
        String productImageUrl,
        BigDecimal unitPrice,
        Integer quantity,
        ReturnReason reason,
        String details,
        ReturnRequestStatus status,
        String adminNote,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
