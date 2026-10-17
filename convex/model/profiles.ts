import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { appError } from "../lib/errors";
import { requireEnv } from "../lib/env";
import type { Viewer } from "../lib/functions";
import type { Logger } from "../lib/logger";
import { getSetting } from "../lib/settings";
import { checkText } from "../shared/moderation";
import {
  checkDisplayName,
  checkUsername,
  type NameRules,
  type UsernameProblem,
} from "../shared/usernames";
import { randomSeed } from "../shared/random";
import {
  randomParams,
  randomWorldName,
  type WorldParams,
  worldNameSchema,
  worldParamsSchema,
} from "../shared/worldParams";
import { enqueueEmail } from "./emailOutbox";
import { createPrimaryWorld } from "./worlds";

// Profiles and onboarding (SPEC §6.3).

type ReadCtx = Pick<QueryCtx, "db">;
type WriteCtx = MutationCtx & { rid: string; log: Logger; viewer: Viewer };

export interface MeView {
  needsOnboarding: boolean;
  emailVerified: boolean;
  profile: {
    username: string;
    displayName: string;
    role: Doc<"profiles">["role"];
    status: Doc<"profiles">["status"];
    suspensionReason: string | null;
  } | null;
}

/** Verified email (password, after the OTP) or a Google account, whose email Google verified. */
export async function hasVerifiedIdentity(ctx: ReadCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get("users", userId);
  if (user === null) return false;
  if (user.emailVerificationTime !== undefined) return true;
  const google = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", "google"))
    .first();
  return google !== null;
}

export async function meView(ctx: ReadCtx, viewer: Viewer): Promise<MeView> {
  const { profile } = viewer;
  return {
    needsOnboarding: profile === null,
    emailVerified: await hasVerifiedIdentity(ctx, viewer.userId),
    profile:
      profile === null
        ? null
        : {
            username: profile.username,
            displayName: profile.displayName,
            role: profile.role,
            status: profile.status,
            suspensionReason: profile.suspension?.reason ?? null,
          },
  };
}

async function nameRules(ctx: ReadCtx): Promise<NameRules> {
  return {
    extraReserved: await getSetting(ctx, "usernames.reserved"),
    extraWords: await getSetting(ctx, "moderation.extraWords"),
  };
}

async function isTaken(ctx: ReadCtx, username: string): Promise<boolean> {
  const row = await ctx.db
    .query("profiles")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();
  return row !== null;
}

export type Availability =
  { available: true } | { available: false; reason: UsernameProblem | "taken" };

export async function usernameAvailability(ctx: ReadCtx, raw: string): Promise<Availability> {
  const check = checkUsername(raw.slice(0, 64), await nameRules(ctx));
  if (!check.ok) return { available: false, reason: check.reason };
  if (await isTaken(ctx, check.username)) return { available: false, reason: "taken" };
  return { available: true };
}

export interface OnboardingInput {
  username: string;
  displayName: string;
  draft?: { name: string; params: unknown };
}

function invalid(field: string, problem: string): never {
  throw appError("VALIDATION", `Invalid ${field}`, { fieldErrors: { [field]: [problem] } });
}

function draftWorld(
  input: OnboardingInput,
  rules: NameRules,
): { name: string; params: WorldParams } {
  if (input.draft === undefined) {
    const seed = randomSeed();
    return { name: randomWorldName(seed), params: randomParams(seed) };
  }
  const params = worldParamsSchema.safeParse(input.draft.params);
  if (!params.success) invalid("draft", "params");
  const name = worldNameSchema.safeParse(input.draft.name);
  if (!name.success) invalid("draft", "name");
  if (!checkText(name.data, rules.extraWords).ok) invalid("draft", "moderation");
  return { name: name.data, params: params.data };
}

export async function completeOnboarding(ctx: WriteCtx, input: OnboardingInput) {
  const { userId, profile } = ctx.viewer;
  if (profile !== null)
    throw appError("CONFLICT", "Already onboarded", { reason: "already_onboarded" });
  if (!(await hasVerifiedIdentity(ctx, userId))) {
    throw appError("PRECONDITION", "Email not verified", { reason: "email_unverified" });
  }
  const rules = await nameRules(ctx);
  const username = checkUsername(input.username.slice(0, 64), rules);
  if (!username.ok) invalid("username", username.reason);
  const displayName = checkDisplayName(input.displayName.slice(0, 200), rules);
  if (!displayName.ok) invalid("displayName", displayName.reason);
  if (await isTaken(ctx, username.username)) {
    throw appError("CONFLICT", "Username taken", { fieldErrors: { username: ["taken"] } });
  }
  const world = draftWorld(input, rules);

  await ctx.db.insert("profiles", {
    userId,
    username: username.username,
    displayName: displayName.displayName,
    role: "user",
    status: "active",
    emailPrefs: { cometAlerts: true, weeklyDigest: true, productUpdates: false },
  });
  const worldId = await createPrimaryWorld(ctx, { ownerId: userId, ...world });
  await sendWelcome(ctx, userId, {
    displayName: displayName.displayName,
    worldName: world.name,
    worldUrl: `${requireEnv("SITE_URL")}/w/${username.username}`,
  });
  ctx.log.info("profile.onboarding.completed", { worldId, fromDraft: input.draft !== undefined });
  return { username: username.username, worldId };
}

async function sendWelcome(
  ctx: WriteCtx,
  userId: Id<"users">,
  data: { displayName: string; worldName: string; worldUrl: string },
): Promise<void> {
  const user = await ctx.db.get("users", userId);
  if (user?.email === undefined) return;
  await enqueueEmail(ctx, {
    to: user.email,
    template: "account.welcome",
    data,
    idempotencyKey: `account.welcome:${userId}`,
  });
}
