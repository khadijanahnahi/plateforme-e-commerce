package com.boutique.ecommerce.order.dto;

import com.boutique.ecommerce.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull(message = "Order status is required.")
        OrderStatus status
) {
}
