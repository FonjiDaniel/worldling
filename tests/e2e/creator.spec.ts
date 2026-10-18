import { expect, type Page, test } from "@playwright/test";

import { convexRun } from "./support/convex";
import { completeSignUp, expectNoAxeViolations, randomUsername, SIGNED_IN } from "./support/flows";
import { e2eEmail } from "./support/mailbox";

// Phase 6 acceptance (SPEC §15): a guest makes a world, claims it by signing up, and the world
// exists with the same params and a WebP thumbnail. Runs on desktop Chrome, Pixel 7 (Chrome)
// and iPhone 14 (WebKit, whose canvas can't encode WebP, so the WASM encoder runs). Needs the
// dev deployment, like auth.spec.ts.

const DRAFT_KEY = "worldling:draft:v1";
/** SwiftShader renders slowly; a render tier keeps thumbnails possible on every machine. */
const QUALITY_KEY = "worldling:quality:v1";

interface StoredWorld {
  name: string;
  params: Record<string, unknown> & { terrain: { seaLevel: number } };
  thumbnail: { id: string; contentType: string; size: number } | null;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "1");
  }, QUALITY_KEY);
});

async function openCreator(page: Page) {
  await page.goto("/create");
  await expect(page.getByRole("heading", { name: "Your world" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("img", { name: /world with/ })).toBeVisible();
}

async function readDraft(page: Page): Promise<{ name: string; params: unknown } | null> {
  const raw = await page.evaluate((key) => localStorage.getItem(key), DRAFT_KEY);
  return raw === null ? null : (JSON.parse(raw) as { name: string; params: unknown });
}

async function sliderValue(page: Page, name: string): Promise<string | null> {
  return await page.getByRole("slider", { name }).getAttribute("aria-valuenow");
}

/** Polls the stored world until `ready` says yes. */
async function waitForWorld(
  email: string,
  ready: (world: StoredWorld) => boolean,
): Promise<StoredWorld> {
  const latest: { world: StoredWorld | null } = { world: null };
  await expect
    .poll(
      async () => {
        latest.world = (await convexRun("testing/e2e:worldFor", { email })) as StoredWorld | null;
        return latest.world !== null && ready(latest.world);
      },
      { timeout: 60_000, intervals: [1000] },
    )
    .toBe(true);
  if (latest.world === null) throw new Error("No world");
  return latest.world;
}

test("a guest shapes a world, claims it, and it arrives with a thumbnail", async ({
  page,
  context,
  browserName,
}) => {
  test.setTimeout(240_000);
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  const email = e2eEmail();
  const username = randomUsername();

  await openCreator(page);
  await page.getByRole("radio", { name: "Frozen" }).click();
  await expect(page.getByRole("radio", { name: "Frozen" })).toBeChecked();

  const terrain = page.getByRole("slider", { name: "Terrain" });
  const before = await sliderValue(page, "Terrain");
  await terrain.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const moved = await sliderValue(page, "Terrain");
  expect(moved).not.toBe(before);
  await page.keyboard.press("ControlOrMeta+Z");
  await expect(terrain).toHaveAttribute("aria-valuenow", String(Number(moved) - 1));
  await page.keyboard.press("Shift+ControlOrMeta+Z");
  await expect(terrain).toHaveAttribute("aria-valuenow", moved ?? "");

  await page.getByRole("button", { name: "Randomize" }).click();
  await page.getByRole("tab", { name: "Details" }).click();
  await page.getByLabel("World name").fill("Haven of Tides");
  await page.getByLabel("World name").blur();

  await expect.poll(async () => (await readDraft(page))?.name).toBe("Haven of Tides");
  const draft = await readDraft(page);
  await page.reload();
  await expect(page.getByText("Haven of Tides").first()).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Claim this world" }).click();
  await expect(page).toHaveURL(/\/sign-up\?next=%2Fonboarding$/, { timeout: 30_000 });
  await completeSignUp(page, email);

  await expect(page).toHaveURL(/\/onboarding/, SIGNED_IN);
  await expect(page.getByText("Haven of Tides comes with you.")).toBeVisible();
  await page.getByLabel("Username").fill(username);
  await expect(page.getByText(`${username} is yours to take.`)).toBeVisible();
  await page.getByLabel("Display name").fill("E2E Maker");
  await page.getByRole("button", { name: "Bring my world to life" }).click();

  await expect(page).toHaveURL(new RegExp(`/w/${username}$`), SIGNED_IN);
  await expect(page.getByText("Your world is here. Make yourself at home.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Haven of Tides" })).toBeVisible();
  await expectNoAxeViolations(page);

  const claimed = await waitForWorld(email, (world) => world.thumbnail !== null);
  expect(claimed.name).toBe("Haven of Tides");
  expect(claimed.params).toEqual(draft?.params);
  expect(claimed.thumbnail?.contentType).toBe("image/webp");
  expect(claimed.thumbnail?.size).toBeLessThanOrEqual(300 * 1024);
  expect(await readDraft(page)).toBeNull();

  // The owner edits: change the ocean and save. The new params and a new thumbnail arrive.
  await page.getByRole("link", { name: "Edit my world" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeDisabled({ timeout: 30_000 });
  const ocean = page.getByRole("slider", { name: "Ocean", exact: true });
  await ocean.focus();
  for (let i = 0; i < 5; i += 1) await page.keyboard.press("ArrowLeft");
  await page.getByRole("button", { name: "Save my world" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
  const firstThumbnail = claimed.thumbnail?.id;
  const edited = await waitForWorld(
    email,
    (world) => world.thumbnail !== null && world.thumbnail.id !== firstThumbnail,
  );
  expect(edited.params.terrain.seaLevel).not.toBe(claimed.params.terrain.seaLevel);
});

test("the creator is accessible and keeps the draft", async ({ page, isMobile }) => {
  // axe shares the main thread with software WebGL in headless runs.
  test.setTimeout(180_000);
  await openCreator(page);
  await expectNoAxeViolations(page);

  if (isMobile) {
    const handle = page.getByRole("button", { name: "Show more controls" });
    await expect(handle).toHaveAttribute("aria-expanded", "true");
    await handle.click();
    await expect(page.getByRole("button", { name: "Show less" })).toBeVisible();
    await page.getByRole("button", { name: "Show less" }).click();
    await expect(page.getByRole("button", { name: "Show the controls" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.getByRole("button", { name: "Show the controls" }).click();
  }

  // Pick a biome the random world doesn't already have, so the click is a change.
  const desert = page.getByRole("radio", { name: "Desert" });
  const biome = (await desert.isChecked()) ? "Crystal" : "Desert";
  await page.getByRole("radio", { name: biome }).click();
  await expect
    .poll(async () => JSON.stringify(await readDraft(page)))
    .toContain(`"${biome.toLowerCase()}"`);
  await page.reload();
  await expect(page.getByRole("radio", { name: biome })).toBeChecked({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Claim this world" })).toBeVisible();
});
