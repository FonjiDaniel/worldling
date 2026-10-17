import { v } from "convex/values";

import { publicQuery, signedInMutation } from "./lib/functions";
import { completeOnboarding as complete, meView, usernameAvailability } from "./model/profiles";
import { role, accountStatus, worldParamsV1 } from "./schema";

const usernameReason = v.union(
  v.literal("format"),
  v.literal("reserved"),
  v.literal("moderation"),
  v.literal("taken"),
);

/** The viewer's account state, or null when signed out (SPEC §5.5, §6.3). */
export const me = publicQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      needsOnboarding: v.boolean(),
      emailVerified: v.boolean(),
      profile: v.union(
        v.null(),
        v.object({
          username: v.string(),
          displayName: v.string(),
          role,
          status: accountStatus,
          suspensionReason: v.union(v.null(), v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx) => (ctx.viewer === null ? null : await meView(ctx, ctx.viewer)),
});

export const isUsernameAvailable = publicQuery({
  args: { username: v.string() },
  returns: v.union(
    v.object({ available: v.literal(true) }),
    v.object({ available: v.literal(false), reason: usernameReason }),
  ),
  handler: async (ctx, { username }) => await usernameAvailability(ctx, username),
});

/** Creates the profile and the primary world in one transaction (SPEC §6.3). */
export const completeOnboarding = signedInMutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    draft: v.optional(v.object({ name: v.string(), params: worldParamsV1 })),
  },
  returns: v.object({ username: v.string(), worldId: v.id("worlds") }),
  handler: async (ctx, args) => await complete(ctx, args),
});
