import type { Route } from "next";

// Route groups for the auth redirects in src/proxy.ts (SPEC §6.5). UX only: Convex enforces access.

export const SIGN_IN_PATH = "/sign-in";
export const AFTER_SIGN_IN_PATH: Route = "/me";

/** Signed-out visitors are sent to sign in from these. */
export const SIGNED_IN_ONLY = ["/settings", "/notifications", "/onboarding", "/admin", "/me"];

/** Signed-in visitors are sent onwards from these. */
export const GUEST_ONLY = ["/sign-in", "/sign-up"];

export function matchesAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * A same-origin path to return to after sign in, or the default. Refuses absolute URLs,
 * protocol-relative `//host` and backslash tricks so `?next=` can't send anyone off-site.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback: Route = AFTER_SIGN_IN_PATH,
): Route {
  if (raw === null || raw === undefined || raw === "") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  if (matchesAny(raw.split(/[?#]/)[0] ?? "", GUEST_ONLY)) return fallback;
  // Checked above to be a same-origin path, which is all a Route is at runtime.
  return raw as Route;
}
