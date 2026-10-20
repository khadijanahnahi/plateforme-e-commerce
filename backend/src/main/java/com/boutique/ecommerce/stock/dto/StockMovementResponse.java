package com.boutique.ecommerce.stock.dto;

import com.boutique.ecommerce.stock.entity.StockMovementType;
import java.time.LocalDateTime;

public record StockMovementResponse(
        Long id,
        Long productId,
        String productName,
        Long orderId,
        String orderNumber,
        Long adminId,
        String adminName,
        String adminEmail,
        StockMovementType movementType,
        Integer quantityChange,
        Integer stockBefore,
        Integer stockAfter,
        String reason,
        LocalDateTime createdAt
) {
}
