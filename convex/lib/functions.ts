import { getAuthUserId } from "@convex-dev/auth/server";
import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import {
  type ActionCtx,
  httpAction,
  internalAction,
  mutation,
  type MutationCtx,
  query,
  type QueryCtx,
} from "../_generated/server";
import { appError, withRid } from "./errors";
import { createLogger, type LogEntry, type Logger } from "./logger";
import { getSetting } from "./settings";
import { toSystemEvent } from "./systemEvents";

// Every public Convex function goes through these wrappers (SPEC §5.3, ADR-005, ADR-010).
// Raw query/mutation/action are only allowed for internal* functions.

type Role = Doc<"profiles">["role"];

/** A signed-in viewer; `profile` is null until onboarding is complete. */
export interface Viewer {
  userId: Id<"users">;
  profile: Doc<"profiles"> | null;
}

/** A signed-in, onboarded, active viewer. */
export interface ActiveViewer {
  userId: Id<"users">;
  profile: Doc<"profiles">;
}

interface RequestState {
  rid: string;
  events: LogEntry[];
}

const ROLE_RANK: Record<Role, number> = { user: 0, moderator: 1, admin: 2 };

type Handler<Ctx> = (ctx: Ctx, args: unknown) => Promise<unknown>;

/**
 * Wraps a raw builder so each call gets a request id (passed to the customization as
 * `ctx.request`), app errors leave with that rid attached, and `after` runs once at the end.
 */
function tracked<Builder>(
  builder: Builder,
  after?: (ctx: never, state: RequestState) => Promise<void>,
): Builder {
  const register = builder as unknown as (definition: { handler: Handler<object> }) => unknown;
  const wrapped = (definition: { handler: Handler<object> }) =>
    register({
      ...definition,
      handler: async (ctx, args) => {
        const state: RequestState = { rid: crypto.randomUUID(), events: [] };
        try {
          return await definition.handler({ ...ctx, request: state }, args);
        } catch (error) {
          throw withRid(error, state.rid);
        } finally {
          await after?.(ctx as never, state);
        }
      },
    });
  return wrapped as unknown as Builder;
}

function requestOf(ctx: object): RequestState {
  const request: unknown = Reflect.get(ctx, "request");
  if (typeof request === "object" && request !== null && "rid" in request) {
    return request as RequestState;
  }
  throw new Error("Function wrapper misconfigured: missing request state");
}

async function functionName(ctx: QueryCtx | ActionCtx): Promise<string> {
  try {
    return (await ctx.meta.getFunctionMetadata()).name;
  } catch {
    return "unknown";
  }
}

async function loadViewer(ctx: QueryCtx): Promise<Viewer | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return { userId, profile };
}

/** Throws unless the viewer is signed in, onboarded, active and at least `minRole`. */
function requireViewer(viewer: Viewer | null, minRole: Role): ActiveViewer {
  if (viewer === null || viewer.profile?.status === "deleting") {
    throw appError("UNAUTHENTICATED", "Sign in required");
  }
  const { profile } = viewer;
  if (profile === null) {
    throw appError("PRECONDITION", "Onboarding required", { reason: "needs_onboarding" });
  }
  if (profile.status === "suspended") throw appError("SUSPENDED", "Account suspended");
  if (ROLE_RANK[profile.role] < ROLE_RANK[minRole]) {
    throw appError("FORBIDDEN", `Requires role ${minRole}`);
  }
  return { userId: viewer.userId, profile };
}

async function requestCtx(ctx: QueryCtx | ActionCtx, uid?: string) {
  const { rid } = requestOf(ctx);
  const log = createLogger({ rid, fn: await functionName(ctx), uid });
  return { rid, log };
}

async function publicCtx(ctx: QueryCtx) {
  const loaded = await loadViewer(ctx);
  const viewer = loaded?.profile?.status === "deleting" ? null : loaded;
  return { ...(await requestCtx(ctx, viewer?.userId)), viewer };
}

async function viewerCtx(ctx: QueryCtx, minRole: Role) {
  const viewer = requireViewer(await loadViewer(ctx), minRole);
  return { ...(await requestCtx(ctx, viewer.userId)), viewer };
}

async function assertNoMaintenance(ctx: MutationCtx, log: Logger, role: Role | undefined) {
  if (role === "admin") return;
  const maintenance = await getSetting({ db: ctx.db, log }, "maintenance");
  if (maintenance.enabled) throw appError("MAINTENANCE", "Maintenance mode is on");
}

async function mutationCtx(ctx: MutationCtx, minRole: Role) {
  const custom = await viewerCtx(ctx, minRole);
  await assertNoMaintenance(ctx, custom.log, custom.viewer.profile.role);
  return custom;
}

/** Signed in, any profile state (none yet, active or suspended), never `deleting`. */
async function signedInCtx(ctx: MutationCtx) {
  const viewer = await loadViewer(ctx);
  if (viewer === null || viewer.profile?.status === "deleting") {
    throw appError("UNAUTHENTICATED", "Sign in required");
  }
  const custom = { ...(await requestCtx(ctx, viewer.userId)), viewer };
  await assertNoMaintenance(ctx, custom.log, viewer.profile?.role);
  return custom;
}

const trackedQuery = tracked(query);
const trackedMutation = tracked(mutation);

/** No auth required. `ctx.viewer` is null when signed out; suspended viewers pass through. */
export const publicQuery = customQuery(trackedQuery, customCtx(publicCtx));

export const userQuery = customQuery(
  trackedQuery,
  customCtx((ctx: QueryCtx) => viewerCtx(ctx, "user")),
);
export const staffQuery = customQuery(
  trackedQuery,
  customCtx((ctx: QueryCtx) => viewerCtx(ctx, "moderator")),
);
export const adminQuery = customQuery(
  trackedQuery,
  customCtx((ctx: QueryCtx) => viewerCtx(ctx, "admin")),
);

/**
 * For the few account actions that must work before onboarding or while suspended:
 * `completeOnboarding` and `signOutEverywhere`. `ctx.viewer.profile` may be null.
 */
export const signedInMutation = customMutation(trackedMutation, customCtx(signedInCtx));

export const userMutation = customMutation(
  trackedMutation,
  customCtx((ctx: MutationCtx) => mutationCtx(ctx, "user")),
);
export const staffMutation = customMutation(
  trackedMutation,
  customCtx((ctx: MutationCtx) => mutationCtx(ctx, "moderator")),
);
export const adminMutation = customMutation(
  trackedMutation,
  customCtx((ctx: MutationCtx) => mutationCtx(ctx, "admin")),
);

async function flushEvents(ctx: ActionCtx, { events }: RequestState): Promise<void> {
  const persisted = events.flatMap((entry) =>
    entry.level === "info" ? [] : [toSystemEvent({ ...entry, level: entry.level })],
  );
  if (persisted.length === 0) return;
  try {
    await ctx.runMutation(internal.lib.systemEvents.record, { events: persisted });
  } catch (error) {
    const name = error instanceof Error ? error.name : "unknown";
    console.error(
      JSON.stringify({ level: "error", event: "system_events.flush.failed", error: name }),
    );
  }
}

/**
 * Internal action for jobs and side effects. `ctx.log` warn/error entries are also written
 * to `systemEvents` when the action ends, whether it succeeded or threw.
 */
export const internalJobAction = customAction(
  tracked(internalAction, flushEvents),
  customCtx(async (ctx: ActionCtx) => {
    const request = requestOf(ctx);
    const log: Logger = createLogger({
      rid: request.rid,
      fn: await functionName(ctx),
      sink: (entry) => request.events.push(entry),
    });
    return { rid: request.rid, log };
  }),
);

export type HttpCtx = ActionCtx & { rid: string; log: Logger };

/** HTTP endpoint (convex/http.ts) with a request id and a logger. Callers check auth themselves. */
export function publicHttpAction(handler: (ctx: HttpCtx, request: Request) => Promise<Response>) {
  return httpAction(async (ctx, request) => {
    const rid = crypto.randomUUID();
    const log = createLogger({ rid, fn: `http:${new URL(request.url).pathname}` });
    return await handler({ ...ctx, rid, log }, request);
  });
}
