import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

import { waitForCode } from "./mailbox";

// Shared e2e steps: axe, the 8-digit code, and sign up through the e2e mailbox (ADR-016).

export const PASSWORD = "mossy river stones 42";
/** After signing in, the Convex websocket has to authenticate against the remote deployment. */
export const SIGNED_IN = { timeout: 20_000 };

export async function expectNoAxeViolations(page: Page) {
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

export async function pasteCode(page: Page, code: string) {
  if (page.context().browser()?.browserType().name() !== "chromium") {
    // Headless WebKit doesn't paste. Do what iOS autofill does instead: put the whole code
    // into the first box. Retried, in case the page hadn't hydrated yet.
    const first = page.getByRole("textbox", { name: "Digit 1 of 8" });
    await expect(async () => {
      await first.fill(code);
      await expect(page).not.toHaveURL(/\/verify$/, { timeout: 10_000 });
    }).toPass({ timeout: 45_000 });
    return;
  }
  // Chromium's clipboard waits forever in a page without focus, like a second context's page.
  await page.bringToFront();
  await page.evaluate(async (text) => {
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error("Clipboard write timed out"));
        }, 10_000),
      ),
    ]);
  }, code);
  // Paste into the middle cell: the whole code should still fill every cell.
  await page.getByRole("textbox", { name: "Digit 4 of 8" }).focus();
  await page.keyboard.press("ControlOrMeta+V");
}

/**
 * Waits until React has attached its props to the element. A value typed into a controlled
 * input before that is lost: slow WebKit hydration otherwise sends an empty email.
 */
export async function expectHydrated(element: Locator) {
  await expect
    .poll(
      () =>
        element.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps"))),
      { timeout: 30_000 },
    )
    .toBe(true);
}

/** Fills the sign-up form on the current page, then enters the emailed code. */
export async function completeSignUp(page: Page, email: string) {
  const emailField = page.getByLabel("Email");
  await expectHydrated(emailField);
  await emailField.fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create my world" }).click();
  // The first auth call can be slow while a 3D page is still busy in software WebGL.
  await expect(page).toHaveURL(/\/verify$/, SIGNED_IN);
  await expect(page.getByText(email)).toBeVisible();
  await pasteCode(page, await waitForCode(email, "auth.verify"));
}

export function randomUsername(): string {
  // Letters only: runs of random digits can read as a phone number to the moderation filter.
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(10)), (byte) =>
    String.fromCharCode(97 + (byte % 26)),
  ).join("");
  return `e2e_${suffix}`;
}
