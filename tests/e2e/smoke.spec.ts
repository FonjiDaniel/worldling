import { expect, test } from "@playwright/test";

test("landing page shows the Worldling heading", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Worldling");
  await expect(page.getByRole("heading", { level: 1, name: "Worldling" })).toBeVisible();
});
