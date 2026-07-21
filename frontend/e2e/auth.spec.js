import { expect, test } from "@playwright/test";
import { uniqueCustomer } from "./helpers/api";

test("un client peut s'inscrire puis accéder à son profil", async ({ page }) => {
  const customer = uniqueCustomer("auth");
  await page.goto("/register");

  await page.getByLabel("Nom complet", { exact: true }).fill(customer.fullName);
  await page.getByLabel("Email", { exact: true }).fill(customer.email);
  await page.getByLabel("Téléphone", { exact: true }).fill(customer.phone);
  await page.getByLabel("Mot de passe", { exact: true }).fill(customer.password);
  await page.getByLabel("Confirmer le mot de passe", { exact: true }).fill(customer.password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: /^Bonjour,/ })).toBeVisible();
});
