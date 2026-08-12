ALTER TABLE products
    ADD COLUMN audience VARCHAR(20) NOT NULL DEFAULT 'UNISEXE';

ALTER TABLE products
    ADD CONSTRAINT chk_product_audience
    CHECK (audience IN ('UNISEXE', 'HOMME', 'FEMME'));

CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    size VARCHAR(20) NOT NULL,
    sku VARCHAR(100),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_variant_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_product_variant_size UNIQUE (product_id, size),
    CONSTRAINT uk_product_variant_sku UNIQUE (sku),
    CONSTRAINT chk_product_variant_size CHECK (size IN ('TAILLE_UNIQUE', 'XS', 'S', 'M', 'L', 'XL', 'XXL')),
    CONSTRAINT chk_product_variant_stock CHECK (stock_quantity >= 0)
);

INSERT INTO product_variants (product_id, size, stock_quantity, active)
SELECT id, 'TAILLE_UNIQUE', stock_quantity, TRUE
FROM products;

ALTER TABLE cart_items ADD COLUMN variant_id BIGINT;

UPDATE cart_items cart
SET variant_id = variant.id
FROM product_variants variant
WHERE variant.product_id = cart.product_id
  AND variant.size = 'TAILLE_UNIQUE';

ALTER TABLE cart_items ALTER COLUMN variant_id SET NOT NULL;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS uq_user_product_cart;
ALTER TABLE cart_items
    ADD CONSTRAINT fk_cart_product_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id);
ALTER TABLE cart_items
    ADD CONSTRAINT uq_user_variant_cart UNIQUE (user_id, variant_id);

ALTER TABLE order_items ADD COLUMN product_variant_id BIGINT;
ALTER TABLE order_items ADD COLUMN variant_size VARCHAR(20);
ALTER TABLE order_items ADD COLUMN variant_sku VARCHAR(100);

UPDATE order_items item
SET product_variant_id = variant.id,
    variant_size = variant.size,
    variant_sku = variant.sku
FROM product_variants variant
WHERE variant.product_id = item.product_id
  AND variant.size = 'TAILLE_UNIQUE';

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_item_product_variant
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items(variant_id);
CREATE INDEX idx_order_items_product_variant_id ON order_items(product_variant_id);
