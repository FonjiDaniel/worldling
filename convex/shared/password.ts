import { COMMON_PASSWORDS } from "./commonPasswords";

// Password policy (SPEC §6.1, NIST 800-63B): long enough, not a known common password,
// no composition rules. Shared by the sign-up form and Convex Auth.

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordProblem = "too_short" | "too_long" | "common";

export function checkPassword(
  password: string,
): { ok: true } | { ok: false; problem: PasswordProblem } {
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, problem: "too_short" };
  if (password.length > PASSWORD_MAX_LENGTH) return { ok: false, problem: "too_long" };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return { ok: false, problem: "common" };
  return { ok: true };
}

export const PASSWORD_PROBLEM_COPY: Record<PasswordProblem, string> = {
  too_short: `Use at least ${String(PASSWORD_MIN_LENGTH)} characters.`,
  too_long: `Keep it under ${String(PASSWORD_MAX_LENGTH + 1)} characters.`,
  common: "That one is too easy to guess. Try a few words strung together.",
};
