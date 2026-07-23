ALTER TABLE coupons
    ADD COLUMN publicly_visible BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_coupons_public_active_dates
    ON coupons (publicly_visible, active, starts_at, expires_at);
