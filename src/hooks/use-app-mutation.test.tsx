import { act, renderHook } from "@testing-library/react";
import { makeFunctionReference } from "convex/server";
import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppMutation } from "./use-app-mutation";

const mutate = vi.fn<(args: unknown) => Promise<unknown>>();
const toastError = vi.fn<(message: string) => void>();
const reportError = vi.fn<(error: unknown, context: unknown) => void>();

vi.mock("convex/react", () => ({ useMutation: () => mutate }));
vi.mock("@/components/ui/toaster", () => ({
  toast: {
    error: (m: string) => {
      toastError(m);
    },
  },
}));
vi.mock("@/lib/logger", () => ({
  reportError: (e: unknown, c: unknown) => {
    reportError(e, c);
  },
}));

const ref = makeFunctionReference<"mutation", { name: string }, string>("worlds:update");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAppMutation", () => {
  it("returns the value on success", async () => {
    mutate.mockResolvedValue("w1");
    const { result } = renderHook(() => useAppMutation(ref));
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.run({ name: "Vela" });
    });
    expect(outcome).toEqual({ ok: true, value: "w1" });
    expect(result.current.isPending).toBe(false);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("exposes VALIDATION field errors without a toast", async () => {
    const fieldErrors = { name: ["Too long"] };
    mutate.mockRejectedValue(
      new ConvexError({ code: "VALIDATION", message: "bad", details: { fieldErrors } }),
    );
    const { result } = renderHook(() => useAppMutation(ref));
    await act(async () => {
      await result.current.run({ name: "x".repeat(99) });
    });
    expect(result.current.fieldErrors).toEqual(fieldErrors);
    expect(result.current.error?.code).toBe("VALIDATION");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("toasts friendly copy for app errors", async () => {
    mutate.mockRejectedValue(
      new ConvexError({ code: "RATE_LIMITED", message: "x", details: { retryAfterMs: 12_000 } }),
    );
    const { result } = renderHook(() => useAppMutation(ref));
    await act(async () => {
      await result.current.run({ name: "Vela" });
    });
    expect(toastError).toHaveBeenCalledWith("Easy there. Try again in 12 seconds.");
    expect(reportError).not.toHaveBeenCalled();
  });

  it("treats unknown errors as INTERNAL and reports them", async () => {
    const boom = new Error("Server Error");
    mutate.mockRejectedValue(boom);
    const { result } = renderHook(() => useAppMutation(ref));
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.run({ name: "Vela" });
    });
    expect(outcome).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
    expect(reportError).toHaveBeenCalledWith(boom, { fn: "worlds:update" });
    expect(toastError).toHaveBeenCalledWith("Something went wrong on our side. Please try again.");
  });
});
