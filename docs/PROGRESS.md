# Progress

Where the build stands, phase by phase (SPEC §15). Updated at the end of every phase.

## Current status

**Phase 4: Authentication and onboarding** is complete, except Google sign-in, which is built but not yet tried end to end because the Google OAuth client doesn't exist yet (see notes). Typecheck, lint, tests (303), build and e2e (16) pass locally against the dev deployment. GitHub Actions is still blocked by the account billing lock (see Phase 0).

**Next:** Phase 5, Planet renderer. It extends the minimal `shared/worldParams.ts` from Phase 4 (ADR-017).

## Phase 4: Authentication and onboarding

- [x] Spike (§6.5): rung 1 works. `src/proxy.ts` exports `convexAuthNextjsMiddleware`, with the server provider under Suspense plus `connection()` for Cache Components. ADR-015.
- [x] §6.2 resolved: `sendVerificationRequest` gets Convex Auth's ActionCtx and enqueues `auth.verify` / `auth.reset` in our outbox. No HTTP hook, `AUTH_EMAIL_HOOK_SECRET` removed.
- [x] `convex/auth.ts`: Password (8 digit codes, 15 minutes, Web Crypto, NIST-style policy from `shared/password.ts`) with verify + reset, and Google. Closed sign ups (`signups.enabled`) and `deleting` accounts are refused in callbacks.
- [x] Shared rules: `shared/usernames.ts` (format, reserved list, moderation, display names), `shared/moderation.ts` (`obscenity` + links, emails, phones, spaced letters, admin extra words), `shared/password.ts`, `shared/otp.ts`.
- [x] Pulled forward (ADR-017): minimal `shared/worldParams.ts`, `shared/galaxy.ts`, `shared/random.ts`, `model/worlds.ts` (`allocateSlot`, `createPrimaryWorld`).
- [x] `signedInMutation` wrapper (signed in, any profile state, not deleting, maintenance applies).
- [x] `profiles.me`, `profiles.isUsernameAvailable`, `profiles.completeOnboarding` (profile + world + slot + welcome email in one transaction, optional draft), `sessions.signOutEverywhere`, `system.status`, `admin/system:bootstrapAdmin` (audited).
- [x] E2E mailbox (ADR-016): `@e2e.worldling.test` mail on non-production deployments goes to the fake provider and the `e2eMailbox` table. Playwright reads it with `npx convex run testing/e2e:takeLatestEmail`.
- [x] Pages: `/sign-up`, `/sign-in`, `/verify` (8-cell code input, paste anywhere, autofill, resend countdown), `/reset-password` (two steps, same answer for unknown emails), `/onboarding` (live availability, grapheme counter), `/me` (temporary "Your world is born"), `/settings` (sign out of all devices). Header account menu.
- [x] `AccountGate` picks the screen: loading, signed out, onboarding redirect, suspended (reason + appeal), maintenance (non-admins).
- [x] Acceptance: Playwright signs up, reads the code from the mailbox, pastes it, onboards, and resets a password. Axe has nothing serious on every auth page. Convex tests cover `bootstrapAdmin` (once only, audit row, unknown, unverified, Google-only, not onboarded, suspended), onboarding, sessions, the OTP path through the real `auth:signIn` (including mixed-case email verification) and the mailbox guard.
- [x] Real mail: an `auth.verify` and an `auth.reset` to a Gmail address reached `sent` through Gmail SMTP on dev, with Gmail message ids.
- [ ] Google sign-in end to end. Needs the OAuth client (see notes).

### Phase 4 notes

- **Google setup (to do).** Create an OAuth client (Web application) in Google Cloud Console. Authorized redirect URI: `https://brazen-bat-986.convex.site/api/auth/callback/google` for dev, and the same path on each deployment's `.convex.site`. Then `npx convex env set AUTH_GOOGLE_ID ...` and `AUTH_GOOGLE_SECRET ...`. Until then the Google button shows the generic error.
- **JWT keys** are set on dev (`JWT_PRIVATE_KEY`, `JWKS`). Preview and production need their own pair. `npx @convex-dev/auth` generates them, or the same Node `generateKeyPairSync("rsa")` approach.
- **Errors through `/api/auth`** arrive as plain text. `features/auth/errors.ts` recovers our JSON and maps Convex Auth's names. A test pins the format (ADR-015).
- **Sign out everywhere during maintenance** is blocked like every mutation. Signing out this device still works.
- **Default email prefs** at onboarding: comet alerts and weekly digest on, product updates off. People change them in settings once that section lands.
- **`/me`** is a placeholder until Phase 7 makes it redirect to `/w/[username]`.
- **E2E timing.** After sign-in the Convex websocket authenticates against the remote deployment, which can take a few seconds. The spec gives post-sign-in navigations 20s.
- **Windows dev.** Stopping a background `next start` from the agent can leave the Node process running. Free the port before Playwright reuses a stale server.
- **`e2eMailbox` cleanup.** Welcome emails to e2e accounts stay in the table. `jobs.cleanup` (Phase 10) should drop rows older than a day.
- **Support email.** Optional `NEXT_PUBLIC_SUPPORT_EMAIL` shows an appeal link on the suspended screen. Without it the screen says to reply to our email.

## Phase 3: Email system

- [x] Dependencies (pinned): `nodemailer` 10.1.2, `@react-email/render` 2.1.1, `@types/nodemailer` 8.0.2 (dev).
- [x] ADR-014: Gmail 465 result, retry classes, registry-derived category, over-limit handling, OTP scrubbing, GET-confirm/POST unsubscribe, `EMAIL_FAKE`. SPEC §7 and §13.5 updated.
- [x] `shared/emailTemplates.ts` (keys, zod schemas, category, scope, subject, `previewData`) and `shared/emailConfig.ts` (admin config input schema).
- [x] Templates for all eight §7.7 keys in `convex/email/templates/`, with plain-text versions, a dark layout, footer unsubscribe link for non-security mail, and a theme that mirrors the tokens (parity test). Renderer is `"use node"`.
- [x] Outbox: `model/emailOutbox.ts` `enqueueEmail` (idempotency, zod, suppressions, per-recipient limits, workpool enqueue). `email/outbox.ts` claim/markSent/markFailed/`onComplete`.
- [x] Dispatch (`email/dispatch.ts`): DB config or env fallback, decrypts in memory, renders, adds `List-Unsubscribe` headers, classifies errors (`email/errors.ts`). Workpool: 5 attempts, 10s base, exponential with jitter.
- [x] Providers (`email/providers.ts`): `SmtpProvider` (nodemailer), `ResendProvider` (fetch, outbox id as `Idempotency-Key`), `FakeProvider` (`EMAIL_FAKE=true`, never in production).
- [x] Config lifecycle (`model/emailConfigs.ts`, `admin/email.ts`): create, update (resets to draft), test send (verifies on success, ignores stale results), activate, rollback. Secrets encrypted, safe view only, audited.
- [x] Unsubscribe (`http.ts`, `email/links.ts`): HMAC tokens, GET confirm page, POST and one-click add the suppression. `publicHttpAction` wrapper.
- [x] Event names added to `docs/events.md`, plus a test that every logged event name is listed there.
- [x] Acceptance: convex-test covers enqueue, suppression, idempotency, rate limits, retry vs permanent failure (including a full 5-attempt workpool run), env fallback, DB config decryption, activation rules, audit and unsubscribe. A real `admin.test` email reached `sent` via Gmail SMTP (465) on dev.

### Phase 3 notes

- **Dev email env.** The dev deployment uses the env fallback with Gmail SMTP. `EMAIL_LINK_SECRET` and `SECRETS_ENCRYPTION_KEY` are set there too. Preview and production still need them.
- **Admin metrics deferred.** "Last successful send" and "failures in 24h" (§7.4 step 5) need rollups, since queries can't filter by `Date.now()`. They come with Phase 10.
- **Peer warning.** `@auth/core` expects nodemailer 7 or 8. Harmless, since we don't use Auth.js's email provider: Phase 4 sends OTPs through the outbox.
- **CLI sends.** `npx convex run email/outbox:enqueue '{"to":"...","template":"admin.test","data":{"transport":"smtp","source":"env"},"idempotencyKey":"..."}'` sends a test through the real pipeline.

## Phase 2: Backend core

- [x] Dependencies (pinned): `@convex-dev/auth` 0.0.96 (+ `@auth/core` 0.41.3), `convex-helpers` 0.1.128, `@convex-dev/rate-limiter` 0.4.2, `@convex-dev/workpool` 0.4.14, `@convex-dev/sharded-counter` 0.2.3.
- [x] `convex/schema.ts` per §5.2 with `authTables`. The encrypted secret object is a shared validator (same shape).
- [x] `convex.config.ts`: `rateLimiter`, `workpool` as `emailWorkpool`, `shardedCounter`.
- [x] `shared/errors.ts`: `ErrorCode`, `AppErrorData`, `isAppErrorData`, `userMessageFor` (friendly countdown for `RATE_LIMITED`).
- [x] `lib/errors.ts`: `appError`, `isAppError`, `withRid`.
- [x] `lib/logger.ts`: JSON lines `{level, event, ts, rid, fn, uid, ...}`, recursive redaction, email masking anywhere in strings, errors reduced to name + message, sink for warn/error. Event list in `docs/events.md` (names checked by a test).
- [x] `lib/functions.ts`: `publicQuery`, `userQuery`/`userMutation`, `staffQuery`/`staffMutation`, `adminQuery`/`adminMutation`, `internalJobAction`. Each call gets `ctx.rid`, `ctx.viewer`, `ctx.log`. `fn` comes from `ctx.meta.getFunctionMetadata()`.
- [x] `lib/rateLimits.ts` (§11.4), `lib/settings.ts` (typed registry, flags, maintenance, audited `setSetting`), `lib/audit.ts` (`writeAudit`, redacted before/after), `lib/time.ts`, `lib/crypto.ts` (AES-256-GCM, key versions).
- [x] `lib/jobRuns.ts` (`withJobRun` for actions, `withJobRunInMutation`) and `lib/systemEvents.ts` (`record`, flushed by `internalJobAction`).
- [x] Client: `src/lib/errors.ts` (`toAppError`, re-exports `userMessageFor`), `src/lib/logger.ts` (`reportError`, console until Sentry), `src/hooks/use-app-mutation.ts`.
- [x] Tests: wrappers (signed out, deleting, suspended, not onboarded, role matrix, maintenance, rid on errors, unexpected errors untouched), crypto round trip and rotation, rate limits, logger redaction, settings, audit, time, job runs + systemEvents flush, `useAppMutation`, and a static check that only `lib/functions.ts` imports raw `query`/`mutation`/`action`.

### Phase 2 notes

- **publicQuery and account status.** A suspended viewer passes through (so `profiles.me` can show the suspended screen). A deleting account is treated as signed out. Every other wrapper rejects both.
- **Not onboarded** is `PRECONDITION` with `details.reason = "needs_onboarding"`. The "signed in, not onboarded" wrapper for `completeOnboarding` comes in Phase 4 with its only user.
- **Request ids on errors.** convex-helpers has no error hook, so `tracked()` in `functions.ts` wraps the raw builder: it creates the rid, hands it to the customization as `ctx.request`, and rethrows app errors with `rid` attached. Unexpected errors pass through untouched.
- **Rate limit keys.** `comet.send` is split into `comet.send` (5/min token bucket) and `comet.sendDaily` (30/day). The security per-recipient limit is its own key, `email.perRecipientSecurity`. Callers enforce both where a rule has two parts.
- **Redaction and `code`.** The §10.3 regex redacts any key containing `code` (OTP codes). Log error codes under `errorCode`.
- **Mutation jobs.** `withJobRunInMutation` writes its row in the job's transaction, so a failed mutation job leaves no row and shows up as late. Action jobs record failures.
- **Key rotation.** `SECRETS_ENCRYPTION_KEY` is v1, `SECRETS_ENCRYPTION_KEY_V{n}` is vn. The highest configured version encrypts. The re-encrypt action lands with the email admin phase.
- **Test probes.** Wrapper and job tests build probe functions in the test file and mount them as a virtual `./probe.ts` module. `convex/test.helpers.ts` has a dotted name, so Convex never bundles it.

## Phase 1: Design system and shell

- [x] ADR-013: brand colors from `docs/brand/Worldling-brand-colors/` fill the §3.2 token names, plus `link`, `control-line`, `info`, status surfaces, `on-*` inks, warm hover/active and the nebula/aurora/sunrise 50 to 950 scales. SPEC §3.2 updated.
- [x] `src/styles/tokens.css`: Tailwind v4 `@theme` with the default palette, radius, ease, type and breakpoint scales reset, so only our tokens exist. Fluid type scale, motion, touch size, overlay animations.
- [x] `globals.css`: space backdrop, Aurora focus ring (2px offset), selection, reduced-motion override.
- [x] Fonts via `next/font/google` in `src/styles/fonts.ts`. **Final typography is a one-file change there**; tokens read the `--font-*-face` variables.
- [x] `src/lib/motion.ts` mirrors the CSS motion tokens (parity unit test).
- [x] shadcn/ui setup (`components.json`, `cn()`), components restyled to tokens: Button (primary, secondary, ghost, danger, pending), IconButton, Input, Field/Label, Textarea with grapheme counter, Slider, SwatchPicker, SegmentedControl, Dialog, Sheet, Popover, Tooltip, Tabs, Badge, Avatar, Skeleton, Toaster (sonner), DataTable (TanStack Table v9), Chart (recharts).
- [x] Shared: EmptyState, ErrorState, LoadingState, ConfirmDialog with typed confirmation, OfflineBanner, SkipLink, Logo, RouteError.
- [x] `convex/shared/graphemes.ts` (`countGraphemes`, shared with future server validation). `@convex/*` path alias.
- [x] Layout shells: `(marketing)`, `(auth)`, `(app)`, `admin`. Root layout has skip link, offline banner and toaster. Layouts only, pages arrive with their phases.
- [x] `error.tsx` per group, `global-error.tsx`, on-brand `not-found.tsx`. Brand favicon, icon and apple icon.
- [x] Logo: brand SVGs (horizontal white-transparent, hero gradient mark) in `public/brand/`. No PNG fallback needed.
- [x] `/dev/ui` showcases every component and state. 404 in production unless built with `DEV_ROUTES=true`.
- [x] Acceptance: axe shows zero serious/critical violations on `/`, `/dev/ui` and the 404 page. Keyboard e2e covers the skip link, Tab reach plus focus ring on every `/dev/ui` control, dialog focus trap and Escape, and arrow keys in tabs and segmented control. A unit test fails on any raw hex, color function, px or ms value in `src/components`, `src/features` or `src/app`.

### Phase 1 notes

- **Light theme deferred.** Dark only for now (ADR-013). A light theme can override token values under `[data-theme="light"]` without touching components.
- **`DEV_ROUTES`.** Optional build-time env var. The Playwright web server sets it so e2e can reach `/dev/ui` in a production build. Never set it on Vercel.
- **Playwright port is 3000** (was 3100). Locally `reuseExistingServer` reuses whatever already listens on 3000, including `pnpm dev`. Set `PLAYWRIGHT_PORT=3100` to test a fresh production build while dev runs.
- **TanStack Table is v9** (latest), not the v8 that shadcn examples use. The API is `useTable` + `tableFeatures`.
- **`docs/brand/` is in `.prettierignore`** so the delivered kit stays byte for byte.
- **Tooltip delay and popover offsets** are numeric Radix props, not CSS values, so they live in the components.

## Phase 0: Foundation

- [x] Next.js 16.4 app (App Router, Turbopack, React Compiler, `src/`, typed routes)
- [x] TypeScript strict + `noUncheckedIndexedAccess` (app and `convex/` tsconfigs)
- [x] Tailwind v4 (via `@tailwindcss/turbopack`, the Next 16.4 template default), placeholder `tokens.css`
- [x] Prettier + tailwind plugin, ESLint flat config (Next core-web-vitals + typescript-eslint strictTypeChecked/stylisticTypeChecked + prettier)
- [x] Husky pre-commit running lint-staged
- [x] Convex initialized, `convex.config.ts` ready for components, empty schema, `convex/_generated` committed
- [x] §4.4 folder structure (`.gitkeep` in empty folders, no placeholder modules)
- [x] Env validation: `src/lib/env.ts` (@t3-oss/env-nextjs, runs at build via `next.config.ts`), `convex/lib/env.ts` (`requireEnv` throws `MISSING_ENV: NAME`)
- [x] `.env.example` with every §13.5 variable
- [x] Vitest projects: `convex` (edge-runtime + convex-test) and `unit` (jsdom + Testing Library). `convex/test.setup.ts` exports the module glob for convex-test
- [x] Playwright config + smoke test (`tests/e2e/smoke.spec.ts`)
- [x] GitHub Actions CI, §13.3 steps 1-5
- [x] ADR template + ADR-001 to ADR-012
- [x] Convex cloud project, `APP_ENV` and `SITE_URL` set on deployments
- [x] Vercel deploy with Convex (build command `npx convex deploy --cmd 'pnpm build'`)
- [ ] CI green on GitHub. Blocked by a GitHub account billing lock, not by the code. Re-run the failed job once support unlocks the account.

### Deploy setup (for reference)

- Vercel env: `CONVEX_DEPLOY_KEY` as Secret (production key for Production, preview key for Preview), `NEXT_PUBLIC_SITE_URL` as Config.
- Convex env per deployment: `APP_ENV`, `SITE_URL` (`npx convex env set NAME value [--prod]`). Preview defaults are set in Convex Project Settings.

## Notes and decisions

- **Brand kit indexed (2026-10-18).** `docs/brand/README.md` maps all 210 files, extracts every value and records the logo and contrast checks. The kit moved to numbered folders (`02-logo` to `07-voice`). **Pending brand:** `08` (design tokens and one-page summary) and a dark optical favicon for light backgrounds. The README lists where `tokens.css` differs from the brand (radii, 88% glass, focus offset, easings, durations, shadows, type scale) and the light-theme status colors that need darker values. Those changes wait for the tokens step and need an ADR for SPEC §3.2.

- **Pinned versions.** All dependencies are exact (`.npmrc` `save-exact=true`). Only Phase 0 dependencies are installed. Later phases add theirs, also pinned.
- **TypeScript 6.0.3, not 7.** typescript-eslint 8.71 supports `<6.1.0`, and TS 7 (native port) breaks the compiler API used by Next and ESLint.
- **ESLint 9.39.5, not 10.** eslint-config-next 16.4.2 bundles eslint-plugin-react, -import and -jsx-a11y, which cap at ESLint 9. npm flags 9.x as deprecated. Move to 10 when those plugins support it.
- **Local Node is 22.16.0.** jsdom 30 and lint-staged 17 need Node 22.22+, so jsdom is pinned to 29.1.1 and lint-staged to 16.4.0. CI uses the latest Node 22 (`.nvmrc`). Upgrading local Node to 22.22+ would allow both bumps.
- **Cache Components + Partial Prefetching on.** These are the Next 16.4 template defaults and become default in the next major. Revisit in the Phase 4 auth spike (§6.5) if Convex Auth's server helpers clash with them.
- **`pnpm typecheck` runs `next typegen` first** so route types (`LayoutProps`, typed routes) exist on a clean checkout. It needs the Next env vars (CI sets placeholders).
- **Security headers (§11.2), Sentry, analytics** are not in Phase 0. They land with their phases.
- **Playwright** is not in CI yet (§13.3 step 6 needs Vercel previews).
