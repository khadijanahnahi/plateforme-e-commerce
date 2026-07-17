import { spawnSync } from "node:child_process";

const cleanupSql = `
BEGIN;

CREATE TEMP TABLE tmp_e2e_users AS
SELECT id FROM users
WHERE full_name LIKE 'Client E2E%'
   OR email LIKE 'auth-%@example.com'
   OR email LIKE 'checkout-%@example.com'
   OR email LIKE 'customer-%@example.com';

CREATE TEMP TABLE tmp_e2e_products AS
SELECT id FROM products
WHERE name LIKE 'E2E Product%'
   OR sku LIKE 'E2E-%';

CREATE TEMP TABLE tmp_e2e_categories AS
SELECT id FROM categories
WHERE name LIKE 'E2E Category%';

CREATE TEMP TABLE tmp_e2e_orders AS
SELECT DISTINCT o.id
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.user_id IN (SELECT id FROM tmp_e2e_users)
   OR oi.product_id IN (SELECT id FROM tmp_e2e_products);

DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE order_id IN (SELECT id FROM tmp_e2e_orders));
DELETE FROM invoices WHERE order_id IN (SELECT id FROM tmp_e2e_orders);
DELETE FROM coupon_usages WHERE order_id IN (SELECT id FROM tmp_e2e_orders) OR user_id IN (SELECT id FROM tmp_e2e_users);
DELETE FROM product_reviews WHERE order_id IN (SELECT id FROM tmp_e2e_orders) OR user_id IN (SELECT id FROM tmp_e2e_users) OR product_id IN (SELECT id FROM tmp_e2e_products);
DELETE FROM stock_movements WHERE order_id IN (SELECT id FROM tmp_e2e_orders) OR product_id IN (SELECT id FROM tmp_e2e_products) OR admin_id IN (SELECT id FROM tmp_e2e_users);
DELETE FROM order_items WHERE order_id IN (SELECT id FROM tmp_e2e_orders) OR product_id IN (SELECT id FROM tmp_e2e_products);
DELETE FROM orders WHERE id IN (SELECT id FROM tmp_e2e_orders);
DELETE FROM cart_items WHERE user_id IN (SELECT id FROM tmp_e2e_users) OR product_id IN (SELECT id FROM tmp_e2e_products);
DELETE FROM wishlist_items WHERE user_id IN (SELECT id FROM tmp_e2e_users) OR product_id IN (SELECT id FROM tmp_e2e_products);
DELETE FROM promotions WHERE product_id IN (SELECT id FROM tmp_e2e_products);
DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM tmp_e2e_users);
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM tmp_e2e_users);
DELETE FROM products WHERE id IN (SELECT id FROM tmp_e2e_products);
DELETE FROM categories WHERE id IN (SELECT id FROM tmp_e2e_categories);
DELETE FROM users WHERE id IN (SELECT id FROM tmp_e2e_users);

COMMIT;
`;

function run(command, options = {}) {
  return spawnSync(command, {
    encoding: "utf8",
    input: cleanupSql,
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });
}

export function cleanupE2EData() {
  if (process.env.E2E_CLEANUP_DISABLED === "true") {
    return;
  }

  const dockerContainer = process.env.E2E_POSTGRES_CONTAINER ?? "shopsphere-postgres";
  const database = process.env.E2E_POSTGRES_DB ?? "ecommerce_db";
  const username = process.env.E2E_POSTGRES_USER ?? "ecommerce_user";
  const password = process.env.E2E_POSTGRES_PASSWORD ?? "ecommerce_password";
  const host = process.env.E2E_POSTGRES_HOST ?? "127.0.0.1";
  const port = process.env.E2E_POSTGRES_PORT ?? "5433";

  const dockerResult = run(`docker exec -i ${dockerContainer} psql -U ${username} -d ${database}`);
  if (dockerResult.status === 0) {
    return;
  }

  const localResult = run(`psql -h ${host} -p ${port} -U ${username} -d ${database}`, {
    env: { ...process.env, PGPASSWORD: password },
  });

  if (localResult.status !== 0) {
    const details = localResult.stderr || dockerResult.stderr || "Unknown cleanup error.";
    console.warn(`[e2e cleanup] Unable to clean E2E data: ${details}`);
  }
}
