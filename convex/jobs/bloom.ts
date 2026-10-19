import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { withJobRunInMutation } from "../lib/jobRuns";
import { createLogger } from "../lib/logger";
import { applyBloomBatch } from "../model/bloom";

// jobs.bloomProcessor (SPEC §5.6): drains bloomQueue every minute, and keeps going while a
// full batch suggests more rows are waiting.

export const BLOOM_BATCH = 500;

export const bloomProcessor = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const log = createLogger({ rid: crypto.randomUUID(), fn: "jobs/bloom:bloomProcessor" });
    return await withJobRunInMutation(ctx, "jobs.bloomProcessor", async () => {
      const rows = await ctx.db.query("bloomQueue").take(BLOOM_BATCH);
      if (rows.length === 0) return 0;
      const result = await applyBloomBatch({ ...ctx, log }, rows);
      log.info("bloom.batch.processed", { ...result });
      if (rows.length === BLOOM_BATCH) {
        await ctx.scheduler.runAfter(0, internal.jobs.bloom.bloomProcessor, {});
      }
      return result.processed;
    });
  },
});
