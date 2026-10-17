import { ConvexError } from "convex/values";

import {
  type AppErrorData,
  type AppErrorDetails,
  type ErrorCode,
  isAppErrorData,
} from "../shared/errors";

/**
 * An expected error for the client. Throw it: `throw appError("NOT_FOUND", "World not found")`.
 * The message is for logs and developers; the client shows `userMessageFor(code)`.
 */
export function appError(
  code: ErrorCode,
  message: string,
  details?: AppErrorDetails,
): ConvexError<AppErrorData> {
  const data: AppErrorData = { code, message };
  if (details !== undefined) data.details = stripUndefined(details);
  return new ConvexError(data);
}

/** True for errors thrown with `appError`. */
export function isAppError(error: unknown): error is ConvexError<AppErrorData> {
  return error instanceof ConvexError && isAppErrorData(error.data);
}

/** Returns the error with the request id attached when it is an app error, else the error unchanged. */
export function withRid(error: unknown, rid: string): unknown {
  if (!isAppError(error) || error.data.rid !== undefined) return error;
  return new ConvexError<AppErrorData>({ ...error.data, rid });
}

// Convex values cannot hold undefined, so optional keys that are unset are dropped.
function stripUndefined(details: AppErrorDetails): AppErrorDetails {
  const out: AppErrorDetails = {};
  if (details.fieldErrors !== undefined) out.fieldErrors = details.fieldErrors;
  if (details.retryAfterMs !== undefined) out.retryAfterMs = details.retryAfterMs;
  if (details.reason !== undefined) out.reason = details.reason;
  return out;
}
