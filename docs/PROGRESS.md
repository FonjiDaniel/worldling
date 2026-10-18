# Progress

Where the build stands, phase by phase (SPEC §15). Updated at the end of every phase.

## Current status

**Phase 6: World creator** is complete. Typecheck, lint, unit and Convex tests, build and the creator e2e on desktop Chrome, Pixel 7 and iPhone 14 pass locally. Two items still need real phones: the creator on a real iPhone (Safari) and Android (Chrome), and the Phase 5 60fps check. GitHub Actions is still blocked by the account billing lock (see Phase 0).

Phase 4 is complete, except Google sign-in, which is built but not yet tried end to end (see Phase 4 notes).

**Next:** Phase 7, World page and sharing. It extends the minimal `/w/[username]` from this phase (ADR-021).

## Phase 6: World creator

- [x] ADR-021 (a minimal world page lands now) and ADR-022 (creator details). SPEC §4.3 and the §15 Phase 7 entry updated.
- [x] Convex, `worlds.ts` + `model/worlds.ts`:
  - `mine` (userQuery) and `getByUsername` (publicQuery: null for unknown names, hidden worlds and owners who aren't active).
  - `update`: owner only, `world.update` rate limit, schema clamps, name moderation. Onboarding drafts and updates share `parseWorldParams` / `parseWorldName`.
  - `generateThumbnailUploadUrl` (spends a `world.update` token) and `setThumbnail`: checks `_storage` for `image/webp` and 300KB or less, deletes the previous file, and returns `{ ok: false, reason }` for a bad file so the file's deletion isn't rolled back.
  - `testing/e2e:worldFor` for the e2e assertion. New log events in `docs/events.md`.
- [x] `/create` (`src/features/creator/*`):
  - Desktop follows the 06 mockup: copy from `06-source/copy-and-layout.json`, the world on the left, a glass panel on the right.
  - Below `lg`, a custom non-modal bottom sheet with peek, 40% and 88% snaps. The handle drags, and it's also a button (tap or Enter cycles, arrows step). The world keeps the top 60%. The Pause motion control rides above the sheet.
  - Tabs Landscape (Presets, Shape, Colors), Atmosphere (Sky), Details (Motion, Name). Six preset cards with CSS discs, sliders with percent values, curated palettes, and custom colors clamped by `clampColor` with a note when a color moved.
  - Randomize re-forms the world: the terrain settles, the new world swaps in at the midpoint, the terrain rises (600ms, GSAP on the shared ticker). Reduced motion swaps at once.
  - Undo/redo (buttons, Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, Ctrl+Y). A slider drag or name edit is one step. Text fields keep their own undo.
  - Drag to turn, or arrow keys on the focused world.
  - One polite live region: randomize (with `describeWorld`), presets, palettes, undo/redo, saves.
  - Guest draft in `worldling:draft:v1`, saved 300ms after each change and on `pagehide`, validated by the shared schema on load.
  - Owners: "Save my world" with an optimistic `worlds.mine` update (`useAppMutation` gained `optimisticUpdate`), a `beforeunload` warning while unsaved, then a new thumbnail. An owner who also has a guest draft is offered it.
  - Custom `TiltedWorldIcon` (05 rules) for Motion; the rest is lucide.
- [x] Claim flow: "Claim this world" keeps the draft and opens `/sign-up?next=/onboarding` (or `/onboarding` when signed in). Onboarding shows "{name} comes with you.", claims the draft, clears it, and lands on `/w/{username}` with the 07 `world_created` celebration. `/me` now redirects to the world page; `WorldBorn` is gone.
- [x] Thumbnails (§8.7): `ThumbnailStudio` inside the one canvas renders a private scene to a 512px sRGB target with a fixed three-quarter camera, flips the rows, and encodes WebP at 0.85. When the browser returns PNG (Safari), `@jsquash/webp` 1.5.0 is lazy-loaded. The owner's world page makes the first thumbnail; every save makes a new one.
- [x] Tests:
  - convex-test `worlds.test.ts` (14).
  - Unit: history, edits, draft, shortcuts, sheet snaps, WebP fallback, row flip, optimistic `useAppMutation`, onboarding draft claim.
  - e2e `creator.spec.ts`, on desktop Chrome, Pixel 7 and iPhone 14 (WebKit):
    - The guest flow: preset, keyboard slider, undo/redo shortcuts, randomize, rename, reload, claim, sign up, onboard, celebration, axe.
    - The stored params deep-equal the draft, with a WebP thumbnail of 300KB or less. On WebKit that thumbnail comes from the WASM encoder.
    - Owner edit: save, then a new thumbnail arrives.
    - Axe, the sheet handle and draft persistence.
  - The full e2e suite passes: 31 tests. The last two fixes (an exact text match in `auth.spec.ts`, and WebKit code entry) were confirmed in a rerun of those tests.
  - `auth.spec.ts` now expects the world page after onboarding.
- [ ] **Real phones.** Open `/create` from the LAN on an iPhone (Safari) and an Android phone (Chrome): drag the sheet, move sliders, claim, and check the world has a thumbnail (the Safari path uses the WASM encoder).

### Phase 6 notes

- **Canvas lifetime fix (Phase 5 bug).** When the last view unmounted (leaving `/create` for `/sign-up`), `ExperienceRoot` unmounted. R3F's dispose fired `webglcontextlost`, the watcher was never removed, and the session fell to tier 0, so no thumbnail could be drawn. Now:
  - The canvas stays mounted once loaded, as ADR-019 intends. It is hidden and doesn't advance while no view is registered.
  - The watcher is removed on unmount.
  - A loss on a detached canvas is ignored.
- **WebKit can't be granted clipboard access**, so on the iPhone 14 project the e2e enters the code the way iOS autofill does: the whole code into the first box.
- **Radix Slider** calls `onValueCommit` before `onValueChange` on key presses. The slider commits in a microtask so a key press is one clean undo step.
- **Breakpoints at runtime.** Tailwind drops theme variables nothing references, so `globals.css` references the breakpoints for `useBreakpoint`.
- **Account menu label.** Its accessible name now comes from text that includes the visible name (axe `label-content-name-mismatch` at phone width).
- **Tier 0** devices can't draw a thumbnail; those worlds get one on their next save from a WebGL device. A busy device can miss the first capture, so the owner's world page tries up to three times.
- **No `worlds.create` yet.** Every account has its primary world from onboarding (ADR-017), so the creator edits it. `worlds.create` waits for multiple worlds.
- **The "Explore worlds" action** on the not-available world page waits for `/universe` (Phase 8).
- **E2E runs against a production build** (`PLAYWRIGHT_PORT=3100`). On `next dev` the first visit to each route compiles for longer than the step timeouts.

## Phase 5: Planet renderer

- [x] `convex/shared/worldParams.ts`:
  - The zod schema (unchanged shape, matches `worldParamsV1`). It clamps every color by chroma and lightness (`clampColor`, ADR-009).
  - Tuned `PRESETS` per biome, `presetParams(biome, seed)` and `randomParams(seed)`. A seed picks a biome, then a palette within it, then a jittered preset.
  - `describeWorld` is re-exported. It lives in `worldDescription.ts`, for example "A frozen world with turquoise seas, wisps of cloud and two moons."
- [x] `convex/shared/worldPalettes.ts`: 24 curated palettes, 4 per biome. **Pending brand:** the kit has only one triad per biome, so 18 palettes are derived from the moodboard (noted in `docs/brand/README.md`).
- [x] `convex/shared/color.ts` (hex, HSL, linear), plus `convex/shared/bloom.ts`: levels from XP and `unlocksFor(level)`. Caps arrive in Phase 7.
- [x] Experience shell (ADR-019):
  - `ExperienceMount` sits in the root layout and lazy-loads `ExperienceRoot` on the first `ThreeView`.
  - One `<Canvas>`: `frameloop="never"`, flat, `alpha: false`.
  - `clock.ts`: `gsap.ticker` drives R3F, and world time is separate from render time.
  - `quality.ts` and the zustand `experience` store: detect-gpu with self-hosted benchmarks (`scripts/copy-gpu-benchmarks.mjs`, never a CDN). PerformanceMonitor drops at most two tiers. The user override is kept in `worldling:quality:v1`.
  - `SpaceBackdrop`: Void, 8% tints and static stars, matching the CSS backdrop.
- [x] Planet (`src/three/planet/*`, `src/three/shaders/*`):
  - Surface: a smooth low-frequency displaced shape with per-pixel FBM height for color and bump. Biome touches: dune ribbons and mesas, polar caps, lava seams, crystal sparkle, verdant rivers.
  - Ocean and inland water share one water shader: shallows, foam, gloss, glints and lava seas.
  - Clouds, with their shadow faked on the surface. Atmosphere, aurora and halo shells. Night lights. Seeded moons and GPU fireflies.
  - Simplex noise keeps its MIT header.
  - `paramsToUniforms` is pure and unit tested. One uniform bag per planet; updates mutate `.value` only.
- [x] Bloom toggles: clouds drift from level 2 (clouds show from level 1, ADR-019), glints 3, vegetation 4, night lights 5, moons 6 and 9, fireflies 7, aurora 8, halo 10.
- [x] Resilience (§8.9):
  - `ThreeErrorBoundary` wraps the canvas and every view.
  - `gl.debug.onShaderError` reports the program log and GPU, then swaps to `FallbackPlanet` (MeshStandardMaterial).
  - Context loss shows "Re-awakening the universe…" and goes to tier 0 after 2 losses or a 5s non-restore.
  - Tier 0 and no WebGL: `PlanetDisc`, a CSS disc in the world's colors.
- [x] Motion: the persistent Pause motion control (`aria-pressed`). Reduced motion keeps ambient motion at 35% speed (the SPEC wins over the brand table, ADR-019).
- [x] `/dev/planet`:
  - All 6 presets, each next to its moodboard tile. The tile is cropped from the PNG and served by a dev-only route at request time, so it never ships.
  - leva: biome, every param, palette, level, tier, pause, perf, and "Copy params".
  - `?freeze=1`, `?tier=`, `?focus=`, `?level=`, `?perf=1`.
- [x] Tests: `uniforms.test.ts`, `quality.test.ts`, `experience.test.ts`, `art.test.ts`, `bloom.test.ts`, `color.test.ts`, plus palettes and `describeWorld` in `worldParams.test.ts`. The no-raw-values check now covers `src/three`.
- [x] e2e `planet.spec.ts`:
  - 6 described worlds with no console or shader errors
  - pixel-identical frozen renders, so the same params give the same world
  - the pause control works
  - axe is clean
  - without WebGL, flat discs show and no canvas is created
- [ ] **60fps on a real mid-range phone.** Open `/dev/planet?focus=oceanic&perf=1` from the LAN on a phone and confirm. Measured here instead:
  - Intel UHD 620 (headless Chrome, D3D11), phone viewport at DPR 2.6, one planet at tier 2: p50, p75 and p95 all 16.7ms, also with 4x CPU throttling.
  - Same machine at tier 3, level 10: p95 50ms. PerformanceMonitor would step it down; pinning a tier disables that.
  - Six planets at tier 2 (dev page only): p75 33ms.

### Phase 5 notes

- **No bloom pass, no r3f-perf (ADR-020).** EffectComposer can't wrap scissored `<View>`s, so tier 3 uses a shader glow term and MSAA. `r3f-perf@7.2.3` pulls drei 9 and zustand 4 (R3F v8), so the overlay is drei `StatsGl`.
- **Sizes.** The 3D chunk is about 241KB gzipped (budget 450KB) and loads only with a view.
- **Pre-existing budget miss (not from this phase):** the landing's initial JS is about 270KB gzipped against the 170KB budget. Phase 5 adds about 1KB to it. Most of it is the root providers (Convex, auth). Worth a look before Lighthouse CI lands.
- **`body` is `isolate`** so the fixed canvas at `z-index: -1` paints above the body background.
- **Art colors** enter the renderer only through `--art-*` tokens (`src/three/art.ts`). Palettes are world data in `convex/shared`, not UI tokens.
- **The presets match the moodboard in mood and color, not in detail.** They have no trees, crystal spires or waterfalls; those need meshes, which ADR-001 rules out for v1. Fine-tune them in `/dev/planet` with leva, then use "Copy params" and paste into `PRESETS`.
- **SwiftShader is slow:** the e2e planet tests use tier 1 and longer timeouts. Run the full e2e serially or against a production build; the keyboard spec fails on dev only because of the Next dev overlay.

## Brand pass: phases 1 to 4

- [x] ADR-018. SPEC §3.2, §3.3, §3.5 and §3.7 now carry the 08 values; names are unchanged.
- [x] Tokens from one source. `scripts/build-tokens.mjs` (`pnpm tokens`, `pnpm tokens:check`) reads `docs/brand/08-handoff/worldling.tokens.json` and generates two outputs:
  - the brand block of `src/styles/tokens.css`
  - `convex/email/templates/emailTheme.ts`

  Tailwind defaults for color, text, radius, ease, shadow, blur and breakpoints are reset. App-only tokens (scrim, Google colors, containers, overlay animations, `duration-flight`) and the SPEC aliases (`gradient-brand`, `focus-ring-*`) are kept by hand.

- [x] `src/lib/motion.ts`: every 08 duration and easing (as cubic-bezier points), `registerEases(gsap)` for matching `CustomEase`s, and a reduced-motion block. The parity test covers every duration and ease.
- [x] Typography: `next/font` in `src/styles/fonts.ts`, with Bricolage `opsz` and `wdth` axes and `latin-ext`. The 9-level fluid scale and UI styles come in as `text-*` sizes and `wl-*` utilities. The old `text-xs` to `text-3xl` scale is retired and components are migrated. Base `h1` to `h3` use the brand levels.
- [x] UI style (05), from `globals.css` utilities:
  - `glass` and `glass-panel`: 88% Deep Space, 20px blur, opaque fallback, panel shadow, 20/24px padding.
  - `border-control`: Control Line, or Dust inside glass.
  - `pressable`: 150ms color, 100ms press to 0.985, no scaling with reduced motion.

  Also: dialog and sheet use `shadow-dialog` and the 240/180ms panel motion. Selected swatches and segments get `shadow-selection`. Inputs sit on Void at 48px. The primary button is a Sunrise pill at 48px. Focus is 2px Aurora with a 3px offset.

- [x] Backdrop: static round-dot stars (05 density), with Nebula and Aurora tints at 8% or less over Void.
- [x] Icons (05): lucide is restroked to 1.75 with round caps and joins, sizes are limited to 16, 20, 24 and 32, and decorative icons are `aria-hidden`. Brand icons don't ship (ADR-018).
- [x] Logo: the horizontal lockup is at its 160px minimum in every shell. The hero gradient mark is used only at 128px (404). The apple icon is now the square source, so iOS applies its own mask.
- [x] Auth and onboarding: one centered glass panel from `sm` up. Below `sm`, the 06 mobile feel: lockup top left, full-bleed content, full-width Sunrise action. The OTP cells, username field and error alert are restyled.
- [x] Emails: the 06 header and footer.
  - Header: logo, display headline, Line divider.
  - Footer: "Visit everyone else's.", "A little kindness travels far.", "Email preferences" and "Unsubscribe".
  - Sunrise pill button.
  - Logo: `public/brand/email/worldling-horizontal-on-dark@2x.png`, linked absolutely from `SITE_URL`.

  `compose.ts` fails mail permanently (`missing_site_url`) without `SITE_URL`. The unsubscribe pages match. No hex outside `emailTheme.ts` (tested).

- [x] Copy audit against 07-voice (table below).
- [x] Checks:
  - `src/styles/contrast.test.ts` (AA from the token JSON, including the 88% glass over bright backdrops). The brand's `audit_colors.py` re-run reports `verified` (175 text and 12 UI pairs).
  - No raw values in components.
  - axe has nothing serious or critical on `/`, `/dev/ui`, 404 and every auth page, now also at phone width.
  - typecheck, lint, test, build and e2e pass.
- [ ] Real `auth.verify` in Gmail, light and dark. Needs production to serve the logo PNG: after deploy, temporarily point dev `SITE_URL` at the production URL, send, then restore `http://localhost:3000`.

### Copy changes

| Where                           | Before                                                                                                        | After                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `userMessageFor` `NOT_FOUND`    | We couldn't find that. It may have drifted away.                                                              | We couldn't find that. It may have moved.                                                                                                                                                                                                                                                        |
| `userMessageFor` `FORBIDDEN`    | You can't do that here.                                                                                       | You don't have access to that.                                                                                                                                                                                                                                                                   |
| `userMessageFor` `RATE_LIMITED` | Easy there. Try again {when}.                                                                                 | Too many tries for now. Try again {when}.                                                                                                                                                                                                                                                        |
| Auth network error              | We can't reach the universe right now. Check your connection.                                                 | We can't connect right now. Check your connection and try again.                                                                                                                                                                                                                                 |
| Route error title               | This page lost its orbit                                                                                      | This page didn't load                                                                                                                                                                                                                                                                            |
| Unsubscribe, invalid link       | This link has drifted away                                                                                    | This link has expired                                                                                                                                                                                                                                                                            |
| Page title separator            | `\|` on global error and unsubscribe pages                                                                    | `·` everywhere                                                                                                                                                                                                                                                                                   |
| Marketing footer                | Worldling. Grow a world of your own.                                                                          | Grow a world of your own. / Visit everyone else's.                                                                                                                                                                                                                                               |
| `account.welcome` subject       | Welcome to Worldling, {name}                                                                                  | Your little corner of the universe (07 key)                                                                                                                                                                                                                                                      |
| `account.welcome` body          | Welcome, {name} / … Tend it each day and it grows. … / Visit your world                                       | Grow a world of your own. / Hi {name}, / You've found a little corner of the universe. {world} is out there now, ready to grow. Visit other worlds and leave a comet, a short, kind message, when one makes you smile. / View my world / Your world will bloom as you tend it and friends visit. |
| `comets.alert` subject          | A comet landed on {world} / {n} comets landed on {world}                                                      | A comet landed on your world / {n} comets landed on your world (07 key)                                                                                                                                                                                                                          |
| `comets.alert` body             | Hi {name}, visitors left you something. / See your comets                                                     | Hi {name}, / Visitors left you something kind. / Read my comets                                                                                                                                                                                                                                  |
| `digest.weekly` body            | Hi {name}, here is how your world did this week. / Level {n} / {n} days of tending in a row / Tend your world | Hi {name}, / Here is what happened on your world this week. / Bloom level {n} / Tended on {n} days (no streak pressure) / Tend my world                                                                                                                                                          |
| `account.export` button         | Download your data                                                                                            | Download my data                                                                                                                                                                                                                                                                                 |
| `account.deleted` heading       | Goodbye for now, {name}                                                                                       | Goodbye for now (greeting "Hi {name},")                                                                                                                                                                                                                                                          |
| Email footer                    | Worldling. Grow a world of your own. / Unsubscribe from these emails                                          | Visit everyone else's. / A little kindness travels far. / Email preferences / Unsubscribe                                                                                                                                                                                                        |

Everything else was already on voice, so it stays as it was. That covers the auth and onboarding forms, the username and password rules, the account screens and the shared states. The e2e-asserted headings and buttons are unchanged.

### Brand pass notes

- **Spacing names must not shadow containers.** Tailwind resolved `max-w-panel` to a `--spacing-panel` padding token, so the padding tokens are `panel-pad` and `panel-pad-lg`.
- **tailwind-merge knows the brand scales** (`src/lib/utils.ts`). Without that, `text-body-lg` read as a color and stripped `text-on-warm` from the large button.
- **Weight companions.** `text-*` brand sizes set a font weight, so a size utility on a button needs an explicit weight after it (the large button has `font-semibold`).
- **E2E username.** The sign-up flow now uses a letters-only random username. Random hex could hold a run of digits the moderation filter reads as a phone number, which made the test flaky.

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

- **Brand kit indexed (2026-10-18).** `docs/brand/README.md` maps every file, extracts every value and records the logo and contrast checks. The kit uses numbered folders (`02-logo` to `08-handoff`). The `08` handoff that was pending is done: the brand pass applied it (ADR-018). **Still pending brand:** a dark optical favicon for light backgrounds. The light-theme status colors that need darker values are in the README for when the light theme lands.

- **Pinned versions.** All dependencies are exact (`.npmrc` `save-exact=true`). Only Phase 0 dependencies are installed. Later phases add theirs, also pinned.
- **TypeScript 6.0.3, not 7.** typescript-eslint 8.71 supports `<6.1.0`, and TS 7 (native port) breaks the compiler API used by Next and ESLint.
- **ESLint 9.39.5, not 10.** eslint-config-next 16.4.2 bundles eslint-plugin-react, -import and -jsx-a11y, which cap at ESLint 9. npm flags 9.x as deprecated. Move to 10 when those plugins support it.
- **Local Node is 22.16.0.** jsdom 30 and lint-staged 17 need Node 22.22+, so jsdom is pinned to 29.1.1 and lint-staged to 16.4.0. CI uses the latest Node 22 (`.nvmrc`). Upgrading local Node to 22.22+ would allow both bumps.
- **Cache Components + Partial Prefetching on.** These are the Next 16.4 template defaults and become default in the next major. Revisit in the Phase 4 auth spike (§6.5) if Convex Auth's server helpers clash with them.
- **`pnpm typecheck` runs `next typegen` first** so route types (`LayoutProps`, typed routes) exist on a clean checkout. It needs the Next env vars (CI sets placeholders).
- **Security headers (§11.2), Sentry, analytics** are not in Phase 0. They land with their phases.
- **Playwright** is not in CI yet (§13.3 step 6 needs Vercel previews).
