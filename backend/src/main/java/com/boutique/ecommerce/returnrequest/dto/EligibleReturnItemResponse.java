package com.boutique.ecommerce.returnrequest.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EligibleReturnItemResponse(
        Long orderId,
        String orderNumber,
        LocalDateTime orderDate,
        Long orderItemId,
        Long productId,
        String productName,
        String productImageUrl,
        Integer purchasedQuantity,
        BigDecimal unitPrice
) {
}
