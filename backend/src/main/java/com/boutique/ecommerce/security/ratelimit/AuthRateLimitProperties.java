package com.boutique.ecommerce.security.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit.auth")
public class AuthRateLimitProperties {

    private boolean enabled = true;
    private int maxAttempts = 5;
    private int windowSeconds = 60;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public int getWindowSeconds() {
        return windowSeconds;
    }

    public void setWindowSeconds(int windowSeconds) {
        this.windowSeconds = windowSeconds;
    }
}
