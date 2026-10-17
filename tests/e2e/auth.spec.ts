import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import { e2eEmail, waitForCode } from "./support/mailbox";

// Phase 4 acceptance (SPEC §15): sign up -> verify -> onboarding, against the dev deployment
// with the e2e mailbox (ADR-016). Run `npx convex dev` (or be logged in to it) first.

const PASSWORD = "mossy river stones 42";
// After signing in, the Convex websocket has to authenticate against the remote deployment.
const SIGNED_IN = { timeout: 20_000 };

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target.join(" ")),
    }));
  expect(blocking).toEqual([]);
}

async function pasteCode(page: Page, code: string) {
  await page.evaluate(async (text) => {
    await navigator.clipboard.writeText(text);
  }, code);
  // Paste into the middle cell: the whole code should still fill every cell.
  await page.getByRole("textbox", { name: "Digit 4 of 8" }).focus();
  await page.keyboard.press("ControlOrMeta+V");
}

async function signUpAndVerify(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create my world" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await expect(page.getByText(email)).toBeVisible();
  await pasteCode(page, await waitForCode(email, "auth.verify"));
}

test("sign up, verify with a pasted code, then onboard", async ({ page }) => {
  const email = e2eEmail();
  const username = `e2e_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;

  await signUpAndVerify(page, email);

  await expect(page).toHaveURL(/\/onboarding/, SIGNED_IN);
  await expect(page.getByRole("heading", { name: "Name your corner of space" })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByLabel("Username").fill("admin");
  await expect(page.getByText("That name is kept for Worldling. Try another.")).toBeVisible();
  await page.getByLabel("Username").fill(username);
  await expect(page.getByText(`${username} is yours to take.`)).toBeVisible();
  await page.getByLabel("Display name").fill("E2E Explorer");
  await page.getByRole("button", { name: "Bring my world to life" }).click();

  await expect(page).toHaveURL(/\/me$/, SIGNED_IN);
  await expect(page.getByRole("heading", { name: "Your world is born" })).toBeVisible(SIGNED_IN);
  await expect(page.getByText(`/w/${username}`)).toBeVisible();

  // Signed in now, so the guest-only pages send us onwards.
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/me$/, SIGNED_IN);
});

test("reset a forgotten password with an emailed code", async ({ page }) => {
  const email = e2eEmail();
  await signUpAndVerify(page, email);
  await expect(page).toHaveURL(/\/onboarding/, SIGNED_IN);
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
  });

  await page.goto("/reset-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send me a code" }).click();
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await pasteCode(page, await waitForCode(email, "auth.reset"));
  await page.getByLabel("New password").fill("a brand new password");
  await page.getByRole("button", { name: "Save and sign in" }).click();
  await expect(page).toHaveURL(/\/onboarding/, SIGNED_IN);
});

test("signed-out visitors are sent to sign in, with the way back kept", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fsettings$/);
});

for (const route of ["/sign-up", "/sign-in", "/verify", "/reset-password"]) {
  test(`${route} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(route);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await expectNoAxeViolations(page);
  });
}

test("sign-in form is keyboard reachable in a sensible order", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("heading", { level: 1 }).waitFor();
  const google = page.getByRole("button", { name: "Continue with Google" });
  await google.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Forgot it?" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Show password" })).toBeFocused();
});
