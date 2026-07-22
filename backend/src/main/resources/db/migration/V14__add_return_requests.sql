CREATE TABLE return_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    order_item_id BIGINT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    product_image_url TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    reason VARCHAR(40) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    admin_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_return_request_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_return_request_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_return_request_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    CONSTRAINT uk_return_request_user_item UNIQUE (user_id, order_item_id),
    CONSTRAINT chk_return_request_quantity CHECK (quantity > 0),
    CONSTRAINT chk_return_request_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_return_request_reason CHECK (reason IN (
        'DAMAGED', 'WRONG_PRODUCT', 'NOT_AS_DESCRIBED', 'SIZE_OR_FIT', 'CHANGED_MIND', 'OTHER'
    )),
    CONSTRAINT chk_return_request_status CHECK (status IN (
        'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RECEIVED', 'COMPLETED', 'CANCELLED'
    ))
);

CREATE INDEX idx_return_requests_user_created ON return_requests(user_id, created_at DESC);
CREATE INDEX idx_return_requests_status_created ON return_requests(status, created_at DESC);
CREATE INDEX idx_return_requests_order ON return_requests(order_id);
