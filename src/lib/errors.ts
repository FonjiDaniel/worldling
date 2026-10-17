import { ConvexError } from "convex/values";

import { type AppErrorData, isAppErrorData } from "@convex/shared/errors";

export { type AppErrorData, type ErrorCode, userMessageFor } from "@convex/shared/errors";

const INTERNAL: AppErrorData = { code: "INTERNAL", message: "Unexpected error" };

/** Narrows anything thrown by a Convex call. Non-app errors become INTERNAL (SPEC §10.1). */
export function toAppError(error: unknown): AppErrorData {
  if (error instanceof ConvexError && isAppErrorData(error.data)) return error.data;
  return INTERNAL;
}
