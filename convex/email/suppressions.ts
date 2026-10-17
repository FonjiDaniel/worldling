import { v } from "convex/values";

import { internalMutation } from "../_generated/server";

// Suppressions stop non-security mail per address and scope (SPEC §5.2, §7.8).

const scope = v.union(
  v.literal("all_non_security"),
  v.literal("digest"),
  v.literal("comet_alerts"),
  v.literal("product"),
);
const reason = v.union(
  v.literal("unsubscribed"),
  v.literal("bounced"),
  v.literal("complained"),
  v.literal("admin"),
);

/** Adds a suppression. Repeats for the same address and scope are a no-op. */
export const add = internalMutation({
  args: { email: v.string(), scope, reason },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("emailSuppressions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .take(10);
    if (existing.some((row) => row.scope === args.scope)) return false;
    await ctx.db.insert("emailSuppressions", { email, scope: args.scope, reason: args.reason });
    return true;
  },
});
