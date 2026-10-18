import { v } from "convex/values";

import { internalMutation, internalQuery } from "../_generated/server";
import { isE2eMailboxEnabled, isE2eRecipient } from "../email/envConfig";
import { primaryWorld } from "../model/worlds";

// The e2e mailbox (ADR-016). Internal, so only the CLI with deploy access can read it, and
// both functions refuse on production even then.

function assertEnabled(): void {
  if (!isE2eMailboxEnabled()) throw new Error("The e2e mailbox is off on this deployment");
}

export const record = internalMutation({
  args: { to: v.string(), template: v.string(), data: v.any() },
  returns: v.null(),
  handler: async (ctx, { to, template, data }) => {
    assertEnabled();
    if (!isE2eRecipient(to)) throw new Error("Not an e2e recipient");
    await ctx.db.insert("e2eMailbox", { to: to.toLowerCase(), template, data: data as unknown });
    return null;
  },
});

const MAX_SCAN = 20;

/**
 * Returns and deletes the newest email for `to` (optionally of one template), or null when
 * nothing has arrived yet.
 */
export const takeLatestEmail = internalMutation({
  args: { to: v.string(), template: v.optional(v.string()) },
  returns: v.union(v.null(), v.object({ template: v.string(), data: v.any() })),
  handler: async (ctx, { to, template }) => {
    assertEnabled();
    const rows = await ctx.db
      .query("e2eMailbox")
      .withIndex("by_to", (q) => q.eq("to", to.toLowerCase()))
      .order("desc")
      .take(MAX_SCAN);
    const row = rows.find((candidate) => template === undefined || candidate.template === template);
    if (row === undefined) return null;
    await ctx.db.delete("e2eMailbox", row._id);
    const data: unknown = row.data;
    return { template: row.template, data };
  },
});

/** The primary world of an e2e account, with its thumbnail file's metadata (Phase 6 e2e). */
export const worldFor = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      name: v.string(),
      params: v.any(),
      thumbnail: v.union(v.null(), v.object({ contentType: v.string(), size: v.number() })),
    }),
  ),
  handler: async (ctx, { email }) => {
    assertEnabled();
    if (!isE2eRecipient(email)) throw new Error("Not an e2e recipient");
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    if (user === null) return null;
    const world = await primaryWorld(ctx, user._id);
    if (world === null) return null;
    const file =
      world.thumbnailId === undefined
        ? null
        : await ctx.db.system.get("_storage", world.thumbnailId);
    const params: unknown = world.params;
    return {
      name: world.name,
      params,
      thumbnail: file === null ? null : { contentType: file.contentType ?? "", size: file.size },
    };
  },
});
