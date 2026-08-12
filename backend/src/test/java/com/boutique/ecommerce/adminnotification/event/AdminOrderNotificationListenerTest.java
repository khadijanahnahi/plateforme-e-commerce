package com.boutique.ecommerce.adminnotification.event;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import com.boutique.ecommerce.adminnotification.service.AdminNotificationService;
import com.boutique.ecommerce.notification.OrderCreatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminOrderNotificationListenerTest {

    @Mock
    private AdminNotificationService notificationService;

    @Test
    void delegatesOrderCreationToTheNotificationService() {
        AdminOrderNotificationListener listener = new AdminOrderNotificationListener(notificationService);

        listener.onOrderCreated(new OrderCreatedEvent(42L));

        verify(notificationService).createAndDispatch(42L);
    }

    @Test
    void notificationFailureNeverPropagatesToTheOrderFlow() {
        AdminOrderNotificationListener listener = new AdminOrderNotificationListener(notificationService);
        doThrow(new RuntimeException("push infrastructure unavailable"))
                .when(notificationService).createAndDispatch(42L);

        assertDoesNotThrow(() -> listener.onOrderCreated(new OrderCreatedEvent(42L)));
    }
}
