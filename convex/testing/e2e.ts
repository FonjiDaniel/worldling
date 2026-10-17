import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import { isE2eMailboxEnabled, isE2eRecipient } from "../email/envConfig";

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

/** Returns and deletes the newest email for `to`, or null when nothing has arrived yet. */
export const takeLatestEmail = internalMutation({
  args: { to: v.string() },
  returns: v.union(v.null(), v.object({ template: v.string(), data: v.any() })),
  handler: async (ctx, { to }) => {
    assertEnabled();
    const row = await ctx.db
      .query("e2eMailbox")
      .withIndex("by_to", (q) => q.eq("to", to.toLowerCase()))
      .order("desc")
      .first();
    if (row === null) return null;
    await ctx.db.delete("e2eMailbox", row._id);
    const data: unknown = row.data;
    return { template: row.template, data };
  },
});
