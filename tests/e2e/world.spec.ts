import { type APIRequestContext, type Browser, expect, type Page, test } from "@playwright/test";

import { convexRun } from "./support/convex";
import { completeSignUp, expectNoAxeViolations, randomUsername, SIGNED_IN } from "./support/flows";
import { e2eEmail } from "./support/mailbox";

// Phase 7 acceptance (SPEC §15): the world page tends and counts visits, the owner can toggle
// comet review, sharing works (native sheet on phones, copy link on desktop), comets show, and
// the OG image renders with and without a thumbnail. Needs the dev deployment.

const QUALITY_KEY = "worldling:quality:v1";

interface WorldState {
  xp: number;
  level: number;
  cometReview: boolean;
  visits: number;
  hasThumbnail: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);
const stateFor = async (email: string) =>
  (await convexRun("testing/world:worldState", { email, day: today() })) as WorldState;
const runBloom = () => convexRun("jobs/bloom:bloomProcessor", {});
/**
 * Each CLI call takes 5 to 10 seconds, far more while software WebGL is busy. Polls only read
 * state; the cron runs the processor every minute, so the wait is bounded without extra calls.
 */
const SERVER_POLL = { timeout: 180_000, intervals: [2000] };

/** Records navigator.share calls, so phones can be checked without the OS sheet. */
async function stubShareSheet(page: Page) {
  await page.addInitScript(() => {
    const calls: ShareData[] = [];
    Object.defineProperty(window, "__shares", { value: calls });
    navigator.share = (data?: ShareData) => {
      calls.push(data ?? {});
      return Promise.resolve();
    };
    navigator.canShare = () => true;
  });
}

async function signUpWithWorld(page: Page, displayName: string) {
  const email = e2eEmail();
  const username = randomUsername();
  await page.goto("/sign-up?next=/onboarding");
  await completeSignUp(page, email);
  await expect(page).toHaveURL(/\/onboarding/, SIGNED_IN);
  await page.getByLabel("Username").fill(username);
  await expect(page.getByText(`${username} is yours to take.`)).toBeVisible();
  await page.getByLabel("Display name").fill(displayName);
  await page.getByRole("button", { name: "Bring my world to life" }).click();
  await expect(page).toHaveURL(new RegExp(`/w/${username}$`), SIGNED_IN);
  return { email, username };
}

async function newVisitor(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext(baseURL === undefined ? {} : { baseURL });
  if (browser.browserType().name() === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  await context.addInitScript((key) => {
    localStorage.setItem(key, "1");
  }, QUALITY_KEY);
  return await context.newPage();
}

/** Width and height from a PNG's IHDR chunk. */
function pngSize(bytes: Buffer): { width: number; height: number } {
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function expectOgImage(page: Page, request: APIRequestContext) {
  const src = await page.locator('meta[property="og:image"]').getAttribute("content");
  if (src === null) throw new Error("No og:image");
  const response = await request.get(new URL(src).pathname + new URL(src).search);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  expect(pngSize(await response.body())).toEqual({ width: 1200, height: 630 });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "1");
  }, QUALITY_KEY);
});

test("an owner tends, shares and reviews; a visitor counts after 3 seconds", async ({
  page,
  context,
  browser,
  browserName,
  isMobile,
  baseURL,
  request,
}) => {
  // Two sign-ups and a 3D page in software WebGL.
  test.setTimeout(600_000);
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  if (isMobile) await stubShareSheet(page);
  const owner = await signUpWithWorld(page, "E2E Gardener");

  await page.getByRole("button", { name: "View my world" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Bloom level" })).toBeVisible();

  // Tend: the first open of the day queues +10, the processor applies it.
  await expect.poll(async () => (await stateFor(owner.email)).xp, SERVER_POLL).toBe(10);

  // Comet review persists across a reload.
  const review = page.getByRole("switch", { name: "Review comets before they appear" });
  await review.click();
  await expect(review).toBeChecked();
  await expect.poll(async () => (await stateFor(owner.email)).cometReview, SERVER_POLL).toBe(true);
  await page.reload();
  await expect(review).toBeChecked(SIGNED_IN);

  // Share: the native sheet on phones, the copy link popover on desktop.
  const share = page.getByRole("button", { name: "Share my world" }).last();
  const worldUrl = new URL(`/w/${owner.username}`, baseURL).pathname;
  await share.click();
  if (isMobile) {
    const shares = await page.evaluate(
      () => (window as unknown as { __shares: ShareData[] }).__shares,
    );
    expect(shares).toHaveLength(1);
    expect(new URL(shares[0]?.url ?? "").pathname).toBe(worldUrl);
    expect(shares[0]?.url).not.toContain("utm_");
  } else {
    await page.getByRole("button", { name: "Copy link" }).click();
    await expect(page.getByText("Link copied")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
    const copied = await page.evaluate(async () => navigator.clipboard.readText());
    expect(new URL(copied).pathname).toBe(worldUrl);
    await page.keyboard.press("Escape");
  }

  // Comets arrive in the list (sending them is Phase 9, so they're seeded).
  await convexRun("testing/world:seedComets", {
    email: owner.email,
    bodies: ["Your oceans made my day.", "What a calm little world."],
  });
  await expect(page.getByText("What a calm little world.")).toBeVisible(SIGNED_IN);
  await expectNoAxeViolations(page);

  // A second account visits. One visit, after 3 seconds of the page being visible.
  const visitor = await newVisitor(browser, baseURL);
  await signUpWithWorld(visitor, "E2E Visitor");
  await visitor.goto(`/w/${owner.username}`);
  await expect(visitor.getByRole("button", { name: "Share this world" }).last()).toBeVisible(
    SIGNED_IN,
  );
  await expect
    .poll(async () => await stateFor(owner.email), SERVER_POLL)
    .toMatchObject({ visits: 1, xp: 12 });
  await visitor.reload();
  await visitor.waitForTimeout(5000);
  await runBloom();
  expect((await stateFor(owner.email)).visits).toBe(1);
  await visitor.context().close();

  // The OG image, with the thumbnail the owner's page made and without one.
  await expect
    .poll(async () => (await stateFor(owner.email)).hasThumbnail, {
      timeout: 60_000,
    })
    .toBe(true);
  await expectOgImage(page, request);
  await convexRun("testing/world:clearThumbnail", { email: owner.email });
  await expectOgImage(page, request);
});

test("an unknown world has a friendly page and the generic share image", async ({
  page,
  request,
}) => {
  await page.goto(`/w/${randomUsername()}`);
  await expect(page.getByText("This world isn't available.")).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveTitle("World not found · Worldling");
  await expectOgImage(page, request);
});
