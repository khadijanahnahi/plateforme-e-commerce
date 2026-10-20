import { expect, test } from "@playwright/test";
import { createSellableProduct, registerCustomer, uniqueCustomer } from "./helpers/api";

test("parcours client du login à la confirmation de commande", async ({ page, request }) => {
  const customer = uniqueCustomer("checkout");
  const { product } = await createSellableProduct(request);

  await registerCustomer(request, customer);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(customer.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(customer.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto(`/products?search=${encodeURIComponent(product.name)}`);
  const productCard = page.getByRole("article").filter({ hasText: product.name });
  await productCard.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(page.getByRole("link", { name: /Panier avec 1 article/ })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText(product.name)).toBeVisible();
  await page.getByRole("link", { name: "Passer la commande" }).click();

  await page.getByLabel("Nom complet", { exact: true }).fill(customer.fullName);
  await page.getByLabel("Téléphone", { exact: true }).fill(customer.phone);
  await page.getByLabel("Adresse", { exact: true }).fill("10 rue des tests");
  await page.getByLabel("Ville", { exact: true }).fill("Fes");
  await page.getByLabel("Code postal", { exact: true }).fill("30000");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();

  await expect(page).toHaveURL(/\/order-success\/\d+$/);
  await expect(page.getByRole("heading", { name: "Merci pour votre commande" })).toBeVisible();
  await page.getByRole("link", { name: "Voir ma commande" }).click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
});
