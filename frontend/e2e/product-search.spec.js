import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.error(`[product search page error] ${error.stack || error.message}`));
});

const suggestion = {
  id: 42,
  name: "Pince noire mate",
  imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23f7f4ee'/%3E%3C/svg%3E",
  categoryName: "Accessoires",
  originalPrice: 35,
  effectivePrice: 20,
  promotionActive: true,
  discountPercentage: 42.86,
  stockQuantity: 8,
};

const secondSuggestion = {
  ...suggestion,
  id: 43,
  name: "Pince satin noir",
  originalPrice: 28,
  effectivePrice: 28,
  promotionActive: false,
  discountPercentage: null,
};

async function mockPublicApi(page, onSuggestionRequest = () => {}) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!url.pathname.startsWith("/api/")) {
      await route.continue();
      return;
    }

    if (url.pathname === "/api/products/search-suggestions") {
      const query = url.searchParams.get("query") ?? "";
      onSuggestionRequest(query);
      if (query === "erreur") {
        await route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(query.toLowerCase().startsWith("pin") ? [suggestion, secondSuggestion] : []),
      });
      return;
    }

    if (url.pathname === "/api/products/42") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ...suggestion,
          description: "Accessoire monochrome",
          price: 35,
          averageRating: 0,
          reviewCount: 0,
          status: "ACTIVE",
        }),
      });
      return;
    }

    if (url.pathname === "/api/auth/refresh") {
      await route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: request.method() === "GET" ? "[]" : "{}",
    });
  });
}

test("la recherche prédictive est temporisée et navigable au clavier", async ({ page }) => {
  const requests = [];
  await mockPublicApi(page, (query) => requests.push(query));
  await page.goto("/");

  const search = page.getByRole("combobox", { name: "Rechercher dans la collection..." });
  const startedAt = Date.now();
  await search.fill("p");
  await search.fill("pin");

  const option = page.getByRole("option", { name: /Pince noire mate/ });
  await expect(option).toBeVisible();
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(250);
  await expect.poll(() => requests, { timeout: 500 }).toEqual(["pin"]);
  await expect(option.getByRole("img", { name: "Pince noire mate" })).toBeVisible();
  await expect(option).toContainText("20,00 DH");

  await search.press("ArrowDown");
  await expect(option).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowDown");
  await expect(page.getByRole("option", { name: /Pince satin noir/ })).toHaveAttribute("aria-selected", "true");
  await search.press("ArrowUp");
  await expect(option).toHaveAttribute("aria-selected", "true");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/products\/42$/);
  await expect(page.getByRole("heading", { name: "Pince noire mate" })).toBeVisible();

  await page.goto("/");
  const emptySearch = page.getByRole("combobox", { name: "Rechercher dans la collection..." });
  await emptySearch.fill("introuvable");
  await expect(page.getByText("Aucun produit trouvé pour « introuvable »")).toBeVisible();
  await emptySearch.press("Escape");
  await expect(page.getByText("Aucun produit trouvé pour « introuvable »")).toBeHidden();

  await emptySearch.fill("erreur");
  await expect(page.getByText("Impossible de charger les suggestions.")).toBeVisible();
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect.poll(() => requests.filter((query) => query === "erreur").length).toBeGreaterThan(1);

  await emptySearch.fill("pin");
  await expect(page.getByRole("option", { name: /Pince noire mate/ })).toBeVisible();
  await page.locator(".hero-visual").click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole("option", { name: /Pince noire mate/ })).toBeHidden();

  await emptySearch.fill("pince");
  await page.getByRole("button", { name: "Voir tous les résultats pour « pince »" }).click();
  await expect(page).toHaveURL(/\/products\?search=pince$/);
});

test("la recherche mobile utilise un panneau plein écran sans débordement", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockPublicApi(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Ouvrir la recherche" }).click();
  const dialog = page.getByRole("dialog", { name: "Recherche de produits" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox", { name: "Rechercher un produit..." }).fill("pin");
  const mobileOption = dialog.getByRole("option", { name: /Pince noire mate/ });
  await expect(mobileOption).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await mobileOption.click();
  await expect(page).toHaveURL(/\/products\/42$/);
  await expect(dialog).toBeHidden();

  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir la recherche" }).click();
  await page.getByRole("dialog", { name: "Recherche de produits" }).getByRole("button", { name: "Fermer la recherche" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Ouvrir la recherche" })).toBeFocused();
});
