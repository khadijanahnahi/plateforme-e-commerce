package com.boutique.ecommerce.cloud.event;

import com.boutique.ecommerce.cloud.config.AwsCloudProperties;
import com.boutique.ecommerce.notification.OrderCreatedEvent;
import com.boutique.ecommerce.notification.OrderPaymentStatusChangedEvent;
import com.boutique.ecommerce.notification.OrderStatusChangedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

@Component
@ConditionalOnProperty(prefix = "app.cloud.sqs", name = "enabled", havingValue = "true")
public class CloudOrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(CloudOrderEventPublisher.class);

    private final SqsClient sqsClient;
    private final AwsCloudProperties properties;
    private final ObjectMapper objectMapper;

    public CloudOrderEventPublisher(SqsClient sqsClient, AwsCloudProperties properties, ObjectMapper objectMapper) {
        this.sqsClient = sqsClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishOrderCreated(OrderCreatedEvent event) {
        publish("ORDER_CREATED", Map.of("orderId", event.orderId()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishOrderStatusChanged(OrderStatusChangedEvent event) {
        publish("ORDER_STATUS_CHANGED", Map.of(
                "orderId", event.orderId(),
                "oldStatus", event.oldStatus(),
                "newStatus", event.newStatus()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishOrderPaymentStatusChanged(OrderPaymentStatusChangedEvent event) {
        publish("ORDER_PAYMENT_STATUS_CHANGED", Map.of(
                "orderId", event.orderId(),
                "oldStatus", event.oldStatus(),
                "newStatus", event.newStatus()
        ));
    }

    private void publish(String type, Map<String, ?> payload) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "type", type,
                    "source", "shopsphere-backend",
                    "occurredAt", Instant.now().toString(),
                    "payload", payload
            ));
            sqsClient.sendMessage(SendMessageRequest.builder()
                    .queueUrl(properties.getSqs().getOrderEventsQueueUrl())
                    .messageBody(body)
                    .build());
            log.info("Published cloud order event to SQS. type={}", type);
        } catch (Exception exception) {
            log.error("Unable to publish cloud order event to SQS. type={}", type, exception);
        }
    }
}
