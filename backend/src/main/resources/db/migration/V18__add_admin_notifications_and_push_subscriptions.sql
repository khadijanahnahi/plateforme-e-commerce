CREATE TABLE admin_notifications (
    id BIGSERIAL PRIMARY KEY,
    event_key VARCHAR(120) NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(500) NOT NULL,
    order_id BIGINT,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_admin_notification_event_key UNIQUE (event_key),
    CONSTRAINT fk_admin_notification_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT ck_admin_notification_type CHECK (type IN ('ORDER_CREATED'))
);

CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_unread ON admin_notifications(read_at, created_at DESC);

CREATE TABLE push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL,
    endpoint_hash VARCHAR(64) NOT NULL,
    endpoint_encrypted TEXT NOT NULL,
    p256dh_encrypted TEXT NOT NULL,
    auth_encrypted TEXT NOT NULL,
    device_name VARCHAR(120),
    user_agent VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_success_at TIMESTAMP,
    last_failure_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_push_subscription_endpoint_hash UNIQUE (endpoint_hash),
    CONSTRAINT fk_push_subscription_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_push_subscriptions_admin_enabled ON push_subscriptions(admin_id, enabled);

CREATE TABLE admin_notification_deliveries (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT NOT NULL,
    subscription_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    last_error VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notification_delivery UNIQUE (notification_id, subscription_id),
    CONSTRAINT fk_notification_delivery_notification FOREIGN KEY (notification_id) REFERENCES admin_notifications(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_delivery_subscription FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    CONSTRAINT ck_notification_delivery_status CHECK (status IN ('PENDING', 'PROCESSING', 'RETRY', 'SENT', 'FAILED')),
    CONSTRAINT ck_notification_delivery_attempts CHECK (attempts >= 0)
);

CREATE INDEX idx_notification_deliveries_pending
    ON admin_notification_deliveries(status, next_attempt_at);
