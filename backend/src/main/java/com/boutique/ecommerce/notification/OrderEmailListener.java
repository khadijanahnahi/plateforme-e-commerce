package com.boutique.ecommerce.notification;

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
    public void handleOrderCreated(OrderCreatedEvent event) {
        orderEmailService.sendOrderConfirmation(event.orderId());
    }
}
