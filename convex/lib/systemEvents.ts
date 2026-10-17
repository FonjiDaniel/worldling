import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import type { LogEntry } from "./logger";

// Persisted warn/error events from actions and jobs (SPEC §10.3). Queries and mutations only
// log to the console, because a thrown mutation would roll back the insert.

const MAX_EVENTS_PER_CALL = 50;
const MAX_MESSAGE_LENGTH = 500;
// Stored as columns (or dropped), so they are left out of `context`. `fn` stays in context.
const ENVELOPE_KEYS = new Set(["level", "event", "rid", "message", "ts", "uid"]);

export const systemEventValidator = v.object({
  level: v.union(v.literal("warn"), v.literal("error")),
  source: v.string(),
  code: v.string(),
  message: v.string(),
  context: v.optional(v.any()),
  rid: v.optional(v.string()),
});

export type SystemEvent = typeof systemEventValidator.type;

/** Maps an already-redacted log entry to a row: `email.dispatch.failed` -> source `email.dispatch`. */
export function toSystemEvent(entry: LogEntry & { level: "warn" | "error" }): SystemEvent {
  const { level, event, rid, message } = entry;
  const context = Object.fromEntries(
    Object.entries(entry).filter(([key]) => !ENVELOPE_KEYS.has(key)),
  );
  const text = typeof message === "string" ? message : event;
  return {
    level,
    source: event.split(".").slice(0, 2).join("."),
    code: event,
    message: text.slice(0, MAX_MESSAGE_LENGTH),
    context,
    rid,
  };
}

export const record = internalMutation({
  args: { events: v.array(systemEventValidator) },
  returns: v.null(),
  handler: async (ctx, { events }) => {
    for (const event of events.slice(0, MAX_EVENTS_PER_CALL)) {
      await ctx.db.insert("systemEvents", event);
    }
    return null;
  },
});
