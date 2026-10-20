INSERT INTO promotions (
    product_id,
    title,
    description,
    promotion_type,
    original_price,
    promotional_price,
    discount_percentage,
    starts_at,
    ends_at,
    status,
    priority,
    badge_label
)
SELECT
    product.id,
    'Offre de lancement',
    'Prix catalogue avant remise.',
    'NEW_DROP',
    ROUND(product.price * 1.25, 2),
    product.price,
    20.00,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '365 days',
    'ACTIVE',
    50,
    '-20%'
FROM products product
WHERE product.status = 'ACTIVE'
  AND product.price > 0
  AND NOT EXISTS (
      SELECT 1
      FROM promotions promotion
      WHERE promotion.product_id = product.id
        AND promotion.status = 'ACTIVE'
        AND promotion.starts_at <= CURRENT_TIMESTAMP
        AND promotion.ends_at > CURRENT_TIMESTAMP
  );
