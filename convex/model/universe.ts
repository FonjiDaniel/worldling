import type { PaginationOptions, PaginationResult } from "convex/server";

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { getSetting, isFlagOn } from "../lib/settings";
import { isSectorKey, MAX_SECTORS } from "../shared/galaxy";
import { PIN_SECTOR_CAP, RENDERABLE_LIMIT, SEARCH_LIMIT } from "../shared/pins";
import { normalizeUsername } from "../shared/usernames";
import type { WorldParams } from "../shared/worldParams";

// The universe (SPEC §2.5, §5.5, §8.4, ADR-012, ADR-024). Everything reads worldPins, which
// only holds public worlds with active owners, so no query here re-checks visibility.

type ReadCtx = Pick<QueryCtx, "db" | "storage">;
type Pin = Doc<"worldPins">;

export interface SectorPin {
  id: Id<"worlds">;
  slot: number;
  name: string;
  username: string;
  colorA: string;
  colorB: string;
  level: number;
}

export interface ListedPin extends SectorPin {
  description: string;
  thumbUrl: string | null;
}

const sectorPin = (pin: Pin): SectorPin => ({
  id: pin.worldId,
  slot: pin.slot,
  name: pin.name,
  username: pin.username,
  colorA: pin.colorA,
  colorB: pin.colorB,
  level: pin.level,
});

async function listedPin(ctx: ReadCtx, pin: Pin): Promise<ListedPin> {
  return {
    ...sectorPin(pin),
    description: pin.description,
    thumbUrl: pin.thumbnailId === undefined ? null : await ctx.storage.getUrl(pin.thumbnailId),
  };
}

/** Pins for up to 9 sectors, in slot order. Malformed and repeated keys are skipped. */
export async function sectorPins(ctx: ReadCtx, keys: readonly string[]): Promise<SectorPin[]> {
  const wanted = [...new Set(keys.filter(isSectorKey))].slice(0, MAX_SECTORS);
  const pins: SectorPin[] = [];
  for (const key of wanted) {
    const rows = await ctx.db
      .query("worldPins")
      .withIndex("by_sector_slot", (q) => q.eq("sectorKey", key))
      .take(PIN_SECTOR_CAP);
    for (const row of rows) pins.push(sectorPin(row));
  }
  return pins;
}

export interface RenderableWorld {
  id: Id<"worlds">;
  params: WorldParams;
  level: number;
}

/** Full params for the near LOD. Worlds without a pin (hidden, inactive owner) are left out. */
export async function renderable(
  ctx: ReadCtx,
  ids: readonly Id<"worlds">[],
): Promise<RenderableWorld[]> {
  const result: RenderableWorld[] = [];
  for (const id of [...new Set(ids)].slice(0, RENDERABLE_LIMIT)) {
    const pin = await ctx.db
      .query("worldPins")
      .withIndex("by_world", (q) => q.eq("worldId", id))
      .unique();
    const world = pin === null ? null : await ctx.db.get("worlds", id);
    if (world !== null) result.push({ id, params: world.params, level: world.bloom.level });
  }
  return result;
}

export async function overview(ctx: ReadCtx): Promise<{ slotCount: number; live: boolean }> {
  const galaxy = await ctx.db.query("galaxy").first();
  return { slotCount: galaxy?.nextSlot ?? 0, live: await isFlagOn(ctx, "universe.live") };
}

/** Pins for a precomputed rail, in list order, skipping worlds that left since. */
export async function rail(
  ctx: ReadCtx,
  key: "universe.featured" | "universe.justBorn",
): Promise<ListedPin[]> {
  const ids = await getSetting(ctx, key);
  const pins: ListedPin[] = [];
  for (const raw of ids) {
    const id = ctx.db.normalizeId("worlds", raw);
    if (id === null) continue;
    const pin = await ctx.db
      .query("worldPins")
      .withIndex("by_world", (q) => q.eq("worldId", id))
      .unique();
    if (pin !== null) pins.push(await listedPin(ctx, pin));
  }
  return pins;
}

/** Up to 6 worlds whose owner's username starts with `raw`. */
export async function searchPins(ctx: ReadCtx, raw: string): Promise<ListedPin[]> {
  const prefix = normalizeUsername(raw.slice(0, 64)).replace(/[^a-z0-9_]/g, "");
  if (prefix.length === 0) return [];
  // "~" sorts after every username character, so this is the prefix range.
  const rows = await ctx.db
    .query("worldPins")
    .withIndex("by_username", (q) => q.gte("username", prefix).lt("username", `${prefix}~`))
    .take(SEARCH_LIMIT);
  return await Promise.all(rows.map((row) => listedPin(ctx, row)));
}

/** Every world, newest first, for list mode. */
export async function listPins(
  ctx: ReadCtx,
  paginationOpts: PaginationOptions,
): Promise<PaginationResult<ListedPin>> {
  const page = await ctx.db
    .query("worldPins")
    .withIndex("by_slot")
    .order("desc")
    .paginate(paginationOpts);
  return { ...page, page: await Promise.all(page.page.map((row) => listedPin(ctx, row))) };
}
