package com.boutique.ecommerce.notification;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class OrderEmailListener {

    private final OrderEmailService orderEmailService;

    public OrderEmailListener(OrderEmailService orderEmailService) {
        this.orderEmailService = orderEmailService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleOrderCreated(OrderCreatedEvent event) {
        orderEmailService.sendOrderConfirmation(event.orderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleOrderStatusChanged(OrderStatusChangedEvent event) {
        orderEmailService.sendOrderStatusUpdate(event.orderId(), event.oldStatus(), event.newStatus());
    }
}
