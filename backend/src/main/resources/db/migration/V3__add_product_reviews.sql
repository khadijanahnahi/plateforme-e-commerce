CREATE TABLE IF NOT EXISTS product_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT fk_review_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id),

    CONSTRAINT uq_review_user_product
        UNIQUE (user_id, product_id),

    CONSTRAINT chk_review_rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT chk_review_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status
    ON product_reviews(product_id, status);

CREATE INDEX IF NOT EXISTS idx_product_reviews_status_created
    ON product_reviews(status, created_at DESC);
