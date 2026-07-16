import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, createPendingOrder } from "./helpers/api";

test("un admin confirme puis marque une commande comme payée", async ({ page, request }) => {
  const { order } = await createPendingOrder(request);

  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByLabel("Mot de passe", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);

  await page.goto(`/admin/orders?customer=${encodeURIComponent(order.customerEmail)}`);
  const row = page.getByRole("row").filter({ hasText: order.orderNumber });
  await expect(row).toBeVisible();
  await row.getByRole("combobox").selectOption("CONFIRMED");
  await row.getByRole("button", { name: "Appliquer" }).click();
  await expect(row).toContainText("Confirmée");

  await row.getByRole("button", { name: "Marquer payé" }).click();
  await expect(row).toContainText("PAID");
});
