import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import { createLogger } from "../lib/logger";
import { bootstrapAdmin as bootstrap } from "../model/admin";

/**
 * Creates the first admin (SPEC §6.6). Internal, so only the CLI with deploy access can run it:
 * `npx convex run --prod admin/system:bootstrapAdmin '{"email":"you@example.com"}'`
 */
export const bootstrapAdmin = internalMutation({
  args: { email: v.string() },
  returns: v.object({ userId: v.id("users"), username: v.string() }),
  handler: async (ctx, { email }) => {
    const rid = crypto.randomUUID();
    const log = createLogger({ rid, fn: "admin/system:bootstrapAdmin" });
    return await bootstrap({ ...ctx, rid, log }, email);
  },
});
