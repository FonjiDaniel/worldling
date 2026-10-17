import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { GenericMutationCtx, AnyDataModel } from "convex/server";
import type { Value } from "convex/values";

import type { MutationCtx } from "./_generated/server";
import { resetEmailProvider, verifyEmailProvider } from "./lib/authEmail";
import { appError } from "./lib/errors";
import { isFlagOn } from "./lib/settings";
import { checkPassword } from "./shared/password";

// Convex Auth (SPEC §6, ADR-015). signIn, signOut and store are library functions: the one
// allowed exception to the wrapper rule, since they hold no app logic and read no app data.

function normalizedEmail(params: Record<string, Value | undefined>): string {
  const raw = params.email;
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (email === "" || email.length > 254 || !email.includes("@")) {
    throw appError("VALIDATION", "Invalid email", { fieldErrors: { email: ["invalid"] } });
  }
  return email;
}

function validatePassword(password: string): void {
  const result = checkPassword(password);
  if (!result.ok) {
    throw appError("VALIDATION", "Password does not meet the policy", {
      fieldErrors: { password: [result.problem] },
    });
  }
}

// The callbacks get an untyped ctx; it is our deployment's ctx, so the schema types apply.
function typed(ctx: GenericMutationCtx<AnyDataModel>): MutationCtx {
  return ctx;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile: (params) => ({ email: normalizedEmail(params) }),
      validatePasswordRequirements: validatePassword,
      verify: verifyEmailProvider,
      reset: resetEmailProvider,
    }),
    Google,
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { existingUserId }) {
      if (existingUserId !== null) return;
      if (!(await isFlagOn(typed(ctx), "signups.enabled"))) {
        throw appError("PRECONDITION", "Sign ups are closed", { reason: "signups_closed" });
      }
    },
    async beforeSessionCreation(ctx, { userId }) {
      const profile = await typed(ctx)
        .db.query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();
      if (profile?.status === "deleting") {
        throw appError("UNAUTHENTICATED", "Account is being deleted");
      }
    },
  },
});
