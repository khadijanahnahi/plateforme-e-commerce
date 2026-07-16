import { expect } from "@playwright/test";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@shopsphere.local";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin@12345";

export function uniqueCustomer(prefix = "customer") {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    fullName: `Client E2E ${suffix}`,
    email: `${prefix}-${suffix}@example.com`,
    phone: "+212600000099",
    password: "SecureE2E@123",
  };
}

async function json(response) {
  const body = await response.text();
  expect(response.ok(), body).toBeTruthy();
  return body ? JSON.parse(body) : null;
}

export async function registerCustomer(request, customer = uniqueCustomer()) {
  const response = await request.post("/api/auth/register", { data: customer });
  return { customer, auth: await json(response) };
}

export async function loginAdmin(request) {
  const response = await request.post("/api/auth/login", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  return json(response);
}

export async function createSellableProduct(request) {
  const admin = await loginAdmin(request);
  const headers = { Authorization: `Bearer ${admin.accessToken}` };
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const category = await json(await request.post("/api/admin/categories", {
    headers,
    data: {
      name: `E2E Category ${suffix}`,
      description: "Disposable category for Playwright",
      imageUrl: null,
      active: true,
    },
  }));

  const product = await json(await request.post("/api/admin/products", {
    headers,
    data: {
      name: `E2E Product ${suffix}`,
      description: "Disposable product for checkout tests",
      price: 149.90,
      stockQuantity: 20,
      imageUrl: null,
      sku: `E2E-${suffix}`,
      status: "ACTIVE",
      categoryId: category.id,
    },
  }));

  return { admin, category, product };
}

export async function createPendingOrder(request) {
  const [{ customer, auth }, { product }] = await Promise.all([
    registerCustomer(request),
    createSellableProduct(request),
  ]);
  const headers = { Authorization: `Bearer ${auth.accessToken}` };

  await json(await request.post("/api/cart/items", {
    headers,
    data: { productId: product.id, quantity: 1 },
  }));
  const order = await json(await request.post("/api/orders", {
    headers,
    data: {
      fullName: customer.fullName,
      phoneNumber: customer.phone,
      streetAddress: "10 rue des tests",
      city: "Fes",
      postalCode: "30000",
      deliveryNotes: "Commande Playwright",
      shippingAddress: "10 rue des tests, Fes 30000",
      couponCode: null,
    },
  }));

  return { customer, order, product };
}
