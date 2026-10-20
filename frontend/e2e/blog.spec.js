import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, createBlogCategory } from "./helpers/api";

test("un admin publie un article ensuite visible dans le journal", async ({ page, request }) => {
  page.on("pageerror", (error) => console.error(`[blog e2e page error] ${error.stack || error.message}`));
  const { category } = await createBlogCategory(request);
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const title = `E2E Blog Article ${suffix}`;

  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByLabel("Mot de passe", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);

  await page.getByRole("link", { name: "Articles", exact: true }).click();
  await page.getByRole("button", { name: "Nouvel article" }).click();
  await page.getByLabel("Titre", { exact: true }).fill(title);
  await page.getByLabel("Résumé", { exact: true }).fill("Un article temporaire destiné au parcours Playwright du CMS.");
  await page.locator(".blog-editor-sidebar select").first().selectOption(String(category.id));
  const associatedProduct = page.locator(".blog-product-checks label").first();
  const associatedProductName = (await associatedProduct.locator("span").innerText()).trim();
  await associatedProduct.getByRole("checkbox").check();
  await page.locator(".blog-editor-content").fill("Un contenu éditorial complet créé depuis le CMS ShopSphere.");

  const publishResponse = page.waitForResponse((response) => response.url().includes("/api/admin/blog/posts/") && response.url().endsWith("/publish") && response.ok());
  await page.getByRole("button", { name: "Publier", exact: true }).click();
  await publishResponse;

  await expect.poll(async () => {
    const response = await request.get("/api/blog/posts", { params: { search: title, size: 1 } });
    if (!response.ok()) return 0;
    const body = await response.json();
    return body.content?.some((article) => article.title === title) ? 1 : 0;
  }, { timeout: 10_000 }).toBe(1);

  await page.goto(`/blog?search=${encodeURIComponent(title)}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  for (const width of [320, 390, 430, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.getByRole("heading", { name: title }).getByRole("link").click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByText("Un contenu éditorial complet créé depuis le CMS ShopSphere.")).toBeVisible();
  await expect(page.locator(".blog-related-products")).toBeVisible();
  await expect(page.locator(".blog-related-products h3", { hasText: associatedProductName })).toBeVisible();
});
