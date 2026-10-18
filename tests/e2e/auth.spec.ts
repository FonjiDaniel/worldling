import { expect, type Page, test } from "@playwright/test";

import {
  completeSignUp,
  expectNoAxeViolations,
  pasteCode,
  randomUsername,
  SIGNED_IN,
} from "./support/flows";
import { e2eEmail, waitForCode } from "./support/mailbox";

// Phase 4 acceptance (SPEC §15): sign up -> verify -> onboarding, against the dev deployment
// with the e2e mailbox (ADR-016). Run `npx convex dev` (or be logged in to it) first.

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

async function signUpAndVerify(page: Page, email: string) {
  await page.goto("/sign-up");
  await completeSignUp(page, email);
}

test("sign up, verify with a pasted code, then onboard", async ({ page }) => {
  // Ends on the new world page, which renders 3D in software WebGL.
  test.setTimeout(90_000);
  const email = e2eEmail();
  const username = randomUsername();

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

  await expect(page).toHaveURL(new RegExp(`/w/${username}$`), SIGNED_IN);
  await expect(page.getByText("Your world is here. Make yourself at home.")).toBeVisible(SIGNED_IN);
  await expect(page.getByText(`@${username}`, { exact: true })).toBeVisible();

  // Signed in now, so the guest-only pages send us onwards, to our own world.
  await page.goto("/sign-in");
  await expect(page).toHaveURL(new RegExp(`/w/${username}$`), SIGNED_IN);
});

test("reset a forgotten password with an emailed code", async ({ page }) => {
  test.setTimeout(90_000);
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

  test(`${route} on a phone has no serious or critical axe violations`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
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
