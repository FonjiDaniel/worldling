import { type AppErrorData, isAppErrorData, userMessageFor } from "@convex/shared/errors";
import { PASSWORD_PROBLEM_COPY, type PasswordProblem } from "@convex/shared/password";

// Errors from Convex Auth through the Next proxy arrive as plain Error text (ADR-015).
// This turns them back into something a form can show.

export interface AuthError {
  /** One or two sentences for the form's alert. */
  message: string;
  fieldErrors: Partial<Record<"email" | "password" | "code", string>>;
  retryAfterMs?: number;
  /** Set when no account has that email, so reset can answer the same either way. */
  unknownAccount?: boolean;
}

const CONVEX_ERROR = /ConvexError: (\{.*\})/s;

/** Recovers our AppErrorData from `...ConvexError: {json}` text, if present. */
export function appErrorFromText(text: string): AppErrorData | null {
  const json = CONVEX_ERROR.exec(text)?.[1];
  if (json === undefined) return null;
  try {
    const data: unknown = JSON.parse(json);
    return isAppErrorData(data) ? data : null;
  } catch {
    return null;
  }
}

interface KnownError {
  test: RegExp;
  message: string;
  field?: keyof AuthError["fieldErrors"];
  unknownAccount?: boolean;
}

const CREDENTIALS = "That email and password don't match. Try again or reset your password.";

const KNOWN: KnownError[] = [
  { test: /InvalidAccountId/, message: CREDENTIALS, unknownAccount: true },
  {
    test: /InvalidSecret|Invalid credentials/,
    message: CREDENTIALS,
  },
  {
    test: /Could not verify code|Invalid code|Invalid verifier/,
    message: "That code didn't work. Check it, or send a new one.",
    field: "code",
  },
  {
    test: /TooManyFailedAttempts/,
    message: "Too many tries for now. Take a short break, then try again.",
  },
  {
    test: /Account .* already exists/,
    message: "That email already has a world. Sign in instead.",
    field: "email",
  },
  {
    test: /Failed to fetch|NetworkError|fetch failed|Load failed/,
    message: "We can't reach the universe right now. Check your connection.",
  },
];

function isPasswordProblem(value: string | undefined): value is PasswordProblem {
  return value !== undefined && value in PASSWORD_PROBLEM_COPY;
}

function fromAppError(data: AppErrorData): AuthError {
  const fields = data.details?.fieldErrors ?? {};
  const passwordProblem = fields.password?.[0];
  if (isPasswordProblem(passwordProblem)) {
    const message = PASSWORD_PROBLEM_COPY[passwordProblem];
    return { message, fieldErrors: { password: message } };
  }
  if (fields.email !== undefined) {
    const message = "That doesn't look like an email address.";
    return { message, fieldErrors: { email: message } };
  }
  if (data.details?.reason === "signups_closed") {
    return {
      message: "New worlds are paused for a little while. Please come back soon.",
      fieldErrors: {},
    };
  }
  const message = userMessageFor(data.code, data.details);
  const retryAfterMs = data.details?.retryAfterMs;
  return retryAfterMs === undefined
    ? { message, fieldErrors: {} }
    : { message, fieldErrors: {}, retryAfterMs };
}

export function toAuthError(error: unknown): AuthError {
  const text = error instanceof Error ? error.message : String(error);
  const data = appErrorFromText(text);
  if (data !== null) return fromAppError(data);
  const known = KNOWN.find((entry) => entry.test.test(text));
  if (known === undefined) return { message: userMessageFor("INTERNAL"), fieldErrors: {} };
  return {
    message: known.message,
    fieldErrors: known.field === undefined ? {} : { [known.field]: known.message },
    ...(known.unknownAccount === true && { unknownAccount: true }),
  };
}
