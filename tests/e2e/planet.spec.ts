import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Planet renderer (SPEC §8.3, §8.9). Headless Chromium renders WebGL with SwiftShader.
test.use({
  launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
});

const STILL = "/dev/planet?freeze=1&tier=1";
const RENDER_WAIT_MS = 4000;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("renders every preset with a text description and no shader errors", async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectErrors(page);
  await page.goto(STILL);
  const worlds = page.getByRole("img", { name: /world with/ });
  await expect(worlds).toHaveCount(6);
  await expect(worlds.first()).toHaveAccessibleName(/^An oceanic world with .+\.$/);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(RENDER_WAIT_MS);
  expect(errors).toEqual([]);
});

test("the same params render the same world", async ({ page }) => {
  test.setTimeout(120_000);
  const capture = async () => {
    await page.goto(`${STILL}&focus=desert`);
    await page.waitForTimeout(RENDER_WAIT_MS);
    return page.getByRole("img", { name: /^A desert world/ }).screenshot();
  };
  const first = await capture();
  const second = await capture();
  expect(first.equals(second)).toBe(true);
});

test("the pause control stops ambient motion", async ({ page }) => {
  await page.goto("/dev/planet?freeze=1&tier=1&focus=oceanic");
  const pause = page.getByRole("button", { name: "Pause motion" });
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await pause.click();
  await expect(pause).toHaveAttribute("aria-pressed", "true");
});

test("has no serious or critical axe violations", async ({ page }) => {
  await page.goto(STILL);
  await page
    .getByRole("img", { name: /world with/ })
    .first()
    .waitFor();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(blocking.map((violation) => violation.id)).toEqual([]);
});

test("without WebGL every world falls back to a flat disc", async ({ page }) => {
  await page.addInitScript(() => {
    const proto = HTMLCanvasElement.prototype;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- re-applied with the caller's this
    proto.getContext = new Proxy(proto.getContext, {
      apply(target, canvas: HTMLCanvasElement, args: [string, ...unknown[]]): unknown {
        return args[0].startsWith("webgl")
          ? null
          : (Reflect.apply(target, canvas, args) as unknown);
      },
    });
  });
  await page.goto("/dev/planet?freeze=1");
  await expect(page.getByRole("img", { name: /world with/ })).toHaveCount(6);
  await expect(page.locator(".planet-disc")).toHaveCount(6);
  await expect(page.locator("canvas")).toHaveCount(0);
});
