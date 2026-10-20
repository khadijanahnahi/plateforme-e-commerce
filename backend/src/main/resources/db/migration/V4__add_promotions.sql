CREATE TABLE IF NOT EXISTS promotions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    promotion_type VARCHAR(30) NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    promotional_price NUMERIC(10, 2) NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    priority INTEGER NOT NULL DEFAULT 100,
    badge_label VARCHAR(80),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_promotion_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT chk_promotion_type
        CHECK (promotion_type IN ('FLASH_SALE', 'SEASONAL', 'CLEARANCE', 'NEW_DROP', 'MEMBER_DEAL')),

    CONSTRAINT chk_promotion_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED')),

    CONSTRAINT chk_promotion_prices
        CHECK (promotional_price > 0 AND original_price > promotional_price),

    CONSTRAINT chk_promotion_dates
        CHECK (ends_at > starts_at),

    CONSTRAINT chk_promotion_priority
        CHECK (priority >= 0)
);

CREATE INDEX IF NOT EXISTS idx_promotions_product
    ON promotions(product_id);

CREATE INDEX IF NOT EXISTS idx_promotions_status_dates
    ON promotions(status, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_promotions_type_status_dates
    ON promotions(promotion_type, status, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_promotions_public_sort
    ON promotions(status, promotion_type, priority, ends_at);

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS promotion_title VARCHAR(160);

ALTER TABLE order_items
    ADD CONSTRAINT chk_order_item_promotion_values
    CHECK (
        (original_price IS NULL OR original_price >= 0)
        AND discount_amount >= 0
    );
