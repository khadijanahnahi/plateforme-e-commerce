package com.boutique.ecommerce.adminnotification.service;

import com.boutique.ecommerce.adminnotification.dto.AdminNotificationPageResponse;
import com.boutique.ecommerce.adminnotification.dto.AdminNotificationResponse;
import com.boutique.ecommerce.adminnotification.entity.AdminNotification;
import com.boutique.ecommerce.adminnotification.entity.AdminNotificationDelivery;
import com.boutique.ecommerce.adminnotification.entity.AdminNotificationType;
import com.boutique.ecommerce.adminnotification.entity.PushDeliveryStatus;
import com.boutique.ecommerce.adminnotification.repository.AdminNotificationDeliveryRepository;
import com.boutique.ecommerce.adminnotification.repository.AdminNotificationRepository;
import com.boutique.ecommerce.adminnotification.repository.PushSubscriptionRepository;
import com.boutique.ecommerce.common.exception.ResourceNotFoundException;
import com.boutique.ecommerce.order.entity.Order;
import com.boutique.ecommerce.order.repository.OrderRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class AdminNotificationService {

    private final AdminNotificationRepository notificationRepository;
    private final AdminNotificationDeliveryRepository deliveryRepository;
    private final PushSubscriptionRepository subscriptionRepository;
    private final OrderRepository orderRepository;
    private final AdminNotificationStreamService streamService;

    public AdminNotificationService(
            AdminNotificationRepository notificationRepository,
            AdminNotificationDeliveryRepository deliveryRepository,
            PushSubscriptionRepository subscriptionRepository,
            OrderRepository orderRepository,
            AdminNotificationStreamService streamService
    ) {
        this.notificationRepository = notificationRepository;
        this.deliveryRepository = deliveryRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.orderRepository = orderRepository;
        this.streamService = streamService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AdminNotificationResponse createAndDispatch(Long orderId) {
        String eventKey = "ORDER_CREATED:" + orderId;
        AdminNotification existing = notificationRepository.findByEventKey(eventKey).orElse(null);
        if (existing != null) {
            return map(existing);
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        AdminNotification notification = AdminNotification.builder()
                .eventKey(eventKey)
                .type(AdminNotificationType.ORDER_CREATED)
                .title("Nouvelle commande ShopSphere")
                .message("Commande " + order.getOrderNumber() + " enregistrée")
                .order(order)
                .build();
        notification = notificationRepository.saveAndFlush(notification);

        AdminNotification savedNotification = notification;
        List<AdminNotificationDelivery> deliveries = subscriptionRepository.findByEnabledTrue().stream()
                .map(subscription -> AdminNotificationDelivery.builder()
                        .notification(savedNotification)
                        .subscription(subscription)
                        .status(PushDeliveryStatus.PENDING)
                        .attempts(0)
                        .nextAttemptAt(LocalDateTime.now())
                        .build())
                .toList();
        deliveryRepository.saveAll(deliveries);

        AdminNotificationResponse response = map(notification);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                streamService.broadcast(response);
            }
        });
        return response;
    }

    @Transactional(readOnly = true)
    public AdminNotificationPageResponse getLatest(int requestedLimit) {
        int limit = Math.max(1, Math.min(requestedLimit, 50));
        List<AdminNotificationResponse> notifications = notificationRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit))
                .stream()
                .map(this::map)
                .toList();
        return new AdminNotificationPageResponse(notifications, notificationRepository.countByReadAtIsNull());
    }

    @Transactional
    public AdminNotificationResponse markRead(Long id) {
        AdminNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
        }
        return map(notification);
    }

    @Transactional
    public void markAllRead() {
        notificationRepository.findAll().stream()
                .filter(notification -> notification.getReadAt() == null)
                .forEach(notification -> notification.setReadAt(LocalDateTime.now()));
    }

    private AdminNotificationResponse map(AdminNotification notification) {
        Long orderId = notification.getOrder() == null ? null : notification.getOrder().getId();
        return new AdminNotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                orderId,
                orderId == null ? "/admin/orders" : "/admin/orders/" + orderId,
                notification.getReadAt() != null,
                notification.getCreatedAt()
        );
    }
}
