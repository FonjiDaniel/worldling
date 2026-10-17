// Error codes and friendly copy shared by the Convex functions and the client (SPEC §10.1).

export const ErrorCode = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION", // details.fieldErrors
  CONFLICT: "CONFLICT", // e.g. username taken
  RATE_LIMITED: "RATE_LIMITED", // details.retryAfterMs
  PRECONDITION: "PRECONDITION", // e.g. email not verified, feature disabled
  SUSPENDED: "SUSPENDED",
  MAINTENANCE: "MAINTENANCE",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// Type aliases, not interfaces: ConvexError data must be assignable to a Convex Value.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AppErrorDetails = {
  fieldErrors?: Record<string, string[]>;
  retryAfterMs?: number;
  reason?: string;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type AppErrorData = {
  code: ErrorCode;
  message: string;
  details?: AppErrorDetails;
  rid?: string;
};

const CODES = new Set<string>(Object.values(ErrorCode));

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && CODES.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrows unknown error data (e.g. `ConvexError.data`) to our shape. */
export function isAppErrorData(value: unknown): value is AppErrorData {
  return (
    isRecord(value) &&
    isErrorCode(value.code) &&
    typeof value.message === "string" &&
    (value.details === undefined || isRecord(value.details)) &&
    (value.rid === undefined || typeof value.rid === "string")
  );
}

function waitPhrase(retryAfterMs: number | undefined): string {
  if (retryAfterMs === undefined || retryAfterMs <= 0) return "in a moment";
  const seconds = Math.ceil(retryAfterMs / 1000);
  if (seconds < 60) return `in ${seconds} ${seconds === 1 ? "second" : "seconds"}`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  const hours = Math.ceil(minutes / 60);
  return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
}

const MESSAGES: Record<Exclude<ErrorCode, "RATE_LIMITED">, string> = {
  UNAUTHENTICATED: "Please sign in to keep going.",
  FORBIDDEN: "You can't do that here.",
  NOT_FOUND: "We couldn't find that. It may have drifted away.",
  VALIDATION: "Something doesn't look right. Check the highlighted fields.",
  CONFLICT: "That's already taken. Try something else.",
  PRECONDITION: "That isn't available right now.",
  SUSPENDED: "Your account is paused. Check your email for details.",
  MAINTENANCE: "We're tending the universe. Please try again soon.",
  INTERNAL: "Something went wrong on our side. Please try again.",
};

/** Warm, plain copy for an error code. Never shows server internals. */
export function userMessageFor(code: ErrorCode, details?: AppErrorDetails): string {
  if (code === "RATE_LIMITED") {
    return `Easy there. Try again ${waitPhrase(details?.retryAfterMs)}.`;
  }
  return MESSAGES[code];
}
