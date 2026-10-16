import { expect, type Page, test } from "@playwright/test";

async function focusedOutline(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const style = getComputedStyle(el);
    return { tag: el.tagName, outline: style.outlineStyle, width: style.outlineWidth };
  });
}

test("the first Tab reaches the skip link, which moves focus to main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("every control on /dev/ui is reachable by Tab and shows a focus ring", async ({ page }) => {
  await page.goto("/dev/ui");
  await page.getByRole("table", { name: "Newest worlds" }).waitFor();

  const seen = new Set<string>();
  for (let step = 0; step < 120; step += 1) {
    await page.keyboard.press("Tab");
    const outline = await focusedOutline(page);
    if (!outline) continue;
    expect(outline.outline, `focus ring on ${outline.tag}`).not.toBe("none");
    const label = await page.evaluate(
      () =>
        document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent,
    );
    seen.add(label?.trim() ?? "");
  }

  for (const name of ["Create your world", "Delete world", "Open dialog", "Add moon", "World"]) {
    expect(
      [...seen].some((label) => label.includes(name)),
      `${name} reachable`,
    ).toBe(true);
  }
});

test("ConfirmDialog traps focus, gates on the phrase and closes with Escape", async ({ page }) => {
  await page.goto("/dev/ui");
  const trigger = page.locator("#overlays").getByRole("button", { name: "Delete world" });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("alertdialog", { name: "Delete Pebble?" });
  await expect(dialog).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "Delete forever" });
  await expect(confirm).toBeDisabled();

  await dialog.getByLabel(/to confirm/).fill("pebble");
  await expect(confirm).toBeEnabled();

  for (let step = 0; step < 8; step += 1) {
    await page.keyboard.press("Tab");
    const inside = await dialog.evaluate((node) => node.contains(document.activeElement));
    expect(inside).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("tabs and segmented control move with arrow keys", async ({ page }) => {
  await page.goto("/dev/ui");
  await page.getByRole("tab", { name: "Comets" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Visitors" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("tab", { name: "Visitors" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const moons = page.getByRole("radiogroup", { name: "Moons" });
  await moons.getByRole("radio", { name: "One", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  const two = moons.getByRole("radio", { name: "Two", exact: true });
  await expect(two).toBeFocused();
  await page.keyboard.press("Space");
  await expect(two).toHaveAttribute("aria-checked", "true");
});
