import { v } from "convex/values";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, internalMutation, type MutationCtx } from "../_generated/server";
import { maskEmail } from "./logger";

// Every job writes a jobRuns row: start, finish, ok, processed, error (SPEC §5.6).

const MAX_ERROR_LENGTH = 500;

function errorText(error: unknown): string {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  return maskEmail(text).slice(0, MAX_ERROR_LENGTH);
}

export const start = internalMutation({
  args: { job: v.string() },
  returns: v.id("jobRuns"),
  handler: async (ctx, { job }) => {
    return await ctx.db.insert("jobRuns", { job, startedAt: Date.now() });
  },
});

export const finish = internalMutation({
  args: {
    runId: v.id("jobRuns"),
    ok: v.boolean(),
    processed: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { runId, ...result }) => {
    await ctx.db.patch(runId, { ...result, finishedAt: Date.now() });
    return null;
  },
});

/**
 * Runs an action job and records it. `run` returns how many items it processed.
 * Failures are recorded and rethrown.
 */
export async function withJobRun(
  ctx: ActionCtx,
  job: string,
  run: () => Promise<number>,
): Promise<number> {
  const runId: Id<"jobRuns"> = await ctx.runMutation(internal.lib.jobRuns.start, { job });
  try {
    const processed = await run();
    await ctx.runMutation(internal.lib.jobRuns.finish, { runId, ok: true, processed });
    return processed;
  } catch (error) {
    await ctx.runMutation(internal.lib.jobRuns.finish, {
      runId,
      ok: false,
      error: errorText(error),
    });
    throw error;
  }
}

/**
 * Runs a mutation job and records it in the same transaction. A throw rolls back the
 * whole run including its row, so failed mutation jobs show up as missing (late) runs.
 */
export async function withJobRunInMutation(
  ctx: MutationCtx,
  job: string,
  run: () => Promise<number>,
): Promise<number> {
  const startedAt = Date.now();
  const processed = await run();
  await ctx.db.insert("jobRuns", {
    job,
    startedAt,
    finishedAt: Date.now(),
    ok: true,
    processed,
  });
  return processed;
}
