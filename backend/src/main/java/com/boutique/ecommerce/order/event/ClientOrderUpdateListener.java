package com.boutique.ecommerce.order.event;

import com.boutique.ecommerce.notification.OrderCreatedEvent;
import com.boutique.ecommerce.notification.OrderPaymentStatusChangedEvent;
import com.boutique.ecommerce.notification.OrderStatusChangedEvent;
import com.boutique.ecommerce.order.service.ClientOrderStreamService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class ClientOrderUpdateListener {

    private final ClientOrderStreamService streamService;

    public ClientOrderUpdateListener(ClientOrderStreamService streamService) {
        this.streamService = streamService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        streamService.broadcastOrderUpdate(event.orderId());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderStatusChanged(OrderStatusChangedEvent event) {
        streamService.broadcastOrderUpdate(event.orderId());
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPaymentStatusChanged(OrderPaymentStatusChangedEvent event) {
        streamService.broadcastOrderUpdate(event.orderId());
    }
}
