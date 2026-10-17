# ADR-015: Auth integration (Convex Auth, Next 16 proxy, OTP via outbox)

- **Status:** Accepted
- **Date:** 2026-10-17
- **Spec:** §6.1, §6.2, §6.4, §6.5, §5.3

## Context

§6.5 flags friction between Convex Auth's Next.js helpers and Next 16's `proxy.ts`, and asks for a spike with a fallback ladder. §6.2 asks whether `sendVerificationRequest` can reach the database in the installed `@convex-dev/auth` (0.0.96), or whether OTP mail needs an HTTP hook. The app also runs with Cache Components on, which forbids reading cookies outside `<Suspense>` during prerender.

## Decision

- **Rung 1 of the ladder works: `src/proxy.ts`.** Its default export is `convexAuthNextjsMiddleware(...)`. Verified with `next build` + `next start` (Next 16.4.2): guarded routes redirect to `/sign-in?next=...`, and `POST /api/auth` round-trips to Convex (password policy errors come back from the deployment). No `middleware.ts`.
- **Cache Components.** `ConvexAuthNextjsServerProvider` reads the auth cookies, so it sits inside `<body>` under a `<Suspense>` boundary (`src/components/shared/auth-providers.tsx`). The html, skip link, offline banner and toaster prerender as the static shell; route content streams in the same response. Routes show as Partial Prerender in the build. The provider also stamps its state with `Date.now()`, which Cache Components rejects during the runtime prerender, so a small server component awaits `connection()` first and marks that subtree as request-time.
- **Email normalization.** Convex Auth reads the raw `params.email` again in the OTP step, after `profile` has run. `profile` therefore writes the normalized address back into `params`, otherwise a mixed-case sign-up would store a raw email and fail the code check against the normalized account. The forms normalize too.
- **OTP mail goes through the outbox directly.** `sendVerificationRequest(params, ctx)` receives Convex Auth's ActionCtx as a second argument (`signIn.js`), so it calls `internal.email.outbox.enqueue` with `auth.verify` or `auth.reset` (category `security`). No HTTP hook and no `AUTH_EMAIL_HOOK_SECRET`. The Auth.js type omits the second argument, so `lib/authEmail.ts` takes it as a rest argument and checks it at runtime.
- **Codes.** 8 digits, 15 minutes, from `crypto.getRandomValues` with rejection sampling (uniform digits). `@oslojs/crypto`, named in §6.1, is deprecated upstream and adds nothing over Web Crypto here. The outbox idempotency key is random, never derived from the code, because the key outlives the scrubbed data. Since codes are shorter than 24 characters, Convex Auth requires the matching email on verification.
- **Rate limits.** Convex Auth allows 10 failed sign-in or code attempts per hour per account. On top, `email.perRecipientSecurity` (10/hour) throws `RATE_LIMITED` at enqueue, which the resend button turns into a countdown.
- **Sessions (Convex Auth defaults, kept).** Access JWT 1 hour; session total 30 days (`AUTH_SESSION_TOTAL_DURATION_MS`); refresh token inactivity 30 days (`AUTH_SESSION_INACTIVE_DURATION_MS`). Auth cookies are session cookies (`cookieConfig.maxAge` unset).
- **Sign ups closed.** `afterUserCreatedOrUpdated` refuses brand new users (`existingUserId === null`; linked accounts pass the linked id) when the `signups.enabled` flag is off. `beforeSessionCreation` refuses accounts in `deleting`.
- **Account linking.** Convex Auth default: Google sign-in links to an existing user only when that user's email is verified. A password account that never verified does not get taken over by a Google sign-in.
- **Wrapper exception.** `signIn`, `signOut` and `store` exported from `convex/auth.ts` are library functions, the one allowed exception to the wrapper rule (§5.3, ADR-005). They hold no app logic, and every app function still goes through `lib/functions.ts`.
- **Errors through the proxy.** The Next client provider turns any `/api/auth` failure into `new Error(text)`, so `ConvexError` data arrives as a string. `src/features/auth/errors.ts` recovers our `AppErrorData` JSON from the message and maps Convex Auth's named errors (`InvalidAccountId`, `InvalidSecret`, `TooManyFailedAttempts`, ...) to friendly copy.

## Alternatives considered

- **`middleware.ts`** (rung 2): not needed, `proxy.ts` works.
- **Client-only `ConvexAuthProvider`** (rung 3): loses server redirects and `convexAuthNextjsToken()` for `preloadQuery`, with no benefit now that rung 1 works.
- **Provider around `<html>` with the whole tree dynamic** (`instant = false`): fails the prerender of every route, including the landing poster frame.
- **HTTP hook with a shared secret** (§6.2 fallback): an extra endpoint and secret for something the ActionCtx already does.

## Consequences

- Any server component that needs the viewer reads it under the same Suspense boundary, which is already the case for every route.
- The `features/auth/errors.ts` parser depends on Convex's error text format (`ConvexError: {json}`). A unit test pins it; recheck when upgrading `@convex-dev/auth` or `convex`.
- Revisit when Convex Auth ships official Next 16 guidance or typed `sendVerificationRequest` context.
