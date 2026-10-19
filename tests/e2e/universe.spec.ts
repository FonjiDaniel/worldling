import { expect, type Page, test } from "@playwright/test";

import { convexRun } from "./support/convex";
import { expectHydrated, expectNoAxeViolations } from "./support/flows";

// Phase 8 acceptance (SPEC §2.5, §15): search flies to a world and visits it, the keyboard
// reaches nearby worlds, list mode is accessible and pages, tier 0 gets the list, and the world
// page opens the universe on that world. Needs the dev deployment.

const QUALITY_KEY = "worldling:quality:v1";
/** Software WebGL is slow; flights and the first sectors can take a while to settle. */
const SETTLE = { timeout: 30_000 };

// Software WebGL and WebKit make three page loads take longer than the default 30 seconds.
test.describe.configure({ timeout: 120_000 });

test.beforeAll(async () => {
  // More than one list page of worlds (24), so "Show more worlds" has something to load.
  await convexRun("testing/universe:seedUniverse", { count: 30 });
});

async function forceTier(page: Page, tier: string) {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [QUALITY_KEY, tier] as const,
  );
}

/** The username of a seeded world, read from list mode. */
async function someUsername(page: Page): Promise<string> {
  await page.goto("/universe");
  const list = page.getByRole("radio", { name: "List" });
  await expectHydrated(list);
  await list.click();
  const first = page.getByRole("link", { name: /by @seed_/ }).first();
  await expect(first).toBeVisible(SETTLE);
  const href = (await first.getAttribute("href")) ?? "";
  return href.replace("/w/", "");
}

test("search flies to a world and visits it", async ({ page }) => {
  await page.goto("/universe");
  const search = page.getByRole("combobox", { name: "Find a world by username" });
  await expectHydrated(search);
  await search.fill("seed_");
  const option = page.getByRole("option").first();
  await expect(option).toBeVisible(SETTLE);
  const username = /@(seed_\d+)/.exec((await option.textContent()) ?? "")?.[1] ?? "";
  await search.press("Enter");

  const card = page.getByRole("region").filter({ hasText: `by @${username}` });
  await expect(card).toBeVisible(SETTLE);
  await card.getByRole("link", { name: "Visit this world" }).click();
  await expect(page).toHaveURL(new RegExp(`/w/${username}$`), SETTLE);
});

test("the keyboard steps through nearby worlds and Enter visits", async ({ page }) => {
  await page.goto("/universe");
  const galaxy = page.getByRole("application");
  await expect(galaxy).toBeVisible(SETTLE);
  // Sectors stream in after the camera settles.
  await expect
    .poll(async () => {
      await galaxy.focus();
      await page.keyboard.press("Tab");
      return page.getByText(/Press Enter to visit\./).count();
    }, SETTLE)
    .toBeGreaterThan(0);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/w\/[a-z0-9_]+$/, SETTLE);
});

test("list mode is accessible and pages", async ({ page }) => {
  await page.goto("/universe");
  const list = page.getByRole("radio", { name: "List" });
  await expectHydrated(list);
  await list.click();
  await expect(page.getByRole("heading", { name: "Every world" })).toBeVisible();
  const rows = page.getByRole("list").last().getByRole("listitem");
  await expect(rows.first()).toBeVisible(SETTLE);
  const before = await rows.count();
  await page.getByRole("button", { name: "Show more worlds" }).click();
  await expect.poll(() => rows.count(), SETTLE).toBeGreaterThan(before);
  await expectNoAxeViolations(page);
});

test("tier 0 shows the list without the 3D toggle", async ({ page }) => {
  await forceTier(page, "0");
  await page.goto("/universe");
  await expect(page.getByText("This device shows the universe as a list.")).toBeVisible(SETTLE);
  await expect(page.getByRole("radio", { name: "Universe" })).toHaveCount(0);
  await expect(page.getByRole("application")).toHaveCount(0);
});

test("the world page opens the universe on that world", async ({ page }) => {
  const username = await someUsername(page);
  await page.goto(`/w/${username}`);
  const explore = page.getByRole("link", { name: "Explore the universe" });
  await expectHydrated(explore);
  await explore.click();
  await expect(page).toHaveURL(new RegExp(`/universe\\?w=${username}$`));
  await expect(page.getByRole("region").filter({ hasText: `by @${username}` })).toBeVisible(SETTLE);
});
