import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import { withJobRunInMutation } from "../lib/jobRuns";
import { createLogger } from "../lib/logger";
import { refreshRails } from "../model/rails";

// jobs.rollups.trending (SPEC §5.6, ADR-024): hourly, writes the featured and just born lists
// into settings keys, so the universe rails never scan worlds per viewer.

export const trending = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const log = createLogger({ rid: crypto.randomUUID(), fn: "jobs/rollups:trending" });
    return await withJobRunInMutation(ctx, "jobs.rollups.trending", async () => {
      const result = await refreshRails(ctx);
      log.info("universe.rails.refreshed", { ...result });
      return result.featured + result.justBorn;
    });
  },
});
