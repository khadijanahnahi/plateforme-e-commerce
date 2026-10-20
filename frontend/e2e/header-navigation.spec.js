import { expect, test } from "@playwright/test";

const categories = [
  {
    id: 11,
    name: "Accessoires",
    productCount: 4,
    imageUrl: null,
  },
  {
    id: 12,
    name: "T-shirts",
    productCount: 8,
    imageUrl: null,
  },
  {
    id: 13,
    name: "Catégorie vide",
    productCount: 0,
    imageUrl: null,
  },
];

async function mockHeaderApi(page, role = null) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === "/api/auth/refresh") {
      if (!role) {
        await route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "header-e2e-access-token",
          user: { id: 1, fullName: "Compte test", email: "test@shopsphere.local", roles: [role] },
        }),
      });
      return;
    }

    if (url.pathname === "/api/categories") {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(categories) });
      return;
    }

    if (url.pathname === "/api/cart") {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [] }) });
      return;
    }

    if (url.pathname === "/api/wishlist") {
      await route.fulfill({ contentType: "application/json", body: "[]" });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: request.method() === "GET" ? "[]" : "{}",
    });
  });
}

test("les mega menus desktop sont exclusifs, accessibles et fermables", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockHeaderApi(page);
  await page.goto("/");

  const shopTrigger = page.getByRole("button", { name: "Boutique" });
  const categoriesTrigger = page.getByRole("button", { name: "Catégories" });

  await shopTrigger.click();
  await expect(page.getByRole("region", { name: "Navigation Boutique" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Accessoires/ }).first()).toBeVisible();
  await expect(page.getByText("Catégorie vide")).toHaveCount(0);

  await categoriesTrigger.click();
  await expect(page.getByRole("region", { name: "Navigation Boutique" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Navigation Catégories" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Navigation Catégories" })).toHaveCount(0);
  await expect(categoriesTrigger).toBeFocused();

  await page.getByRole("button", { name: "Aide & services" }).click();
  await expect(page.getByRole("region", { name: "Navigation Aide et services" })).toBeVisible();
  await page.locator("main").click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole("region", { name: "Navigation Aide et services" })).toHaveCount(0);
});

test("le drawer mobile utilise des accordéons et ferme après navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockHeaderApi(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const drawer = page.getByRole("dialog", { name: "Menu mobile ShopSphere" });
  await expect(drawer).toBeVisible();

  await drawer.getByRole("button", { name: "Boutique" }).click();
  await expect(drawer.getByRole("link", { name: /Tous les produits/ })).toBeVisible();

  await drawer.getByRole("button", { name: "Catégories" }).click();
  await expect(drawer.getByRole("link", { name: /Tous les produits/ })).toHaveCount(0);
  await drawer.getByRole("link", { name: /Accessoires/ }).click();
  await expect(page).toHaveURL(/\/products\?categoryId=11$/);
  await expect(drawer).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("le menu compte adapte ses liens au rôle", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockHeaderApi(page, "USER");
  await page.goto("/");

  await page.getByText("Compte", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Mes commandes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mes retours" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ma wishlist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Support" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tableau de bord admin" })).toHaveCount(0);
});

test("un administrateur ne reçoit pas les raccourcis d'achat client", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockHeaderApi(page, "ADMIN");
  await page.goto("/");

  await page.getByText("Compte", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Tableau de bord admin" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir la boutique" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mes commandes" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ma wishlist" })).toHaveCount(0);
});
