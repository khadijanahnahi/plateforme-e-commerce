package com.boutique.ecommerce.notification;

import com.boutique.ecommerce.order.entity.OrderStatus;

public record OrderStatusChangedEvent(Long orderId, OrderStatus oldStatus, OrderStatus newStatus) {
}
