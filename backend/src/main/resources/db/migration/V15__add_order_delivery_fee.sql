ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE orders
    ADD CONSTRAINT chk_order_delivery_fee CHECK (delivery_fee >= 0);
