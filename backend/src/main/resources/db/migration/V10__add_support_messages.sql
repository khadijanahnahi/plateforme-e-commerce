CREATE TABLE support_messages (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL,
    subject VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    order_number VARCHAR(80),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',
    admin_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_support_message_status CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'))
);

CREATE INDEX idx_support_messages_status_created ON support_messages(status, created_at DESC);
CREATE INDEX idx_support_messages_created ON support_messages(created_at DESC);
CREATE INDEX idx_support_messages_order_number ON support_messages(order_number);
