import { countGraphemes } from "./graphemes";
import { checkText } from "./moderation";

// Usernames and display names (SPEC §6.3). Shared by the onboarding form and the server.

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const DISPLAY_NAME_MAX = 40;

/** Route segments (§2.1), system words and brand terms. Admins can add more in settings. */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // §6.3
  "admin",
  "api",
  "w",
  "universe",
  "create",
  "settings",
  "me",
  "support",
  "help",
  "worldling",
  "staff",
  "mod",
  "root",
  "null",
  "undefined",
  // Routes (§2.1)
  "sign_in",
  "signin",
  "sign_up",
  "signup",
  "login",
  "logout",
  "verify",
  "reset_password",
  "onboarding",
  "notifications",
  "about",
  "privacy",
  "terms",
  "guidelines",
  "dev",
  "auth",
  "static",
  "assets",
  // System and trust
  "administrator",
  "moderator",
  "system",
  "official",
  "security",
  "team",
  "worldling_team",
  "worldlings",
  "everyone",
  "anonymous",
  "deleted",
  "deleted_user",
  "you",
]);

export type UsernameProblem = "format" | "reserved" | "moderation";

export type UsernameCheck = { ok: true; username: string } | { ok: false; reason: UsernameProblem };

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

export interface NameRules {
  extraReserved?: readonly string[];
  extraWords?: readonly string[];
}

export function checkUsername(raw: string, rules: NameRules = {}): UsernameCheck {
  const username = normalizeUsername(raw);
  if (!USERNAME_PATTERN.test(username)) return { ok: false, reason: "format" };
  const reserved = rules.extraReserved?.map(normalizeUsername) ?? [];
  if (RESERVED_USERNAMES.has(username) || reserved.includes(username)) {
    return { ok: false, reason: "reserved" };
  }
  // Underscores become spaces so the matcher sees word boundaries.
  if (!checkText(username.replace(/_/g, " "), rules.extraWords).ok) {
    return { ok: false, reason: "moderation" };
  }
  return { ok: true, username };
}

export type DisplayNameProblem = "empty" | "too_long" | "moderation";

export type DisplayNameCheck =
  { ok: true; displayName: string } | { ok: false; reason: DisplayNameProblem };

/** Trims, collapses inner whitespace and drops control characters before checking. */
export function checkDisplayName(raw: string, rules: NameRules = {}): DisplayNameCheck {
  const displayName = raw
    .replace(/\p{Cc}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (displayName === "") return { ok: false, reason: "empty" };
  if (countGraphemes(displayName) > DISPLAY_NAME_MAX) return { ok: false, reason: "too_long" };
  if (!checkText(displayName, rules.extraWords).ok) return { ok: false, reason: "moderation" };
  return { ok: true, displayName };
}

export const USERNAME_PROBLEM_COPY: Record<UsernameProblem | "taken", string> = {
  format: "Use 3 to 20 lowercase letters, numbers or underscores.",
  reserved: "That name is kept for Worldling. Try another.",
  moderation: "Let's keep the universe kind. Try another name.",
  taken: "Someone already calls that world home. Try another.",
};

export const DISPLAY_NAME_PROBLEM_COPY: Record<DisplayNameProblem, string> = {
  empty: "Tell us what to call you.",
  too_long: `Keep it to ${String(DISPLAY_NAME_MAX)} characters.`,
  moderation: "Let's keep the universe kind. Try another name.",
};
