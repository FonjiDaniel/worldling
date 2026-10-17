"use client";

import { useMutation } from "convex/react";
import {
  type FunctionArgs,
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
} from "convex/server";
import { useState } from "react";

import { toast } from "@/components/ui/toaster";
import { type AppErrorData, toAppError, userMessageFor } from "@/lib/errors";
import { reportError } from "@/lib/logger";

export type MutationResult<T> = { ok: true; value: T } | { ok: false; error: AppErrorData };

/**
 * `useMutation` with our error handling (SPEC §10.2). VALIDATION fills `fieldErrors` for the
 * form, other app errors show a toast, unexpected errors also go to error reporting.
 * `run` never throws.
 */
export function useAppMutation<F extends FunctionReference<"mutation">>(fn: F) {
  const mutate = useMutation(fn);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<AppErrorData | null>(null);

  const run = async (args: FunctionArgs<F>): Promise<MutationResult<FunctionReturnType<F>>> => {
    setIsPending(true);
    setError(null);
    try {
      const value = await mutate(args);
      return { ok: true, value };
    } catch (thrown) {
      const appError = toAppError(thrown);
      setError(appError);
      if (appError.code === "INTERNAL") {
        reportError(thrown, { fn: getFunctionName(fn) });
      }
      if (appError.code !== "VALIDATION") {
        toast.error(userMessageFor(appError.code, appError.details));
      }
      return { ok: false, error: appError };
    } finally {
      setIsPending(false);
    }
  };

  return { run, isPending, error, fieldErrors: error?.details?.fieldErrors ?? {} };
}
