package com.boutique.ecommerce.adminnotification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.web-push")
public record WebPushProperties(
        boolean enabled,
        String publicKey,
        String privateKey,
        String subject,
        String storageEncryptionKey,
        int ttlSeconds,
        int maxAttempts
) {
    public boolean isConfigured() {
        return enabled
                && hasText(publicKey)
                && hasText(privateKey)
                && hasText(subject)
                && hasText(storageEncryptionKey);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
