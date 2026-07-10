CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    order_id BIGINT,
    admin_id BIGINT,
    movement_type VARCHAR(40) NOT NULL,
    quantity_change INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_movement_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_stock_movement_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_stock_movement_admin FOREIGN KEY (admin_id) REFERENCES users(id),
    CONSTRAINT chk_stock_movement_type CHECK (movement_type IN (
        'ORDER_CREATED', 'ORDER_CANCELLED', 'MANUAL_ADJUSTMENT', 'RESTOCK', 'RETURN', 'DAMAGED'
    )),
    CONSTRAINT chk_stock_movement_before CHECK (stock_before >= 0),
    CONSTRAINT chk_stock_movement_after CHECK (stock_after >= 0),
    CONSTRAINT chk_stock_movement_change CHECK (quantity_change <> 0),
    CONSTRAINT chk_stock_movement_balance CHECK (stock_after = stock_before + quantity_change)
);

CREATE INDEX idx_stock_movements_product_created ON stock_movements(product_id, created_at DESC);
CREATE INDEX idx_stock_movements_order ON stock_movements(order_id);
CREATE INDEX idx_stock_movements_type_created ON stock_movements(movement_type, created_at DESC);
