CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_public_name_search
    ON products USING GIN (LOWER(name) gin_trgm_ops)
    WHERE status IN ('ACTIVE', 'OUT_OF_STOCK');

CREATE INDEX IF NOT EXISTS idx_products_public_sku_search
    ON products USING GIN (LOWER(sku) gin_trgm_ops)
    WHERE status IN ('ACTIVE', 'OUT_OF_STOCK');

CREATE INDEX IF NOT EXISTS idx_categories_name_search
    ON categories USING GIN (LOWER(name) gin_trgm_ops)
    WHERE active = TRUE;
