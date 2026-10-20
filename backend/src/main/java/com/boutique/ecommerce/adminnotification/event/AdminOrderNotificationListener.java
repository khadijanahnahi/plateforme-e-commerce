package com.boutique.ecommerce.adminnotification.event;

import com.boutique.ecommerce.adminnotification.service.AdminNotificationService;
import com.boutique.ecommerce.notification.OrderCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class AdminOrderNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(AdminOrderNotificationListener.class);
    private final AdminNotificationService notificationService;

    public AdminOrderNotificationListener(AdminNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderCreated(OrderCreatedEvent event) {
        try {
            notificationService.createAndDispatch(event.orderId());
        } catch (RuntimeException exception) {
            log.error("unable to persist admin order notification orderId={}", event.orderId(), exception);
        }
    }
}
