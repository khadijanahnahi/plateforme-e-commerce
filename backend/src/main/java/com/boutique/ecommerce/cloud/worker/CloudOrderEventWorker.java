package com.boutique.ecommerce.cloud.worker;

import com.boutique.ecommerce.cloud.config.AwsCloudProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.DeleteMessageRequest;
import software.amazon.awssdk.services.sqs.model.ReceiveMessageRequest;

@Component
@ConditionalOnProperty(prefix = "app.cloud", name = "enabled", havingValue = "true")
@ConditionalOnProperty(prefix = "app.cloud.sqs", name = "worker-enabled", havingValue = "true", matchIfMissing = true)
public class CloudOrderEventWorker {

    private static final Logger log = LoggerFactory.getLogger(CloudOrderEventWorker.class);

    private final SqsClient sqsClient;
    private final AwsCloudProperties properties;

    public CloudOrderEventWorker(SqsClient sqsClient, AwsCloudProperties properties) {
        this.sqsClient = sqsClient;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${app.cloud.sqs.worker-delay-ms:5000}")
    public void consumeOrderEvents() {
        String queueUrl = properties.getSqs().getOrderEventsQueueUrl();
        if (queueUrl == null || queueUrl.isBlank()) {
            return;
        }
        var response = sqsClient.receiveMessage(ReceiveMessageRequest.builder()
                .queueUrl(queueUrl)
                .maxNumberOfMessages(properties.getSqs().getMaxMessages())
                .waitTimeSeconds(1)
                .build());
        for (var message : response.messages()) {
            log.info("Consumed cloud order event from SQS. messageId={} body={}", message.messageId(), message.body());
            sqsClient.deleteMessage(DeleteMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .receiptHandle(message.receiptHandle())
                    .build());
        }
    }
}
