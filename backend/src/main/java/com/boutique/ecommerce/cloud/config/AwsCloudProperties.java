package com.boutique.ecommerce.cloud.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cloud")
public class AwsCloudProperties {

    private boolean enabled = false;
    private String region = "us-east-1";
    private String endpoint = "";
    private String accessKey = "";
    private String secretKey = "";
    private final S3 s3 = new S3();
    private final Sqs sqs = new Sqs();
    private final EventBridge eventbridge = new EventBridge();
    private final Secrets secrets = new Secrets();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getAccessKey() {
        return accessKey;
    }

    public void setAccessKey(String accessKey) {
        this.accessKey = accessKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public S3 getS3() {
        return s3;
    }

    public Sqs getSqs() {
        return sqs;
    }

    public EventBridge getEventbridge() {
        return eventbridge;
    }

    public Secrets getSecrets() {
        return secrets;
    }

    public static class S3 {
        private String productMediaBucket = "shopsphere-media";
        private String productMediaPrefix = "products";
        private String productMediaPublicUrlPrefix = "";

        public String getProductMediaBucket() {
            return productMediaBucket;
        }

        public void setProductMediaBucket(String productMediaBucket) {
            this.productMediaBucket = productMediaBucket;
        }

        public String getProductMediaPrefix() {
            return productMediaPrefix;
        }

        public void setProductMediaPrefix(String productMediaPrefix) {
            this.productMediaPrefix = productMediaPrefix;
        }

        public String getProductMediaPublicUrlPrefix() {
            return productMediaPublicUrlPrefix;
        }

        public void setProductMediaPublicUrlPrefix(String productMediaPublicUrlPrefix) {
            this.productMediaPublicUrlPrefix = productMediaPublicUrlPrefix;
        }
    }

    public static class Sqs {
        private boolean enabled = false;
        private boolean workerEnabled = true;
        private String orderEventsQueueUrl = "";
        private int workerDelayMs = 5000;
        private int maxMessages = 5;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public boolean isWorkerEnabled() {
            return workerEnabled;
        }

        public void setWorkerEnabled(boolean workerEnabled) {
            this.workerEnabled = workerEnabled;
        }

        public String getOrderEventsQueueUrl() {
            return orderEventsQueueUrl;
        }

        public void setOrderEventsQueueUrl(String orderEventsQueueUrl) {
            this.orderEventsQueueUrl = orderEventsQueueUrl;
        }

        public int getWorkerDelayMs() {
            return workerDelayMs;
        }

        public void setWorkerDelayMs(int workerDelayMs) {
            this.workerDelayMs = workerDelayMs;
        }

        public int getMaxMessages() {
            return maxMessages;
        }

        public void setMaxMessages(int maxMessages) {
            this.maxMessages = maxMessages;
        }
    }

    public static class EventBridge {
        private boolean enabled = false;
        private String eventBusName = "default";
        private String source = "shopsphere.backend";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getEventBusName() {
            return eventBusName;
        }

        public void setEventBusName(String eventBusName) {
            this.eventBusName = eventBusName;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }
    }

    public static class Secrets {
        private boolean enabled = false;
        private String runtimeSecretName = "shopsphere/runtime";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getRuntimeSecretName() {
            return runtimeSecretName;
        }

        public void setRuntimeSecretName(String runtimeSecretName) {
            this.runtimeSecretName = runtimeSecretName;
        }
    }
}
