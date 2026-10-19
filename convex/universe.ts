import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";

import { publicQuery } from "./lib/functions";
import {
  listPins,
  overview as readOverview,
  rail,
  renderable as readRenderable,
  sectorPins,
  searchPins,
} from "./model/universe";
import { worldParamsV1 } from "./schema";

// The universe (SPEC §5.5, ADR-024). Logic lives in model/universe.ts. Everything is public:
// the universe is open to signed-out visitors too.

const sectorPinFields = {
  id: v.id("worlds"),
  slot: v.number(),
  name: v.string(),
  username: v.string(),
  colorA: v.string(),
  colorB: v.string(),
  level: v.number(),
};

const listedPin = v.object({
  ...sectorPinFields,
  description: v.string(),
  thumbUrl: v.union(v.null(), v.string()),
});

/** Lightweight pins for up to 9 sectors. The client subscribes one sector per call. */
export const sectors = publicQuery({
  args: { keys: v.array(v.string()) },
  returns: v.array(v.object(sectorPinFields)),
  handler: async (ctx, { keys }) => await sectorPins(ctx, keys),
});

/** Full params for the few worlds drawn as full planets (max 12). */
export const renderable = publicQuery({
  args: { ids: v.array(v.id("worlds")) },
  returns: v.array(v.object({ id: v.id("worlds"), params: worldParamsV1, level: v.number() })),
  handler: async (ctx, { ids }) => await readRenderable(ctx, ids),
});

/** How many slots are taken (for slot dust) and whether live births are on. */
export const overview = publicQuery({
  args: {},
  returns: v.object({ slotCount: v.number(), live: v.boolean() }),
  handler: async (ctx) => await readOverview(ctx),
});

export const featured = publicQuery({
  args: {},
  returns: v.array(listedPin),
  handler: async (ctx) => await rail(ctx, "universe.featured"),
});

export const justBorn = publicQuery({
  args: {},
  returns: v.array(listedPin),
  handler: async (ctx) => await rail(ctx, "universe.justBorn"),
});

/** Worlds by username prefix ("mi" finds @mira). */
export const search = publicQuery({
  args: { q: v.string() },
  returns: v.array(listedPin),
  handler: async (ctx, { q }) => await searchPins(ctx, q),
});

/** Every world, newest first, with descriptions (list mode). */
export const list = publicQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(listedPin),
  handler: async (ctx, { paginationOpts }) => await listPins(ctx, paginationOpts),
});
