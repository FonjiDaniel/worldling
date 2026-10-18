# Worldling: Build Specification

> Grow a world of your own. Visit everyone else's.

| | |
|---|---|
| Version | 1.0 |
| Date | 2026-10-16 |
| Owner | King Baron (DataCleanHub) |
| Audience | The builder, and Claude Code as the implementing engineer |
| Status | Approved for build |

---

## 0. How to use this document

This file is the single source of truth for the product and the system. Claude Code builds from it, phase by phase (see §15).

**Setup in the repo:**

1. Save this file as `docs/SPEC.md`.
2. Copy Appendix A into `CLAUDE.md` at the repo root. Claude Code reads that file on every session.
3. Create `docs/PROGRESS.md` (empty). Claude Code updates it at the end of every phase so any new session knows exactly where things stand.
4. Create `docs/decisions/` for Architecture Decision Records (ADRs). Any decision that changes or extends this spec gets an ADR first.

**Rules for the implementer:**

- Section numbers (§) are stable. Refer to them in commits, ADRs and PRs.
- If the code and this spec disagree, stop and ask. Do not silently pick one.
- If something here is technically wrong or outdated (a library API changed), write a short ADR, propose the fix, then proceed.
- "MUST" is a hard rule. "SHOULD" is the default unless an ADR says otherwise. "MAY" is optional.

---

## 1. Product

### 1.1 One-liner

Worldling is a web experience where every person grows their own small, living 3D planet, and every planet lives together in one shared universe that anyone can fly through.

### 1.2 Product principles

These settle arguments. When two good ideas conflict, the higher principle wins.

1. **Wonder first.** The first 10 seconds must make people say "whoa". If a feature makes the experience less magical, it waits.
2. **Ownership.** "My world" is the emotional core. Every feature should deepen the feeling that this place is mine.
3. **Kindness by design.** The only social action is leaving a kind note. No likes, no follower counts, no public rankings of people. Moderation is built in from day one, not bolted on later.
4. **Free core, forever.** Creating, growing, visiting and sending comets are free forever. Money only ever comes from optional looks and extras (§14).
5. **Performance is a feature.** 60fps on a mid-range Android phone is a requirement, not a nice-to-have. Beauty that stutters is not beauty.
6. **Accessible wonder.** Reduced-motion users, keyboard users and screen reader users get a complete, dignified experience.
7. **Calm, not compulsive.** No guilt streaks, no dark patterns, no manipulative notifications. People come back because they want to.

### 1.3 Who it's for

- **Primary:** 16 to 35 year olds who enjoy cozy, creative, shareable things online (fans of Animal Crossing, r/place, Tamagotchi, aesthetic web toys).
- **Secondary:** creative developers and designers who share impressive web experiences.
- **Growth loop:** a person creates a world, shares their link (WhatsApp, X, Instagram story), friends visit, leave comets, then create their own world.

### 1.4 Core loop

```
 Arrive (landing cinematic)
   -> Create a world (no account needed yet)
   -> Claim it (sign up, pick username)
   -> Share link worldling.app/w/username
   -> Friends visit, leave comets
   -> World blooms (grows) from care and visits
   -> Owner returns to tend it, reads comets, visits others
   -> repeat
```

### 1.5 Scope by release

**v1.0 (MVP, the launch)**

- Cinematic landing page (scroll driven)
- World creator with presets, curated palettes, randomize, undo/redo
- Guest drafts (create before signing up), then claim on sign up
- Sign up / sign in: email + password (with email code verification) and Google
- Username onboarding
- Public world page with share link and auto-generated share image
- Shared universe: fly around, click any world to visit
- Comets (short kind messages) with moderation, reporting and blocking
- Bloom system (worlds grow visually with care)
- In-app notifications, comet email alerts (batched), weekly digest (opt in)
- Account settings, account deletion, data export
- Admin dashboard (users, worlds, moderation, email transport, settings, audit log, system health)
- Email system with admin-switchable transport (Gmail SMTP now, Resend later)

**v1.1**

- Second and third world slots (groundwork for Plus)
- World "time-lapse" video export
- Explore page improvements (themes, featured collections)

**v2.0**

- Monetization (§14): Worldling Plus and cosmetic packs
- Seasonal events (meteor showers, eclipses visible across the universe)

### 1.6 Non-goals (explicitly out of scope)

- Chat or direct messages between users
- Follower counts, likes, public popularity rankings of people
- Native mobile apps (the web app must feel native on mobile instead)
- User-uploaded images or 3D models (moderation risk, performance risk)
- Admin impersonation of users (security risk, see §11)
- Virtual currency (regulatory and design complexity, see §14)

### 1.7 Success metrics

| Metric | Definition | Launch target |
|---|---|---|
| Activation | % of new visitors who create and claim a world in their first session | 25% |
| D1 / D7 retention | % of claimers who return on day 1 / day 7 | 35% / 18% |
| Share rate | % of claimers who copy or share their link | 40% |
| Viral coefficient | New claimers per existing claimer via share links | > 0.3 |
| Kindness ratio | % of comets never reported | > 99% |
| Performance | p75 frame rate on mobile in universe view | >= 55fps |

---

## 2. Experience design

### 2.1 Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Cinematic landing, primary CTA "Create your world" |
| `/create` | Public (guest or signed in) | World creator |
| `/universe` | Public | Shared universe explorer |
| `/w/[username]` | Public | A person's world: view, visit, leave comet |
| `/sign-in`, `/sign-up` | Guest only | Auth |
| `/verify` | Guest (mid-flow) | Enter email code |
| `/reset-password` | Guest | Password reset by code |
| `/onboarding` | Signed in, no username yet | Pick username, claim draft |
| `/me` | Signed in | Redirects to own world page |
| `/notifications` | Signed in | In-app notifications |
| `/settings` | Signed in | Profile, email prefs, blocked users, export, delete |
| `/admin/**` | Moderator / Admin | Admin dashboard (§9) |
| `/about`, `/privacy`, `/terms`, `/guidelines` | Public | Static pages |
| `/dev/**` | Development only | Shader playgrounds, never shipped to production |

### 2.2 Key flows

**First visit**

1. Landing loads a static poster frame instantly (LCP), then the 3D scene fades in once ready.
2. Scrolling flies the camera through space: a dust cloud, a world forming, a pull-back revealing thousands of worlds, then the CTA.
3. A "Skip intro" control is always visible. Reduced-motion users get a calm static version with the same content.

**Create (guest)**

1. `/create` opens with a random preset already spinning. Nobody starts from a blank slate.
2. Panel: Presets (6 biomes), Shape (terrain sliders), Colors (curated palettes, advanced mode for custom), Sky (atmosphere, clouds), Motion (spin, tilt), Name.
3. Randomize button rolls a new seed with a satisfying animation.
4. Undo/redo (Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, and on-screen buttons).
5. Draft autosaves to `localStorage` (key `worldling:draft:v1`) on every change (debounced 300ms).
6. "Claim this world" opens sign up. After sign up and onboarding, the draft is claimed automatically and the user lands on their world page with a celebration moment.

**Visit and comet**

1. On `/w/[username]`, the world fills the screen. The owner's name, bloom level and recent comets (orbiting as small glowing streaks) are visible.
2. A visit is recorded after 3 seconds of the tab being visible (filters drive-by loads and bots).
3. "Send a comet" opens a small composer (140 characters max). Signed out visitors are asked to sign in first, with their typed message preserved.
4. On send, the comet animates from the camera into orbit around the world.

**Return (tend)**

1. When the owner opens their own world, the first open of each UTC day counts as "tending" (+XP, §2.4).
2. New comets since the last visit play an arrival animation, then appear in a list.

### 2.3 World anatomy

A world is fully described by a small parameter object (§5.2 `worldParams`). Nothing is stored as images except the share thumbnail. The same parameters render the same world on every device.

Visual layers (inside to outside):

1. **Surface:** displaced sphere, colored by elevation using a 5-stop palette.
2. **Ocean:** sphere at sea level with fresnel and specular highlights.
3. **Night lights:** emissive city-like specks on the dark side (unlocked by bloom).
4. **Clouds:** animated noise shell.
5. **Atmosphere:** back-face glow shell with fresnel falloff.
6. **Orbitals:** moons, satellites, comets in orbit, optional cosmetic rings.

Biome presets (starting points, everything stays editable): `oceanic`, `verdant`, `desert`, `frozen`, `volcanic`, `crystal`.

### 2.4 Bloom system (growth)

Worlds earn Bloom XP from care. Levels unlock visual features. Earned unlocks can never be bought (§14), which keeps them meaningful.

**XP sources (all capped per UTC day to prevent farming):**

| Source | XP | Daily cap | Rules |
|---|---|---|---|
| Owner tends world | +10 | once per day | First open of own world each UTC day |
| Gentle streak bonus | +1 per consecutive day | max +5 | Missing a day resets the bonus only. XP is never lost. |
| Unique visitor | +2 | 20 visitors (40 XP) | Signed in, verified, not the owner, not blocked, one per visitor per world per day |
| Comet received | +5 | 10 comets (50 XP) | Comet must be visible (not pending/hidden), one counted per author per world per day |
| Comet sent | +1 to sender's world | 5 per day | Rewards kindness toward others |

**Levels (cumulative XP) and unlocks:**

| Level | XP | Unlock |
|---|---|---|
| 1 | 0 | Base world |
| 2 | 50 | Drifting clouds |
| 3 | 140 | Ocean glints |
| 4 | 260 | Vegetation spreads across lowlands |
| 5 | 420 | Night lights on the dark side |
| 6 | 620 | First moon |
| 7 | 870 | Fireflies (tiny orbiting lights) |
| 8 | 1170 | Polar aurora |
| 9 | 1520 | Second moon |
| 10 | 2000 | Radiant halo and a profile badge |

Level formulas and caps live in one pure module (`convex/shared/bloom.ts`) with unit tests. Clients use the same module to preview progress.

### 2.5 The universe

- Worlds are placed on a **Vogel (sunflower) spiral**: world N gets a fixed slot, its position computed from the slot number (§8.4). Positions never change, so the universe is stable and the layout grows outward forever with even density.
- Navigation: drag to orbit, scroll or pinch to zoom, click a world to fly to it. Keyboard: arrow keys to pan, `+`/`-` to zoom, `Tab` cycles through nearby worlds, `Enter` visits.
- Search by username flies the camera to that world.
- "Just born" toast when a new world appears nearby in real time.
- **List mode** toggle: an accessible, paginated list of worlds with text descriptions. Same data, no WebGL needed. Also the automatic fallback when WebGL is unavailable.

### 2.6 Comets

- 1 to 140 characters (counted as graphemes, so emoji count correctly).
- No links, no email addresses, no phone numbers.
- Profanity and slur filter (§11.6). Clear violations are rejected with a friendly message ("Let's keep the universe kind."). Borderline content is held as `pending` for the owner.
- Owners can turn on "Review comets before they appear".
- Owners can hide any comet on their world and block its author.
- Anyone signed in can report a comet. 3 unique reports auto-hide it pending moderator review.
- Authors can delete their own comets.

### 2.7 Notifications

- **In-app:** comet received, world leveled up, comet hidden by moderation (to the author, with guideline link).
- **Email (all opt-in except security emails):**
  - Comet alerts: batched hourly at most ("3 comets landed on your world").
  - Weekly digest (Monday 09:00 UTC): visits, comets, level progress.
  - Product updates: off by default.
- Every non-security email has a one-click unsubscribe link (§7.8).

### 2.8 States

Every screen MUST design all of these: loading, empty, partial, error, offline, signed out, suspended, maintenance. Examples:

- Empty universe area: "This corner of space is quiet. For now."
- No comets yet: "No comets yet. Share your world to get the first one."
- Offline: a small banner, the 3D keeps running, actions queue disabled with a clear reason.
- WebGL unavailable: static thumbnail plus list mode, never a blank screen.

### 2.9 Voice

Warm, curious, short. Speak like a friendly guide, never like a corporation.

- Say "your world", "visit", "comet", "tend", "bloom". Avoid "content", "engagement", "users" in the UI.
- Errors explain what happened and what to do next, in one or two sentences.
- No exclamation marks in errors. Celebrate successes sparingly.

---

## 3. Design system

### 3.1 Foundations

- **Dark-first.** The universe is the canvas. A light theme exists for static pages and admin only.
- **Glass over space.** Panels float above the 3D scene with blur and a subtle border. Text contrast MUST pass WCAG AA against the worst-case background behind the glass (use a darker scrim behind text when needed).
- **Tokens are the only source of values.** No raw hex, px or ms values in components. Everything comes from tokens defined in `src/styles/tokens.css` via Tailwind v4 `@theme`.

### 3.2 Tokens (brand kit values, ADR-013, ADR-018)

Values come from `docs/brand/08-handoff/worldling.tokens.json`. `pnpm tokens` generates the brand block of `src/styles/tokens.css` and the email theme from it. The names below are fixed; values are illustrative of the 08 handoff.

```css
@theme {
  /* Color: semantic names only in components. */
  --color-void: #07071a;          /* Void: app background, ink on bright fills */
  --color-surface: #11122b;       /* Deep Space: panels base */
  --color-surface-raised: #1a1b3a; /* Orbit */
  --color-glass: rgb(17 18 43 / 88%); /* with 20px blur; opaque surface fallback */
  --color-line: #34365a;          /* decorative separators only */
  --color-control-line: #696c91;  /* required control boundaries */
  --color-glass-control-line: #9a9bb8; /* control boundaries inside glass */
  --color-text: #f4f1ea;          /* Starlight */
  --color-text-muted: #9a9bb8;    /* Dust */
  --color-link: #a99fff;          /* Nebula 300 */
  --color-primary: #7c6cff;       /* Nebula */
  --color-accent: #3fe0c5;        /* Aurora, also the focus ring */
  --color-warm: #ff8a5b;          /* Sunrise, main CTA */
  --color-success: #68dfa9;
  --color-warning: #f4c969;
  --color-danger: #ff7b91;
  --color-info: #8ab4ff;
  /* Plus: on-* (Void), *-surface status backgrounds, warm-hover/active,
     nebula/aurora/sunrise 50..950 scales, gradient-brand. See tokens.css. */

  /* Type (families load through next/font, src/styles/fonts.ts) */
  --font-display: "Bricolage Grotesque", "Trebuchet MS", Arial, sans-serif;
  --font-sans: "Geist", system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;

  /* Radius */
  --radius-sm: 0.5rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-panel: 0 16px 48px rgb(0 0 0 / 32%), inset 0 1px 0 rgb(244 241 234 / 4%);
  --shadow-dialog: 0 24px 80px rgb(0 0 0 / 45%);
  --shadow-selection: 0 0 24px rgb(63 224 197 / 12%);

  /* Motion */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --ease-press: cubic-bezier(0.4, 0, 1, 1);
  --duration-press: 100ms;
  --duration-fast: 150ms;        /* hover and focus color */
  --duration-base: 240ms;        /* panel entrance (exit 180ms) */
  --duration-slow: 600ms;        /* world focus */
  --duration-bloom: 1200ms;
  --duration-reduced: 150ms;     /* the reduced-motion fade */
}
```

Motion tokens are mirrored in `src/lib/motion.ts` for GSAP, as cubic-bezier control points registered as `CustomEase`s, so CSS and GSAP feel identical:

```ts
export const motion = {
  duration: { fast: 0.15, base: 0.24, slow: 0.6, press: 0.1, bloom: 1.2, flight: 1.6 /* ... */ },
  ease: { out: [0.2, 0.8, 0.2, 1], "in-out": [0.45, 0, 0.55, 1] /* ... */ },
} as const;
```

### 3.3 Type scale

Fluid sizes with `clamp()` between 360px and 1440px viewports: `display`, `h1` to `h4`, `body-lg`, `body`, `small`, `caption`, plus UI styles `button`, `label`, `input`, `data`, `timestamp` (ADR-018). Display font only for `display` to `h3` and the world name. Body text minimum 16px on mobile. Line length 50 to 65 characters for reading text.

### 3.4 Components

Built on shadcn/ui (Radix primitives), restyled with our tokens. Required set: Button (primary warm, secondary glass, ghost, danger), IconButton, Input, Textarea with grapheme counter, Slider, Swatch picker, Segmented control, Dialog, Sheet (mobile panels), Popover, Tooltip, Toast (sonner), Tabs, Badge, Avatar, Skeleton, DataTable (admin, TanStack Table), Chart (admin, shadcn charts), EmptyState, ErrorState, ConfirmDialog with typed confirmation.

### 3.5 Motion principles

- Purposeful: motion explains where things came from and where they went.
- UI transitions 100 to 240ms (press, color, panels). World moments 600 to 1200ms (focus, comet, bloom). Camera flights 1.2 to 2.0s. No bounce or overshoot. Nothing blocks input longer than 2s, and every flight can be interrupted by user input.
- Ease out for things entering, ease in-out for things moving.
- `prefers-reduced-motion`: no camera flights (cut with a quick fade instead), no parallax, no scrubbed scroll, planets still rotate slowly (it's ambient, not disorienting) but can be paused with a visible control.

### 3.6 Responsive

Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Mobile-first. On mobile the creator panel is a bottom sheet with snap points, the world takes the top 60% of the screen. Touch targets minimum 44x44px.

### 3.7 Accessibility (WCAG 2.2 AA)

- All interactive elements keyboard reachable, visible focus ring (accent color, 2px wide, 3px offset).
- Every world has a generated text description from its parameters, for example "A frozen world with pale blue oceans, thick clouds and two moons." Used as the canvas `aria-label` and in list mode.
- Live regions announce comet sent, level up, errors.
- Color is never the only signal.
- Automated checks: axe in Playwright on every main route.

### 3.8 3D art direction

- Stylized realism: soft, painterly color, not photoreal. Think "museum diorama of a tiny planet".
- Palettes are curated so every combination looks good. Advanced mode allows custom colors but clamps saturation and lightness to safe ranges.
- Space background: deep gradient, sparse twinkling stars, faint nebula dust. Never busy. The worlds are the stars of the show.
- Bloom post-processing only on high tier devices, tuned subtly.

---

## 4. Architecture

### 4.1 Overview

```
                    +-----------------------------+
   Browser          |  Next.js 16 app (Vercel)    |
  +-----------+     |  - RSC pages, metadata, OG  |
  | React 19  |<--->|  - proxy.ts (auth cookies)  |
  | R3F scene |     |  - Route handlers (OG imgs) |
  | GSAP/Lenis|     +--------------+--------------+
  +-----+-----+                    | fetchQuery / preloadQuery (server)
        | websocket (live queries) |
        v                          v
  +-----------------------------------------------------+
  |                  Convex (backend)                   |
  |  Queries / Mutations / Actions (thin)               |
  |  model/ (business logic)   lib/ (auth, errors, log) |
  |  Convex Auth   Rate limiter   Workpool   Counters   |
  |  Scheduler + Crons         File storage (thumbs)    |
  |  "use node" actions: email dispatch (SMTP/Resend)   |
  +---------------------------+-------------------------+
                              |
              +---------------+---------------+
              v                               v
       Gmail SMTP (now)                 Resend (later)
```

### 4.2 Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React 19.2) | Latest stable, RSC for SEO pages, `proxy.ts` for auth |
| Language | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true` | Catch bugs at compile time |
| Styling | Tailwind CSS v4 + shadcn/ui | Token-driven, fast, accessible primitives |
| Backend | Convex | Realtime by default, transactions, scheduler, storage, typed end to end |
| Auth | Convex Auth (`@convex-dev/auth`) | Owner's choice. Lives in Convex, no extra vendor |
| 3D | three + @react-three/fiber v9 + @react-three/drei v10 + @react-three/postprocessing v3 | React 19 compatible pmndrs line |
| Animation | GSAP 3 (+ ScrollTrigger, `@gsap/react`) | Best timeline tool, now free including plugins |
| Scroll | Lenis (`lenis` package) | Smooth scroll that syncs with ScrollTrigger |
| Client state | Zustand | Standard for R3F, works outside React render |
| Forms | react-hook-form + zod | Shared validation, good DX |
| Email | nodemailer (SMTP) + Resend SDK, React Email templates | Admin-switchable transport (§7) |
| Convex helpers | `convex-helpers` (>= 0.1.127, security fix), `@convex-dev/rate-limiter`, `@convex-dev/workpool`, `@convex-dev/sharded-counter` | Battle-tested building blocks |
| Moderation | `obscenity` | Handles leetspeak and variants |
| Device tiering | `detect-gpu` | Choose quality tier before first frame |
| Debug | `leva` (dev only), `r3f-perf` (dev only) | Live tuning and performance overlay |
| Errors | Sentry (`@sentry/nextjs`) | Client + server error tracking |
| Analytics | Vercel Analytics + Speed Insights | Privacy friendly, zero config |
| Testing | Vitest, `convex-test`, Testing Library, Playwright, axe | Full pyramid |
| Tooling | pnpm, ESLint (flat config, typescript-eslint strict), Prettier (+ tailwind plugin), Husky + lint-staged | Consistency |
| Runtime | Node 22 LTS | Next 16 requires Node 20.9+ |

Pin exact versions in `package.json` at Phase 0. Upgrade deliberately, never with `latest` in CI.

### 4.3 Key decisions (summaries, full ADRs in `docs/decisions/`)

| # | Decision | Rejected alternatives | Reason |
|---|---|---|---|
| ADR-001 | Worlds are procedural: stored as parameters, rendered by shaders | Storing textures or meshes | Tiny payloads (under 1KB per world), infinite variety, instant edits, no CDN costs |
| ADR-002 | One persistent WebGL canvas for the whole app, scenes rendered through drei `View` | A new `<Canvas>` per page | Browsers cap WebGL contexts, re-creating contexts is slow and leaks memory, a persistent canvas allows seamless page transitions |
| ADR-003 | Single animation clock: `gsap.ticker` drives Lenis and R3F (`frameloop="never"` + `advance`) | Three separate rAF loops | No jitter between scroll, camera and render. Fallback: R3F default loop if a drei feature misbehaves (record in ADR) |
| ADR-004 | Thin Convex functions, logic in `convex/model/*` | Fat handlers | Testable, reusable, one place per rule |
| ADR-005 | All public Convex functions go through custom wrappers (`publicQuery`, `userMutation`, `staffMutation`, `adminMutation`) | Ad hoc auth checks | Auth, suspension, maintenance and logging can never be forgotten |
| ADR-006 | Bloom XP via append-only queue processed by a cron | Updating the world doc on every visit/comet | Avoids write conflicts on popular worlds, gives an audit trail, makes caps easy |
| ADR-007 | Email via outbox table + workpool + provider adapters, config in DB, secrets encrypted with AES-256-GCM | Hard-coded provider, plaintext secrets, Convex Resend component only | Admin can switch Gmail to Resend without a deploy, every email is logged, retries are safe |
| ADR-008 | Env-based fallback email config | DB-only config | Solves bootstrap: the first admin must verify their email before any admin can configure email |
| ADR-009 | Curated palettes by default, clamped custom colors | Free color pickers | Every world looks good, which protects the "wow" and the share images |
| ADR-010 | Security enforced in Convex, Next.js checks are UX only | Relying on `proxy.ts` or layouts | Any client can call Convex directly, so Convex is the real boundary |
| ADR-011 | No admin impersonation | "Log in as user" | Large security and trust risk, read-only detail views cover support needs |
| ADR-012 | Universe data streamed by sector | Subscribing to all worlds | Scales to 100k+ worlds with bounded bandwidth and memory |
| ADR-013 | Brand color tokens replace §3.2 values | Two parallel palettes | One semantic palette from the brand kit, light theme deferred |

### 4.4 Repository structure

```
.
├─ CLAUDE.md
├─ docs/
│  ├─ SPEC.md
│  ├─ PROGRESS.md
│  └─ decisions/            # ADR-XXX-title.md
├─ convex/
│  ├─ convex.config.ts      # components: rateLimiter, workpool, shardedCounter
│  ├─ schema.ts
│  ├─ auth.ts               # Convex Auth providers + callbacks
│  ├─ auth.config.ts
│  ├─ http.ts               # auth routes, unsubscribe, (later) webhooks
│  ├─ crons.ts
│  ├─ shared/               # PURE code shared with Next.js (no Convex imports)
│  │  ├─ worldParams.ts     # zod schema, presets, palettes, clamps, describeWorld()
│  │  ├─ bloom.ts           # levels, caps, unlocks
│  │  ├─ galaxy.ts          # slot -> position, sector keys
│  │  ├─ moderation.ts      # comet text normalization + checks
│  │  ├─ usernames.ts       # rules + reserved list
│  │  └─ errors.ts          # error codes + user messages
│  ├─ lib/
│  │  ├─ functions.ts       # custom query/mutation/action wrappers
│  │  ├─ errors.ts          # appError(), ConvexError helpers
│  │  ├─ logger.ts          # structured logging
│  │  ├─ crypto.ts          # AES-256-GCM encrypt/decrypt
│  │  ├─ rateLimits.ts      # rate limiter definitions
│  │  ├─ settings.ts        # typed settings + feature flags
│  │  ├─ audit.ts           # writeAudit()
│  │  ├─ time.ts            # utcDay(), etc.
│  │  └─ env.ts             # typed env access with clear errors
│  ├─ model/                # business logic, called by thin handlers
│  │  ├─ profiles.ts  worlds.ts  comets.ts  visits.ts
│  │  ├─ bloom.ts  galaxy.ts  notifications.ts  reports.ts
│  │  └─ accounts.ts        # deletion, export
│  ├─ email/
│  │  ├─ outbox.ts          # enqueue (internal mutation), mark sent/failed
│  │  ├─ dispatch.ts        # "use node": render + send via adapter
│  │  ├─ providers.ts       # "use node": SmtpProvider, ResendProvider
│  │  ├─ config.ts          # load active config (DB or env fallback)
│  │  └─ templates/         # React Email components
│  ├─ admin/                # staff-only functions
│  │  ├─ users.ts worlds.ts moderation.ts email.ts settings.ts
│  │  ├─ metrics.ts audit.ts system.ts
│  ├─ profiles.ts worlds.ts comets.ts universe.ts
│  ├─ notifications.ts reports.ts account.ts
│  └─ jobs/                 # internal functions run by crons/scheduler
│     ├─ bloomProcessor.ts emailDigests.ts rollups.ts cleanup.ts accountPurge.ts
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/       # landing, about, legal
│  │  ├─ (auth)/            # sign-in, sign-up, verify, reset-password
│  │  ├─ (app)/             # create, universe, w/[username], me, settings, notifications, onboarding
│  │  ├─ admin/
│  │  ├─ dev/               # dev-only playgrounds (404 in production)
│  │  ├─ layout.tsx  error.tsx  global-error.tsx  not-found.tsx
│  │  ├─ sitemap.ts  robots.ts
│  ├─ components/
│  │  ├─ ui/                # shadcn primitives, restyled
│  │  └─ shared/            # app-wide composites (EmptyState, ErrorState...)
│  ├─ features/             # feature folders: creator, universe, world, comets, auth, admin, landing
│  ├─ three/
│  │  ├─ ExperienceRoot.tsx # the single persistent canvas
│  │  ├─ clock.ts           # gsap.ticker -> lenis + r3f advance
│  │  ├─ quality.ts         # tier detection + presets
│  │  ├─ planet/            # Planet.tsx, layers, uniforms.ts (pure)
│  │  ├─ universe/          # Galaxy.tsx, LOD, sector streaming
│  │  ├─ camera/            # CameraRig, flyTo()
│  │  ├─ shaders/           # GLSL as TS template strings (noise, planet, ocean, clouds, atmosphere)
│  │  └─ utils/             # disposal, capture thumbnail
│  ├─ lib/                  # convex client, env, logger, errors, analytics, motion
│  ├─ hooks/
│  ├─ stores/               # zustand stores
│  └─ styles/               # globals.css, tokens.css
├─ tests/
│  ├─ e2e/                  # Playwright
│  └─ fixtures/
├─ proxy.ts                 # Next 16 (see §6.5)
└─ .github/workflows/ci.yml
```

### 4.5 Rendering strategy

- Marketing and legal pages: Server Components, static where possible. The 3D layer is a client island loaded with `next/dynamic` (`ssr: false`) after first paint.
- `/w/[username]`: server `fetchQuery` for metadata + `preloadQuery` to hydrate the client instantly, then live updates over the websocket.
- App pages: client components fed by Convex live queries.
- Admin: server layout does a role check for UX, every query is enforced again in Convex.
- React Compiler: enabled. Code under `src/three/**` mutates refs and three objects by design. If the compiler causes issues there, mark files with `"use no memo"` and record it in an ADR.

---

## 5. Backend (Convex)

### 5.1 Rules for every Convex function

1. Every public function MUST use a wrapper from `convex/lib/functions.ts`. Raw `query`/`mutation`/`action` are allowed only for `internal*` functions.
2. Every function MUST declare `args` validators and SHOULD declare `returns` validators.
3. Never trust a `userId` from the client. The viewer comes from the wrapper.
4. Never use `.filter()` on a database query for anything that can grow. Use indexes (`withIndex`). Never `.collect()` an unbounded set, use `.take(n)` or pagination.
5. Queries MUST be deterministic and MUST NOT depend on `Date.now()` for filtering (reactivity won't re-run when time passes). Time-based data is precomputed by mutations or crons, or the client passes a coarse value.
6. Mutations are transactions. Side effects (email, external calls) go through the scheduler, workpool or outbox, never inline.
7. Long work is chunked: process at most ~200 documents per mutation, then reschedule.
8. Business logic lives in `convex/model/*`, handlers stay under ~30 lines.
9. Range checks (min/max, lengths) are validated with the shared zod schemas from `convex/shared/*` inside the model layer.

### 5.2 Schema

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const role = v.union(v.literal("user"), v.literal("moderator"), v.literal("admin"));
export const accountStatus = v.union(
  v.literal("active"),
  v.literal("suspended"),
  v.literal("deleting"),
);
export const biome = v.union(
  v.literal("oceanic"), v.literal("verdant"), v.literal("desert"),
  v.literal("frozen"), v.literal("volcanic"), v.literal("crystal"),
);

export const worldParamsV1 = v.object({
  version: v.literal(1),
  seed: v.number(),                       // uint32
  biome,
  terrain: v.object({
    scale: v.number(),                    // 0.5..3
    roughness: v.number(),                // 0..1
    amplitude: v.number(),                // 0..0.25 of radius
    seaLevel: v.number(),                 // 0..1
  }),
  palette: v.object({
    id: v.string(),                       // curated id or "custom"
    stops: v.array(v.string()),           // exactly 5 hex colors, clamped
  }),
  ocean: v.object({ color: v.string(), gloss: v.number() }),
  atmosphere: v.object({ color: v.string(), density: v.number() }),
  clouds: v.object({ coverage: v.number(), speed: v.number(), color: v.string() }),
  motion: v.object({ spin: v.number(), tilt: v.number() }),
  cosmetics: v.array(v.string()),         // equipped cosmetic ids (validated vs entitlements)
});

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(),                 // lowercase, unique, ^[a-z0-9_]{3,20}$
    displayName: v.string(),              // 1..40 chars
    role,
    status: accountStatus,
    suspension: v.optional(v.object({
      reason: v.string(), byUserId: v.id("users"), at: v.number(),
    })),
    emailPrefs: v.object({
      cometAlerts: v.boolean(),
      weeklyDigest: v.boolean(),
      productUpdates: v.boolean(),
    }),
    lastActiveDay: v.optional(v.string()), // "YYYY-MM-DD" UTC
    lastCometAlertAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .searchIndex("search_name", { searchField: "displayName", filterFields: ["status"] }),

  worlds: defineTable({
    ownerId: v.id("users"),
    isPrimary: v.boolean(),
    name: v.string(),                     // 1..32 chars
    params: worldParamsV1,
    slot: v.number(),                     // galaxy slot, never reused
    sectorKey: v.string(),                // "x:z", derived from slot
    bloom: v.object({ xp: v.number(), level: v.number(), streak: v.number(), lastTendedDay: v.optional(v.string()) }),
    thumbnailId: v.optional(v.id("_storage")),
    visibility: v.union(v.literal("public"), v.literal("hidden")), // hidden = moderation
    featuredAt: v.optional(v.number()),
    cometReview: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_sector", ["sectorKey"])
    .index("by_slot", ["slot"])
    .index("by_featured", ["featuredAt"]),

  galaxy: defineTable({ nextSlot: v.number() }), // singleton

  worldVisits: defineTable({
    worldId: v.id("worlds"),
    visitorId: v.id("users"),
    day: v.string(),
  }).index("by_world_visitor_day", ["worldId", "visitorId", "day"])
    .index("by_visitor", ["visitorId"]),

  comets: defineTable({
    worldId: v.id("worlds"),
    authorId: v.id("users"),
    body: v.string(),
    status: v.union(v.literal("visible"), v.literal("pending"), v.literal("hidden"), v.literal("removed")),
    hiddenReason: v.optional(v.union(v.literal("owner"), v.literal("reports"), v.literal("moderator"))),
    reportCount: v.number(),
  })
    .index("by_world_status", ["worldId", "status"])
    .index("by_author", ["authorId"])
    .index("by_status", ["status"]),

  bloomQueue: defineTable({
    worldId: v.id("worlds"),
    kind: v.union(v.literal("tend"), v.literal("visit"), v.literal("comet_received"), v.literal("comet_sent")),
    actorId: v.optional(v.id("users")),
    day: v.string(),
  }),

  worldStatsDaily: defineTable({
    worldId: v.id("worlds"),
    day: v.string(),
    visits: v.number(),
    cometsReceived: v.number(),
    cometsSent: v.number(),
    xpGained: v.number(),
  }).index("by_world_day", ["worldId", "day"])
    .index("by_day", ["day"]),

  reports: defineTable({
    targetType: v.union(v.literal("comet"), v.literal("world"), v.literal("profile")),
    targetId: v.string(),
    reporterId: v.id("users"),
    reason: v.union(v.literal("harassment"), v.literal("hate"), v.literal("sexual"),
      v.literal("spam"), v.literal("self_harm"), v.literal("other")),
    note: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
    resolution: v.optional(v.object({ byUserId: v.id("users"), action: v.string(), at: v.number() })),
  })
    .index("by_status", ["status"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_target_reporter", ["targetType", "targetId", "reporterId"]),

  blocks: defineTable({ blockerId: v.id("users"), blockedId: v.id("users") })
    .index("by_pair", ["blockerId", "blockedId"])
    .index("by_blocked", ["blockedId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("comet_received"), v.literal("level_up"), v.literal("comet_moderated")),
    data: v.object({ worldId: v.optional(v.id("worlds")), cometId: v.optional(v.id("comets")), level: v.optional(v.number()) }),
    readAt: v.optional(v.number()),
    emailedAt: v.optional(v.number()),
  }).index("by_user_read", ["userId", "readAt"]),

  settings: defineTable({ key: v.string(), value: v.any(), updatedBy: v.optional(v.id("users")), updatedAt: v.number() })
    .index("by_key", ["key"]),            // value typed by registry in lib/settings.ts

  emailConfigs: defineTable({
    status: v.union(v.literal("draft"), v.literal("verified"), v.literal("active"), v.literal("retired")),
    transport: v.union(v.literal("smtp"), v.literal("resend")),
    fromName: v.string(),
    fromAddress: v.string(),
    replyTo: v.optional(v.string()),
    smtp: v.optional(v.object({ host: v.string(), port: v.number(), secure: v.boolean(), user: v.string(), password: v.optional(v.object({ iv: v.string(), ct: v.string(), kv: v.number(), last4: v.string() })) })),
    resend: v.optional(v.object({ apiKey: v.optional(v.object({ iv: v.string(), ct: v.string(), kv: v.number(), last4: v.string() })) })),
    lastTest: v.optional(v.object({ at: v.number(), ok: v.boolean(), error: v.optional(v.string()) })),
    createdBy: v.id("users"),
    activatedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  emailOutbox: defineTable({
    to: v.string(),
    template: v.string(),                 // key of the template registry
    data: v.any(),                        // validated per template by zod at enqueue
    category: v.union(v.literal("security"), v.literal("transactional"), v.literal("digest"), v.literal("product")),
    status: v.union(v.literal("queued"), v.literal("sending"), v.literal("sent"), v.literal("failed"), v.literal("suppressed"), v.literal("cancelled")),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    provider: v.optional(v.string()),
    providerMessageId: v.optional(v.string()),
    idempotencyKey: v.string(),
    sentAt: v.optional(v.number()),
    rid: v.string(),                      // request id for log correlation
  })
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_status", ["status"])
    .index("by_to", ["to"]),

  emailSuppressions: defineTable({
    email: v.string(),
    scope: v.union(v.literal("all_non_security"), v.literal("digest"), v.literal("comet_alerts"), v.literal("product")),
    reason: v.union(v.literal("unsubscribed"), v.literal("bounced"), v.literal("complained"), v.literal("admin")),
  }).index("by_email", ["email"]),

  auditLog: defineTable({
    actorId: v.id("users"),
    action: v.string(),                   // e.g. "user.suspend", "email.config.activate"
    targetType: v.string(),
    targetId: v.string(),
    before: v.optional(v.any()),          // secrets are NEVER stored here
    after: v.optional(v.any()),
    reason: v.optional(v.string()),
    rid: v.string(),
  })
    .index("by_actor", ["actorId"])
    .index("by_target", ["targetType", "targetId"]),

  systemEvents: defineTable({
    level: v.union(v.literal("warn"), v.literal("error")),
    source: v.string(),                   // "email.dispatch", "jobs.bloom", ...
    code: v.string(),
    message: v.string(),
    context: v.optional(v.any()),         // redacted
    rid: v.optional(v.string()),
  }).index("by_source", ["source"]),

  jobRuns: defineTable({
    job: v.string(),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    ok: v.optional(v.boolean()),
    processed: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_job", ["job"]),

  dailyStats: defineTable({
    day: v.string(),
    signups: v.number(), worldsCreated: v.number(), comets: v.number(),
    activeUsers: v.number(), visits: v.number(), emailsSent: v.number(), emailsFailed: v.number(),
  }).index("by_day", ["day"]),

  // Ready for §14, unused in v1.0
  entitlements: defineTable({
    userId: v.id("users"),
    sku: v.string(),
    source: v.union(v.literal("purchase"), v.literal("subscription"), v.literal("grant")),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("revoked")),
    expiresAt: v.optional(v.number()),
    externalRef: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_external", ["externalRef"]),
});
```

Notes:

- `_creationTime` is used as "createdAt" everywhere. Do not duplicate it.
- All times are epoch milliseconds. All "days" are UTC `YYYY-MM-DD` strings.
- `worldParams` is versioned. A future v2 adds `worldParamsV2` and a pure migration `migrateParams(v1) -> v2`. The renderer only ever receives the latest version.

### 5.3 Function wrappers

```ts
// convex/lib/functions.ts (sketch, implement fully)
import { customQuery, customMutation, customAction } from "convex-helpers/server/customFunctions";
import { query, mutation, action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// publicQuery: no auth required, viewer is optional
// userQuery / userMutation: requires signed-in, active, onboarded viewer
// staffQuery / staffMutation: role moderator or admin
// adminQuery / adminMutation: role admin
// Each wrapper:
//   1. creates rid = crypto.randomUUID()
//   2. resolves viewer { userId, profile } via getAuthUserId + profiles.by_userId
//   3. enforces status (suspended -> SUSPENDED, deleting -> UNAUTHENTICATED)
//   4. enforces maintenance mode for non-admins on mutations
//   5. injects ctx.viewer and ctx.log (logger bound to rid, fn name, userId)
```

Every staff/admin mutation MUST call `writeAudit(ctx, {...})` in the same transaction.

### 5.4 Authorization matrix

| Capability | Guest | User | Moderator | Admin |
|---|---|---|---|---|
| View worlds, universe | yes | yes | yes | yes |
| Create/edit own world | draft only | yes | yes | yes |
| Send comet | no | yes (verified email) | yes | yes |
| Hide comet on own world, block | no | yes | yes | yes |
| Report | no | yes | yes | yes |
| Review reports, hide comets/worlds | no | no | yes | yes |
| Suspend users | no | no | users only | anyone except last admin |
| Change roles | no | no | no | yes |
| Email transport, settings, flags | no | no | no | yes |
| View audit log, system | no | no | read own actions | yes |

### 5.5 Public API (initial)

| Module | Function | Type | Notes |
|---|---|---|---|
| profiles | `me` | publicQuery | Viewer profile or null, plus `needsOnboarding` |
| profiles | `isUsernameAvailable` | publicQuery | Normalizes + checks reserved list |
| profiles | `completeOnboarding` | signedInMutation (signed in, not onboarded) | Creates profile, claims draft world if provided |
| profiles | `updateProfile`, `updateEmailPrefs`, `touchActive` | userMutation | `touchActive` writes at most once per day |
| worlds | `getByUsername` | publicQuery | Public world + owner public profile, hides hidden worlds |
| worlds | `mine` | userQuery | |
| worlds | `create` | userMutation | Allocates slot, validates params |
| worlds | `update` | userMutation | Params/name, rate limited |
| worlds | `generateThumbnailUploadUrl`, `setThumbnail` | userMutation | Validates type and size via `ctx.db.system.get` |
| worlds | `tend` | userMutation | Idempotent per day, enqueues bloom |
| worlds | `recordVisit` | userMutation | Idempotent per visitor per day |
| universe | `sectors` | publicQuery | Args: up to 9 sector keys, returns lightweight pins |
| universe | `renderable` | publicQuery | Full params for near-LOD worlds (max 12 ids) |
| universe | `featured`, `justBorn` | publicQuery | Precomputed lists |
| comets | `listForWorld` | publicQuery | Paginated, visible only (owner also sees pending) |
| comets | `send`, `remove`, `hide` | userMutation | |
| reports | `create` | userMutation | One report per reporter per target |
| blocks | `block`, `unblock`, `list` | user* | |
| notifications | `list`, `unreadCount`, `markRead`, `markAllRead` | user* | |
| account | `requestExport`, `requestDeletion` | userMutation | Deletion is async (§6.7) |
| sessions | `signOutEverywhere` | signedInMutation | Deletes every session and refresh token (§6.4), works while suspended |
| system | `status` | publicQuery | Maintenance state for the maintenance screen |

Universe pins are lightweight: `{ id, slot, name, username, colorA, colorB, level, thumbUrl }`. Full params are only sent for the few worlds near the camera.

### 5.6 Background jobs

| Job | Schedule | What it does |
|---|---|---|
| `jobs.bloomProcessor` | every 1 min | Drains up to 500 `bloomQueue` rows, groups by world, applies caps using `worldStatsDaily`, updates `worlds.bloom`, writes level-up notifications, reschedules itself if more remain |
| `jobs.emailDigests.cometAlerts` | hourly | One batched email per user with unread, un-emailed comet notifications (respects prefs and suppressions) |
| `jobs.emailDigests.weekly` | Mon 09:00 UTC | Weekly digest, processed in batches of 100 users |
| `jobs.rollups.daily` | daily 00:10 UTC | Writes `dailyStats` for the previous day from counters |
| `jobs.rollups.trending` | hourly | Recomputes `featured`/`justBorn` lists into `settings` keys |
| `jobs.cleanup` | daily 03:00 UTC | Deletes `systemEvents` > 30 days, `emailOutbox` sent > 90 days, `worldVisits` > 60 days, `jobRuns` > 30 days, orphan storage files |
| `jobs.accountPurge` | on demand (scheduler) | Deletes a user's data in chunks (§6.7) |

Every job writes a `jobRuns` row (start, finish, ok, processed, error). The admin System page shows the last run of each job and flags jobs that are late or failing.

### 5.7 Concurrency strategy

- **Hot world documents:** visits and comets never write to `worlds` directly. They insert into `bloomQueue` (insert-only, no read conflicts). The processor is the single writer of `worlds.bloom`.
- **Counters:** global and per-day counters (signups, worlds, comets, visits) use `@convex-dev/sharded-counter`.
- **Galaxy slot allocation:** a singleton `galaxy` doc. Conflicts are rare at expected creation rates and Convex retries them automatically. If creation rate ever exceeds ~20/s, switch to pre-allocated slot blocks (ADR).
- **Idempotency:** `tend`, `recordVisit`, `reports.create`, `emailOutbox` all check a unique index before inserting.

---

## 6. Authentication (Convex Auth)

### 6.1 Providers

1. **Password** with:
   - `verify`: email OTP (8 digits, 15 minute expiry) sent through our email system (§7).
   - `reset`: password reset OTP (8 digits, 15 minute expiry) through our email system.
   - Password policy: minimum 10 characters, checked against a small common-password list, no other composition rules (NIST guidance).
2. **Google OAuth** (fastest path on mobile).

Both providers live in `convex/auth.ts`. OTP tokens are generated with a cryptographically secure generator (Web Crypto `getRandomValues` with rejection sampling, ADR-015).

### 6.2 OTP emails through our email system

The Convex Auth email provider's `sendVerificationRequest` MUST NOT talk to SMTP or Resend directly. It enqueues an email into our outbox (template `auth.verify` or `auth.reset`, category `security`) so every auth email gets the same config, logging, retries and admin visibility.

> **Resolved in Phase 4 (ADR-015):** `sendVerificationRequest` receives Convex Auth's ActionCtx as its second argument and calls `internal.email.outbox.enqueue` directly. No HTTP hook or shared secret is needed.

### 6.3 Onboarding

- After first sign-in, `profiles.me` returns `needsOnboarding: true` until a profile exists. The app routes to `/onboarding`.
- Username: normalized to lowercase, `^[a-z0-9_]{3,20}$`, not in the reserved list (`admin`, `api`, `w`, `universe`, `create`, `settings`, `me`, `support`, `help`, `worldling`, `staff`, `mod`, `root`, `null`, `undefined`, route names, and brand terms), passes the moderation check. Live availability check with debounce.
- `completeOnboarding({ username, displayName, draft? })` runs in one transaction: create profile, create world from the draft (or a random preset), allocate slot, enqueue welcome email.

### 6.4 Sessions

- Convex Auth defaults for session and refresh token lifetimes, documented in the ADR.
- "Sign out of all devices" in settings deletes the user's `authSessions`.
- Suspended users can sign in but every wrapper rejects them with `SUSPENDED` and the app shows a calm suspended screen with the reason and an appeal email.

### 6.5 Next.js integration

- Use `ConvexAuthNextjsServerProvider` in the root layout and `ConvexAuthNextjsProvider` in the client provider.
- Next.js 16 renamed `middleware.ts` to `proxy.ts`. Export `convexAuthNextjsMiddleware(...)` as the default export of `proxy.ts`. Use it only for: proxying `/api/auth` to Convex, redirecting signed-out users away from `/settings`, `/notifications`, `/onboarding`, `/admin`, and redirecting signed-in users away from `/sign-in` and `/sign-up`.
- **Known risk:** community reports show friction between Convex Auth's Next.js helper and Next 16's `proxy.ts` (Node runtime by default). Phase 4 starts with a 30 minute spike:
  1. Try `proxy.ts` with the default export.
  2. If it fails, keep `middleware.ts` (still supported in Next 16, deprecated) and record an ADR to migrate when Convex Auth supports `proxy.ts` officially.
  3. If server-side auth still misbehaves, fall back to client-only auth (`ConvexAuthProvider` from `@convex-dev/auth/react`) with client-side route guards. Security is unaffected because Convex enforces everything (ADR-010).
- Server Components get the token with `convexAuthNextjsToken()` for `fetchQuery`/`preloadQuery`.
- Never perform side effects from Next.js on GET requests (CSRF). Mutations happen from the client or from Server Actions on POST.

### 6.6 Admin bootstrap

No admin exists after deploy. To create the first one:

```bash
npx convex run --prod admin/system:bootstrapAdmin '{"email":"you@example.com"}'
```

`bootstrapAdmin` is an `internalMutation`. It only succeeds if zero admins exist, the user exists and has a verified email or Google account. It writes an audit entry. After that, admins promote others from the dashboard.

### 6.7 Account deletion and export

- **Export:** `account.requestExport` schedules an action that builds a JSON file (profile, worlds with params, comets authored, comets received, notifications) in Convex storage and emails a link valid for 24 hours.
- **Deletion:** requires typing the username. Sets status `deleting`, signs out all sessions, then `jobs.accountPurge` deletes in chunks of 200: authored comets, comets on their world, visits, notifications, reports by them, blocks, world, thumbnails, stats, profile, then Convex Auth records (`authAccounts`, `authSessions`, refresh tokens, verification codes, `users`). The galaxy slot stays empty forever so no world moves.
- Audit entries keep the actor id only. A deleted user's id resolves to "Deleted user" in the admin UI.

---

## 7. Email system

### 7.1 Goals

- Admin can switch between Gmail SMTP (now) and Resend (when a domain is ready) without a deploy.
- Every email is logged, retried safely, and visible in the admin.
- Secrets are encrypted at rest and never returned to any client.
- Auth emails work on day one, before any admin exists.

### 7.2 Flow

```
domain code (mutation)
   -> enqueueEmail(ctx, { to, template, data, idempotencyKey })
        - category comes from the template registry, never the caller (ADR-014)
        - validates data with the template's zod schema
        - checks suppressions (non-security only) -> status "suppressed"
        - per-recipient rate limit (5 per hour, security emails exempt up to 10)
             over the limit: security throws RATE_LIMITED, non-security is stored "cancelled" (ADR-014)
        - inserts emailOutbox row (status "queued")
        - workpool.enqueueAction(internal.email.dispatch.send, { outboxId })
   -> dispatch.send ("use node" action)
        - marks "sending", increments attempts
        - loads active config (DB) or env fallback, decrypts secrets in memory
        - renders template with React Email (HTML + plain text)
        - provider.send() via SmtpProvider (nodemailer) or ResendProvider
        - success -> markSent(providerMessageId)
        - failure -> classify: retryable (network, timeout, 429, 5xx) or permanent (auth, 4xx)
             (SMTP 4xx counts as retryable, SMTP 5xx as permanent, ADR-014)
             retryable: workpool retries with exponential backoff (max 5 attempts, starting 10s, jitter)
             permanent: markFailed + systemEvent (error) + admin health banner
```

### 7.3 Provider adapter

```ts
export interface EmailProvider {
  readonly name: "smtp" | "resend";
  send(msg: { from: string; to: string; replyTo?: string; subject: string; html: string; text: string; headers?: Record<string, string> }):
    Promise<{ messageId: string }>;
}
```

Adding a provider later (Postmark, SES) is one new class and one enum value.

### 7.4 Configuration lifecycle (admin)

1. Admin creates a config: transport, from name/address, credentials. Saved as `draft`. Secrets are encrypted before insert. The UI only ever sees `{ configured: true, last4: "abcd" }`.
2. Admin clicks "Send test email" to their own address. Result saved in `lastTest`. On success status becomes `verified`.
3. Admin clicks "Activate". The previous active config becomes `retired` (kept for one-click rollback). Only `verified` configs can be activated.
4. Every step writes an audit log entry (never including secret values).
5. The admin email page shows: active transport, last successful send, failures in the last 24h, Gmail daily quota warning when transport is SMTP with a gmail.com host.

### 7.5 Env fallback (bootstrap and disaster recovery)

If no `active` config exists, the dispatcher uses env vars: `EMAIL_FALLBACK_TRANSPORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, or `RESEND_API_KEY`. The admin page clearly shows "Using environment fallback".

Gmail now: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=<gmail address>`, `SMTP_PASSWORD=<16 character app password>`.

> **Gmail limits:** a personal Gmail account allows roughly 500 recipients per day and may throttle bursts. Fine for launch and testing. Switch to Resend with a verified domain (SPF, DKIM, DMARC) before any marketing push.

> **Verified in Phase 3 (ADR-014):** Gmail SMTP on port 465 works from Convex Node actions.

`EMAIL_FAKE=true` sends through a fake provider for tests and local work. It is ignored when `APP_ENV=production`.

### 7.6 Encryption

- AES-256-GCM via Web Crypto. Key: `SECRETS_ENCRYPTION_KEY` (32 random bytes, base64) in Convex env. Generate with `openssl rand -base64 32`.
- Stored as `{ iv, ct, kv, last4 }`. `kv` is the key version for rotation: `SECRETS_ENCRYPTION_KEY_V2` can be added, new writes use the latest, reads use the matching version, a one-off internal action re-encrypts old rows.
- Decryption happens only inside the dispatch action and the test-send action. Plaintext never leaves memory, never logs.

### 7.7 Templates (React Email)

| Key | Category | Purpose |
|---|---|---|
| `auth.verify` | security | Email verification code |
| `auth.reset` | security | Password reset code |
| `account.welcome` | transactional | Welcome + link to world |
| `account.export` | security | Data export link |
| `account.deleted` | security | Deletion confirmation |
| `comets.alert` | digest | Batched comet notification |
| `digest.weekly` | digest | Weekly world summary |
| `admin.test` | security | Transport test |

Each template exports `{ subject(data), schema (zod), Component, previewData }`. Keys, schemas, subjects and `previewData` live in `convex/shared/emailTemplates.ts` so V8 code can validate without React Email (ADR-014). Security emails have their `data` cleared once final. The admin has a template preview page (renders with `previewData` in a sandboxed iframe).

Design: dark, minimal, brand colors, one clear button, plain-text version always included, works in Gmail, Outlook and Apple Mail dark mode.

### 7.8 Unsubscribe

- Non-security emails include `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers plus a footer link.
- Link points to a Convex `httpAction` (`/email/unsubscribe?t=<signed token>`). The token is an HMAC (`EMAIL_LINK_SECRET`) of email + scope + expiry. GET shows a confirm page and never writes, so link scanners can't unsubscribe anyone. POST (the confirm button and RFC 8058 one-click) inserts the suppression and shows a confirmation page (ADR-014).

---

## 8. 3D and motion engineering

### 8.1 Experience root (single canvas)

- `src/three/ExperienceRoot.tsx` is mounted once in `(marketing)` and `(app)` layouts. It renders a fixed, full-viewport `<Canvas>` behind the DOM with `eventSource` set to the document root so DOM and 3D share pointer events.
- Pages place scenes using drei `<View>` tracking a DOM element, so layout stays in normal HTML/CSS.
- Global scene state (current route scene, camera targets, quality tier, reduced motion) lives in a Zustand store.
- Canvas settings: `dpr` from quality tier, `gl={{ antialias: tier >= 2, powerPreference: "high-performance", alpha: false }}`, `flat` color handling decided once and documented, `shadows` off (stylized lighting doesn't need them).

### 8.2 Quality tiers

Detected before first frame with `detect-gpu`, refined at runtime by drei `PerformanceMonitor` (drop a tier after sustained low FPS, never bounce more than twice).

| Tier | Typical device | DPR | Planet sphere detail | Post-processing | Universe near LOD count |
|---|---|---|---|---|---|
| 0 | No WebGL / blocklisted | n/a | static thumbnails + list mode | none | 0 |
| 1 | Low-end phones | 1 | icosahedron detail 24 | none | 4 |
| 2 | Mid-range phones, laptops | 1.5 | detail 48 | none | 8 |
| 3 | Desktop GPUs, flagship phones | min(devicePixelRatio, 2) | detail 80 | subtle bloom, SMAA | 12 |

Users can override quality in a small settings popover. Choice is remembered in `localStorage`.

### 8.3 Planet renderer

- Pure function `paramsToUniforms(params, tier)` in `src/three/planet/uniforms.ts` converts world params to shader uniforms. It is unit tested (same input, same output).
- **Surface shader:** vertex displacement with seeded 3D simplex FBM (octaves 3 to 6 by tier). Seed becomes a vec3 offset via a hash so each world samples a different region of noise space. Normals computed in the vertex shader with finite differences along two tangents. `precision highp float` in the vertex shader to keep results consistent on mobile.
- **Coloring:** elevation mapped into the 5-stop palette with smooth blending, slope darkening, biome-specific tweaks (ice caps for frozen, lava emissive cracks for volcanic, faceted sparkle for crystal).
- **Ocean:** separate sphere at sea level, fresnel rim, sun specular, gentle animated normal noise.
- **Clouds:** separate shell, 3D noise thresholded by `coverage`, animated by time and `speed`, soft shadow faked on the surface by sampling the same noise.
- **Atmosphere:** back-face shell with fresnel falloff and day/night falloff relative to the sun direction.
- **Bloom unlocks:** uniforms switch features on by level (vegetation mask, night lights mask, aurora) and orbitals are added as instanced meshes.
- GLSL lives in `src/three/shaders/*.ts` as template strings marked `/* glsl */`. Shared chunks (noise, hash) are composed by string import, not copy-pasted.
- Third party shader code (simplex noise by Stefan Gustavson / Ashima Arts, MIT) MUST keep its license header.

### 8.4 Universe renderer

```ts
// convex/shared/galaxy.ts
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const SPACING = 6;        // world units, tune visually
export const SECTOR_SIZE = 120;  // world units per sector edge
export function slotToPosition(slot: number) {
  const r = SPACING * Math.sqrt(slot + 1);
  const theta = slot * GOLDEN_ANGLE;
  const y = (hash01(slot) - 0.5) * 8 * Math.exp(-r / 600); // thin disc, thicker in the core
  return { x: r * Math.cos(theta), y, z: r * Math.sin(theta) };
}
export const sectorKeyFor = (x: number, z: number) =>
  `${Math.floor(x / SECTOR_SIZE)}:${Math.floor(z / SECTOR_SIZE)}`;
```

- **Streaming:** the camera's ground position determines the current sector plus the 8 around it. `universe.sectors` is subscribed for those keys (debounced 250ms on camera move). Sectors leaving the set are unsubscribed.
- **LOD:**
  - Far: one `InstancedMesh` of glowing points/billboards colored from `colorA/colorB`, size by level. Thousands in one draw call.
  - Mid: low-detail spheres with a simplified shader using the palette (instanced by tier).
  - Near: the full planet renderer for the closest N worlds (N by tier), fetched with `universe.renderable`.
- **Picking:** raycast against the instanced mesh, hover shows a name tag (DOM, positioned with drei `Html` or projected coordinates).
- **Births:** new pins arriving over the live query animate in (scale from 0, brief flash).

### 8.5 Camera system

- `CameraRig` owns the camera. `flyTo(target, { duration, lookAt })` builds a GSAP timeline over a smooth curve (arc away from the galaxy plane, then descend). Any user input kills the timeline and hands control back to `CameraControls`.
- During a flight, picking is disabled and a "Skip" affordance appears for flights over 1.5s.

### 8.6 Landing cinematic

- Sections in normal DOM with scroll height. Lenis smooths scroll. A GSAP `ScrollTrigger` timeline with `scrub` maps scroll progress to camera position along a `CatmullRomCurve3`, and to scene uniforms (dust density, planet formation progress, galaxy reveal).
- **Single clock (ADR-003):**

```ts
// src/three/clock.ts (sketch)
const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.lagSmoothing(0);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
  advanceR3F(time * 1000); // from useThree().advance, with Canvas frameloop="never"
});
```

- Pause the ticker work when the tab is hidden. Destroy Lenis on unmount.
- Reduced motion: no Lenis, no scrub. Each section shows a pre-rendered still with a gentle fade.
- Landing performance: the hero is a real `<img>` poster (AVIF/WebP, preloaded) so LCP never waits for WebGL. The canvas fades in over it.

### 8.7 Thumbnail capture

On world save:

1. Render the planet alone into a 512x512 `WebGLRenderTarget` with a transparent background and a fixed three-quarter camera angle.
2. `readRenderTargetPixels`, flip Y, draw into an `OffscreenCanvas` (or a regular canvas fallback), encode WebP at quality 0.85.
3. `worlds.generateThumbnailUploadUrl` -> POST -> `worlds.setThumbnail(storageId)`.
4. `setThumbnail` checks `ctx.db.system.get(storageId)`: content type `image/webp`, size <= 300KB, then deletes the previous thumbnail file.

Thumbnails power OG images, the far-LOD fallback on tier 0, list mode and admin views.

### 8.8 Performance budgets

| Budget | Target |
|---|---|
| Landing LCP (4G, mid phone) | < 2.5s |
| Landing INP | < 200ms |
| CLS | < 0.05 |
| Initial JS (landing, before 3D chunk) | < 170KB gzipped |
| 3D chunk | lazy loaded, < 450KB gzipped |
| Draw calls (universe) | < 120 |
| Frame time | 16.6ms target, p75 >= 55fps mobile |
| GPU memory | < 250MB on tier 1 |
| Time to interactive creator | < 3s on mid phone |

`r3f-perf` overlay in development. Lighthouse CI on landing and world pages in CI with budgets that fail the build.

### 8.9 Resilience

- WebGL unsupported or blocklisted: tier 0 experience (thumbnails, list mode, all actions still work).
- `webglcontextlost`: show a small overlay "Re-awakening the universe...", attempt restore. After 2 failures, switch to tier 0 for the session and report to Sentry.
- Shader compile failure: caught, reported with tier and GPU info, fallback to a simple `MeshStandardMaterial` planet using the palette.
- A 3D-specific error boundary wraps the canvas so a 3D crash never takes down the page UI.

### 8.10 Memory rules

- Never allocate (`new Vector3`, `new Color`) inside `useFrame`. Reuse module or ref scoped objects.
- Geometries and materials created manually MUST be disposed on unmount. Shared geometries per tier are created once and reused.
- Uniforms are updated by mutating `.value`, never by recreating materials.
- Textures (if any are added later) are KTX2 compressed.

---

## 9. Admin dashboard

Route group `/admin`, its own layout (sidebar, light/dark toggle, staff badge). Server layout checks the role and returns `notFound()` for non-staff (not 403, to avoid revealing the route).

| Page | Capabilities |
|---|---|
| Overview | KPI cards (DAU, signups, worlds, comets for 24h and 7d with deltas), charts from `dailyStats`, health strip (email transport status, failed emails 24h, error events 24h, late jobs, open reports) |
| Users | Search (username, display name, email), filters (role, status), table with pagination. Detail page: profile, world preview (thumbnail), comets authored/received, reports, visits count, audit trail. Actions: suspend/unsuspend (reason required), change role (admin), sign out all sessions, resend verification, delete account (typed confirmation) |
| Worlds | Table with thumbnails, filters (hidden, featured), actions: feature/unfeature, hide/unhide (reason), reset name (when offensive) |
| Moderation | Open reports queue grouped by target, pending comets, auto-hidden items. Actions: dismiss, hide, remove, suspend author. Bulk actions with confirmation. Keyboard shortcuts for fast review (`j/k`, `h` hide, `d` dismiss) |
| Email | Active transport card, config list (draft/verified/active/retired), create/edit config (secrets write-only), send test, activate, rollback. Outbox log with filters (status, template, recipient), retry and cancel. Suppression list. Template previews |
| Settings | Feature flags (`signups.enabled`, `comets.enabled`, `universe.live`, `shop.enabled`, `digest.enabled`), maintenance mode + message, extra blocked words, reserved usernames additions |
| Audit log | Filter by actor, action, target, date. Immutable, read-only |
| System | Job runs (last run, duration, status, late flag), `systemEvents` viewer, environment health (which secrets are configured, never values), counts per table, app version and commit SHA |

Safety rules:

- Destructive actions use `ConfirmDialog` with typed confirmation (the username or the word "DELETE").
- The last admin cannot be demoted, suspended or deleted (enforced in Convex).
- Moderators cannot act on admins or other moderators.
- Every action is audited with actor, target, before/after (secrets redacted), reason and request id.

---

## 10. Errors, logging and observability

### 10.1 Error taxonomy

```ts
// convex/shared/errors.ts
export const ErrorCode = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",          // details.fieldErrors
  CONFLICT: "CONFLICT",              // e.g. username taken
  RATE_LIMITED: "RATE_LIMITED",      // details.retryAfterMs
  PRECONDITION: "PRECONDITION",      // e.g. email not verified, feature disabled
  SUSPENDED: "SUSPENDED",
  MAINTENANCE: "MAINTENANCE",
  INTERNAL: "INTERNAL",
} as const;
```

- Server throws expected errors with `appError(code, message, details)` which wraps `ConvexError({ code, message, details, rid })`.
- Unexpected errors are not caught to be re-thrown as fake codes. Convex redacts them in production. The client treats any non-`ConvexError` as `INTERNAL`.
- `convex/shared/errors.ts` also exports `userMessageFor(code, details)` so the client shows consistent, friendly copy.

### 10.2 Client error handling

- `useAppMutation(fn)` hook: wraps `useMutation`, maps errors to toasts or inline field errors, reports `INTERNAL` to Sentry with the request id and function name, returns `{ run, isPending, error }`.
- Route-level `error.tsx` per route group, `global-error.tsx` at the root, `not-found.tsx` with an on-brand "lost in space" page.
- 3D error boundary (§8.9).
- Forms show field-level errors from `VALIDATION.details.fieldErrors`.

### 10.3 Structured logging

```ts
// convex/lib/logger.ts (contract)
ctx.log.info("comet.sent", { cometId, worldId });
ctx.log.warn("email.dispatch.retry", { outboxId, attempt, reason });
ctx.log.error("jobs.bloom.failed", { error });
// emits one JSON line:
// {"level":"info","event":"comet.sent","ts":1760000000000,"rid":"...","fn":"comets:send","uid":"...","cometId":"...","worldId":"..."}
```

- Event names: `domain.action[.outcome]`, lowercase, dot separated. Keep a list in `docs/events.md`.
- Redaction: keys matching `/password|secret|token|apiKey|authorization|code/i` are replaced with `[redacted]`. Emails are masked (`k***@gmail.com`) except in the email outbox table itself.
- `info` for business events, `warn` for handled problems, `error` for failures needing attention. No `debug` logs in production builds.
- **Persistence:** queries and mutations log to the console only (a thrown mutation rolls back any insert, so in-transaction error tables are unreliable). Actions and jobs (non-transactional) additionally write `warn`/`error` to `systemEvents` via an internal mutation. The client reports unexpected errors to Sentry with the `rid`.
- When on Convex Pro: enable log streams (Axiom or Datadog) and Convex exception reporting to Sentry.

### 10.4 Client logging and monitoring

- `src/lib/logger.ts`: thin wrapper, console in development, Sentry breadcrumbs in production.
- Sentry for client and Next.js server errors, with source maps uploaded in CI, release = commit SHA, environment = `production`/`preview`.
- Vercel Analytics for page views, Speed Insights for real-user Web Vitals.
- Custom product events (world_created, comet_sent, share_clicked) through a tiny `track()` abstraction so a product analytics tool (PostHog) can be added later behind cookie consent without touching feature code.

### 10.5 Alerts

- Admin health strip (§9) for email failures, late jobs and error spikes.
- Sentry alert rules: new issue in production, error rate spike.
- Daily admin summary email (optional flag) listing failures from the last 24h.

---

## 11. Security and privacy

### 11.1 Threat model (top risks)

| Threat | Control |
|---|---|
| Calling Convex functions directly to bypass UI checks | All rules enforced server-side in wrappers and model (ADR-010) |
| Privilege escalation to admin | Roles only changed by admin mutations, audited, last-admin guard, bootstrap only when zero admins |
| Spam and harassment via comets | Verified email required, rate limits, filter, owner controls, blocks, reports, auto-hide |
| XP farming with sockpuppets | Daily caps, verified accounts only, one per author per world per day, ledger for audits |
| Leaking email credentials | AES-256-GCM at rest, write-only in UI, never logged, never in audit |
| Account takeover | Convex Auth rate limiting on sign-in, OTP expiry, Google OAuth, sign out all sessions |
| XSS | React escaping, no `dangerouslySetInnerHTML` except sanitized email previews in a sandboxed iframe, CSP |
| Malicious thumbnail uploads | Type and size checked server-side, rendered only as `<img>` |
| Enumeration of users via auth | Generic auth error messages, same response timing where practical |

### 11.2 Headers (next.config)

- `Content-Security-Policy`: `default-src 'self'`; `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com`; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data: blob: https://*.convex.cloud`; `connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site https://*.ingest.sentry.io https://vitals.vercel-insights.com`; `worker-src 'self' blob:`; `frame-ancestors 'none'`; `form-action 'self' https://accounts.google.com`. Tighten with nonces later if needed (ADR).
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`

### 11.3 Secrets

- Never committed. `.env.local` is gitignored. `.env.example` lists every variable with a comment.
- Next.js env validated at build time with `@t3-oss/env-nextjs` + zod. Convex env read through `convex/lib/env.ts` which throws a clear `MISSING_ENV: NAME` error.

### 11.4 Rate limits

Defined once in `convex/lib/rateLimits.ts` with `@convex-dev/rate-limiter`.

| Key | Limit | Scope |
|---|---|---|
| `comet.send` | 5 per minute (token bucket), 30 per day | user |
| `comet.sendToWorld` | 3 per day | user + world |
| `world.update` | 20 per minute | user |
| `world.create` | 3 per day | user |
| `visit.record` | 60 per minute | user |
| `report.create` | 10 per day | user |
| `profile.update` | 10 per hour | user |
| `email.perRecipient` | 5 per hour (security: 10) | recipient |
| `admin.emailTest` | 5 per 10 minutes | admin |
| `account.export` | 2 per day | user |

Rate limit errors return `RATE_LIMITED` with `retryAfterMs`, and the UI shows a friendly countdown.

### 11.5 Input validation

- Convex validators for shape, shared zod schemas for ranges and formats.
- All user text is NFC normalized, trimmed, control characters stripped, repeated whitespace collapsed, length counted in graphemes (`Intl.Segmenter`).
- Hex colors validated and clamped to safe saturation/lightness ranges.

### 11.6 Moderation

- `obscenity` matcher with the English dataset plus admin-managed extra words.
- Patterns blocked in comets, names and usernames: URLs, emails, phone numbers.
- Self-harm related reports are prioritized at the top of the moderation queue. The guidelines page links to crisis resources.

### 11.7 Privacy

- Collected data: email, username, display name, world params, comets, visits (aggregated after 60 days).
- No selling data, no third-party ad trackers.
- Vercel Analytics is cookieless. If PostHog is added later, it runs only after consent.
- Users can export and delete their data (§6.7).
- Minimum age 13 in the terms. No intentional collection of data from younger children.
- Legal pages (`/privacy`, `/terms`, `/guidelines`) MUST exist before launch. Have them reviewed by a professional.

---

## 12. SEO and sharing

- Metadata API for every route. Titles: `"{World name} by @{username} · Worldling"`.
- `app/w/[username]/opengraph-image.tsx` renders a 1200x630 image with `ImageResponse`: space background, the world thumbnail, world name, `@username`, bloom level, brand mark. Fonts loaded from local files. Falls back to a generic brand image if no thumbnail.
- `sitemap.ts`: static pages + public worlds (paginated sitemap index when > 10k).
- `robots.ts`: allow public pages, disallow `/admin`, `/settings`, `/api`, `/dev`.
- Share sheet: native `navigator.share` on mobile, fallback buttons (copy link, WhatsApp, X, Facebook, Telegram), with UTM-free clean links.

---

## 13. Quality, testing and delivery

### 13.1 Testing

| Layer | Tool | Covers | Minimum |
|---|---|---|---|
| Pure units | Vitest | `convex/shared/*`, `paramsToUniforms`, moderation, galaxy math, bloom math, error mapping | 95% lines on `shared/` |
| Backend | Vitest + `convex-test` | Every public function: auth rules, validation, rate limits, idempotency, audit writes, job processors | Every function has happy path + forbidden + invalid tests |
| Components | Testing Library | Forms, creator panel controls, admin tables | Key interactions |
| E2E | Playwright | Guest create -> sign up -> onboarding -> world page; visit + comet; report + moderation; admin email config switch (with a fake provider); account deletion | Runs on every PR against the preview deployment |
| Accessibility | axe (Playwright) | All main routes | Zero serious/critical violations |
| Performance | Lighthouse CI | Landing, world page | Budgets from §8.8 |

- A fake email provider (`EMAIL_FAKE=true` in test envs) records sends into the outbox without network calls.
- A test-only internal seed function (`testing.seed`) exists only when `APP_ENV=test`. It refuses to run otherwise.

### 13.2 Code quality

- TypeScript strict, no `any` (use `unknown` + narrowing). ESLint errors fail CI.
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- Small PRs, one phase step at a time. Every PR updates `docs/PROGRESS.md` when a phase item completes.
- Functions under ~50 lines, files under ~300 lines, split when larger.
- No dead code, no commented-out code, no TODO without an issue reference.

### 13.3 CI pipeline (GitHub Actions)

1. Install (pnpm, cached)
2. `pnpm typecheck` (Next + Convex)
3. `pnpm lint`
4. `pnpm test` (unit + convex-test)
5. `pnpm build`
6. On PR: wait for the Vercel preview, run Playwright + axe + Lighthouse CI against it

### 13.4 Environments

| Env | Frontend | Backend |
|---|---|---|
| Development | `next dev` locally | `npx convex dev` (personal dev deployment) |
| Preview | Vercel preview per PR | Convex preview deployment (preview deploy key) |
| Production | Vercel production | Convex production deployment |

Vercel build command: `npx convex deploy --cmd 'pnpm build'` (uses `CONVEX_DEPLOY_KEY`).

### 13.5 Environment variables

**Vercel**

| Name | Notes |
|---|---|
| `CONVEX_DEPLOY_KEY` | Production key for prod, preview key for preview |
| `NEXT_PUBLIC_CONVEX_URL` | Set by `convex deploy` during build |
| `NEXT_PUBLIC_SITE_URL` | `https://worldling.app` (or chosen domain) |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Error tracking |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional. Appeal address on the suspended screen (§6.4) |

**Convex**

| Name | Notes |
|---|---|
| `SITE_URL` | Used by Convex Auth for redirects |
| `JWT_PRIVATE_KEY`, `JWKS` | Generated by Convex Auth setup |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth |
| `SECRETS_ENCRYPTION_KEY` | 32 bytes base64 (§7.6) |
| `EMAIL_LINK_SECRET` | HMAC for unsubscribe/export links |
| `CONVEX_SITE_URL` | Built in. Base URL for http actions (unsubscribe links) |
| `EMAIL_FAKE` | `true` sends through the fake provider. Ignored in production (ADR-014) |
| `EMAIL_FALLBACK_TRANSPORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS` | Env fallback (§7.5) |
| `RESEND_API_KEY` | Optional fallback |
| `APP_ENV` | `development`, `preview`, `production`, `test`. The e2e mailbox only works when explicitly non-production (ADR-016) |

### 13.6 Release and rollback

- Production deploys from `main` only, after green CI.
- Schema changes follow expand -> migrate -> contract (add optional field, backfill with a chunked internal mutation, then make required). Never a breaking schema change in one deploy.
- Rollback: Vercel instant rollback for frontend. Convex functions roll back by redeploying the previous commit. Data migrations are always backward compatible for one release.
- Feature flags and maintenance mode are the first response to incidents.

---

## 14. Monetization (designed now, built later)

### 14.1 Rules

1. Never paywall creating, growing, visiting or sending comets.
2. No pay-to-win: money never buys XP, levels, earned unlocks or visibility.
3. Paid things are looks, extra slots and exports.
4. No virtual currency. Prices shown in real money.
5. Launch payments only after retention targets (§1.7) are met for 4 consecutive weeks.

### 14.2 Offer (draft)

- **Worldling Plus** (around $3.99/month or $29/year): premium cosmetics library, 2 extra world slots, 4K wallpaper and time-lapse video export, supporter badge, early access to seasonal events.
- **Cosmetic packs** (one-time, around $1.99 to $4.99): ring styles, rare biomes (lava glass, bioluminescent), moon materials, meteor showers.

### 14.3 Technical readiness in v1.0

- `entitlements` table exists (§5.2).
- Cosmetics catalog in `convex/shared/cosmetics.ts` with `tier: "earned" | "premium"` and `requires` (level or sku).
- `hasEntitlement(ctx, userId, sku)` helper. `worlds.update` already validates equipped cosmetics against levels and entitlements.
- `shop.enabled` flag defaults to false.
- Payment provider decided at monetization time behind a `PaymentProvider` adapter: Stripe through the US company, or a merchant of record (Polar, Lemon Squeezy, Paddle) that handles global sales tax. Webhooks land on a Convex `httpAction`, verified by signature, idempotent by event id, write `entitlements`.

---

## 15. Build plan for Claude Code

### 15.1 How to run each phase

1. Start a fresh Claude Code session per phase (keeps context clean).
2. Paste the phase prompt.
3. Let Claude Code plan first (plan mode), review the plan, then approve.
4. At the end: tests green, `docs/PROGRESS.md` updated, commit, push, check the Vercel preview.

Every prompt below assumes `CLAUDE.md` and `docs/SPEC.md` are in the repo.

### 15.2 Phases

**Phase 0: Foundation**

```
Read CLAUDE.md and docs/SPEC.md (§0, §4, §13). Plan first, then implement Phase 0: Foundation.
- Create the Next.js 16 app (App Router, TypeScript strict + noUncheckedIndexedAccess, src/ dir, Turbopack, pnpm, Node 22).
- Tailwind v4, Prettier (+ tailwind plugin), ESLint flat config (typescript-eslint strict, react-hooks, next plugin), Husky + lint-staged.
- Initialize Convex (npx convex dev) with convex.config.ts ready for components.
- Create the full folder structure from §4.4 with placeholder index files where useful.
- Env validation: @t3-oss/env-nextjs for Next, convex/lib/env.ts for Convex. Add .env.example with every variable from §13.5.
- Vitest (with convex-test and edge-runtime env), Testing Library, Playwright skeleton with one smoke test.
- GitHub Actions CI per §13.3 (steps 1-5 now).
- docs/PROGRESS.md, docs/decisions/ADR-000-template.md, and ADR-001 to ADR-012 as short files from the §4.3 table.
- Pin exact dependency versions.
Acceptance: pnpm typecheck, lint, test, build all pass. Deploys to Vercel with Convex. PROGRESS.md updated.
```

**Phase 1: Design system and shell**

```
Read CLAUDE.md and docs/SPEC.md (§2.8, §2.9, §3). Plan first, then implement Phase 1.
- Tokens in src/styles/tokens.css via Tailwind v4 @theme (use the §3.2 values; brand kit values will replace them later, so everything must reference tokens).
- Fonts with next/font (Bricolage Grotesque display, Geist sans, Geist Mono).
- src/lib/motion.ts mirroring motion tokens for GSAP.
- shadcn/ui setup, restyle the §3.4 components to our tokens, including ConfirmDialog with typed confirmation and EmptyState/ErrorState.
- Layout shells: (marketing), (auth), (app), admin. Global toaster (sonner). Skip-to-content link. Focus ring styles.
- error.tsx per group, global-error.tsx, on-brand not-found.tsx.
- A /dev/ui page (dev only, 404 in production) showcasing every component and state.
Acceptance: axe shows zero serious violations on /dev/ui, keyboard navigation works everywhere, no raw colors or px values in components.
```

**Phase 2: Backend core**

```
Read CLAUDE.md and docs/SPEC.md (§5, §10, §11.3-§11.5). Plan first, then implement Phase 2.
- convex/schema.ts exactly per §5.2 (add authTables).
- convex/shared/errors.ts, convex/lib/errors.ts (appError), convex/lib/logger.ts (structured JSON, redaction), convex/lib/functions.ts wrappers (publicQuery, userQuery, userMutation, staffQuery, staffMutation, adminQuery, adminMutation, plus internal action helper) per §5.3.
- convex/lib/rateLimits.ts per §11.4, convex/lib/settings.ts (typed registry + feature flags + maintenance), convex/lib/audit.ts, convex/lib/time.ts, convex/lib/crypto.ts (AES-256-GCM with key versions, §7.6).
- Components: rate limiter, workpool, sharded counter registered in convex.config.ts. convex-helpers >= 0.1.127.
- jobRuns helper and systemEvents writer (for actions/jobs only).
- Client: src/lib/errors.ts (userMessageFor), useAppMutation hook per §10.2.
- convex-test suites for wrappers (unauthenticated, suspended, maintenance, role checks), crypto round trip, rate limit behavior.
Acceptance: all tests pass, no raw query/mutation used for public functions, logger redaction tested.
```

**Phase 3: Email system**

```
Read CLAUDE.md and docs/SPEC.md (§7). Plan first, then implement Phase 3.
- emailConfigs lifecycle (draft -> verified -> active -> retired), env fallback (§7.5), secrets encrypted with lib/crypto.
- email/outbox.ts enqueueEmail (zod per template, suppressions, per-recipient rate limit, idempotency), workpool dispatch with retry classification and exponential backoff.
- email/providers.ts ("use node"): SmtpProvider (nodemailer) and ResendProvider, plus FakeProvider when EMAIL_FAKE=true.
- React Email templates from §7.7 with previewData, plain text versions, dark-mode safe design using brand tokens.
- Unsubscribe httpAction with HMAC tokens and List-Unsubscribe headers (§7.8).
- Internal admin functions for config CRUD, test send, activate, rollback (UI comes in Phase 10).
- Verify outbound SMTP from Convex Node actions works with Gmail (465). Record the result in an ADR.
Acceptance: convex-test covers enqueue, suppression, idempotency, retry vs permanent failure, activation rules. A real test email arrives via Gmail SMTP in dev.
```

**Phase 4: Authentication and onboarding**

```
Read CLAUDE.md and docs/SPEC.md (§6, §2.2, §3). Plan first, then implement Phase 4.
- Start with the §6.5 spike: Convex Auth with Next 16 proxy.ts. Follow the fallback ladder if needed and write the ADR.
- Convex Auth: Password (verify + reset via OTP through our outbox, §6.2) and Google. Resolve the §6.2 "verify" note and write the ADR.
- Auth pages: sign-in, sign-up, verify (code input with paste support), reset-password. Beautiful, accessible, mobile-first, matching the design system.
- Onboarding page: username with live availability, display name, reserved list and moderation from convex/shared/usernames.ts. completeOnboarding per §6.3 (draft claiming will be wired in Phase 6, accept an optional draft now).
- Suspended screen, maintenance screen, sign out of all devices.
- bootstrapAdmin internal mutation (§6.6).
Acceptance: e2e test for sign up -> verify -> onboarding. Verification and reset emails arrive. Tests for bootstrapAdmin rules.
```

**Phase 5: Planet renderer**

```
Read CLAUDE.md and docs/SPEC.md (§2.3, §3.8, §8.1-§8.3, §8.8-§8.10). Plan first, then implement Phase 5.
- convex/shared/worldParams.ts: zod schema matching worldParamsV1, clamps, 6 biome presets, curated palettes (at least 18), randomParams(seed), describeWorld(params) for accessibility. (A minimal version with the schema, clamps, one palette per biome and randomParams exists since Phase 4, ADR-017. Expand it.)
- ExperienceRoot (single persistent canvas, drei View), clock.ts single ticker (ADR-003), quality.ts tiers with detect-gpu + PerformanceMonitor.
- Planet with all layers (surface, ocean, clouds, atmosphere, night lights, orbitals) driven by paramsToUniforms (pure, unit tested). Bloom-level feature toggles.
- Shader error fallback, 3D error boundary, context-loss handling (§8.9).
- /dev/planet playground (dev only) with leva controls and r3f-perf, showing all presets side by side.
Acceptance: 60fps on a mid-range phone (tier 2) for a single planet, same params render the same world, all presets look beautiful, unit tests for uniforms and describeWorld.
```

**Phase 6: World creator**

```
Read CLAUDE.md and docs/SPEC.md (§2.2 Create, §3, §8.7). Plan first, then implement Phase 6.
- /create: live planet preview + control panel (desktop side panel, mobile bottom sheet with snap points). Sections: Presets, Shape, Colors (curated + advanced clamped), Sky, Motion, Name.
- Randomize with animation, undo/redo with keyboard shortcuts, guest draft autosave to localStorage (worldling:draft:v1).
- Claim flow: guest -> sign up -> onboarding claims the draft -> world page with celebration.
- Signed-in editing: worlds.update with rate limit and optimistic UI.
- Thumbnail capture and upload per §8.7, server validation in setThumbnail.
Acceptance: e2e guest create -> claim -> world exists with matching params and a thumbnail. Works on mobile Safari and Chrome Android.
```

**Phase 7: World page and sharing**

```
Read CLAUDE.md and docs/SPEC.md (§2.2 Visit/Return, §2.4, §12). Plan first, then implement Phase 7.
- /w/[username]: server metadata + preloadQuery, full-screen world, owner info, bloom progress, comet orbit visuals (read-only list for now).
- tend (owner, once per UTC day) and recordVisit (3s visible dwell, idempotent) enqueueing bloomQueue.
- jobs.bloomProcessor per §5.6 with caps from convex/shared/bloom.ts, worldStatsDaily, level-up notifications.
- opengraph-image.tsx, share sheet (§12), copy link with confirmation.
- Owner controls: edit world, comet review toggle.
Acceptance: convex-test for caps and idempotency, OG image renders for a world with and without thumbnail, sharing works on mobile.
```

**Phase 8: The universe**

```
Read CLAUDE.md and docs/SPEC.md (§2.5, §8.4, §8.5). Plan first, then implement Phase 8.
- convex/shared/galaxy.ts (slot -> position, sector keys) with tests. Slot allocation in worlds.create. (slotToPosition, sectorKeyFor and slot allocation exist since Phase 4, ADR-017. Add the streaming helpers.)
- universe.sectors / universe.renderable / featured / justBorn queries.
- Galaxy scene: instanced far LOD, mid LOD, near full planets by tier, sector streaming with debounce, picking + hover labels, births animation.
- CameraRig with GSAP flyTo, interruptible, skip affordance, reduced-motion cut.
- Search by username, keyboard navigation, list mode (accessible, also the tier 0 fallback).
- Seed script (dev only) creating 10,000 worlds to test performance.
Acceptance: with 10k worlds, under 120 draw calls and >= 55fps on tier 2, memory stable while flying around for 5 minutes.
```

**Phase 9: Comets, safety and notifications**

```
Read CLAUDE.md and docs/SPEC.md (§2.6, §2.7, §11.6, §7.7). Plan first, then implement Phase 9.
- convex/shared/moderation.ts (normalization, grapheme count, obscenity, link/email/phone blocking) with tests.
- comets.send / remove / hide, pending flow with owner review, comet animation into orbit.
- reports.create with auto-hide at 3 unique reports, blocks (block/unblock/list) enforced on comets and visits.
- notifications (in-app list, unread badge, mark read), comet alerts hourly batch email, weekly digest, email prefs in settings.
Acceptance: convex-test for every rule (verified email, blocks, caps, auto-hide), e2e for send + report, emails respect prefs and suppressions.
```

**Phase 10: Admin dashboard**

```
Read CLAUDE.md and docs/SPEC.md (§9, §5.4, §7.4). Plan first, then implement Phase 10.
- Admin layout with server role check (notFound for non-staff), sidebar, all pages from §9.
- Overview KPIs and charts from dailyStats (+ jobs.rollups.daily), health strip.
- Users, Worlds, Moderation (with keyboard shortcuts), Email (config lifecycle UI, secrets write-only, test, activate, rollback, outbox log with retry/cancel, suppressions, template previews in sandboxed iframe), Settings (flags, maintenance), Audit log, System (job runs, systemEvents, env health).
- Every admin mutation audited. Last-admin guard. Moderators cannot act on staff.
Acceptance: convex-test for every permission rule, e2e for switching email transport using the fake provider, typed confirmations on destructive actions.
```

**Phase 11: Landing cinematic**

```
Read CLAUDE.md and docs/SPEC.md (§2.2 First visit, §3.5, §8.6, §8.8). Plan first, then implement Phase 11.
- Sections and copy for the landing story (dust -> a world forms -> pull back to the universe -> CTA).
- Lenis + GSAP ScrollTrigger scrubbed camera path on the single clock, scene uniforms driven by scroll.
- Poster image for instant LCP, canvas fade-in, skip intro, reduced-motion version.
- Live counter of worlds (from a cached query) and a real sample of recent worlds in the final scene.
Acceptance: Lighthouse mobile performance >= 85 on the landing, LCP < 2.5s, smooth on tier 1 and 2 devices, reduced-motion version complete.
```

**Phase 12: Hardening**

```
Read CLAUDE.md and docs/SPEC.md (§8.8, §10, §11, §12, §13). Plan first, then implement Phase 12.
- Security headers and CSP (§11.2), review every public Convex function against §5.1 and §5.4, write findings in docs/security-review.md and fix them.
- Account export and deletion (§6.7) with jobs.accountPurge, cleanup job, trending job.
- Sentry (client + server, source maps), Vercel Analytics + Speed Insights, track() abstraction.
- sitemap, robots, metadata pass, legal pages scaffolding (/privacy, /terms, /guidelines) with placeholders clearly marked for professional review.
- Full a11y audit with axe + manual keyboard pass. Lighthouse CI budgets in CI. Playwright on previews.
Acceptance: CI fully green including e2e, a11y and performance budgets. docs/security-review.md has no open high-severity items.
```

**Phase 13: Launch**

```
Read CLAUDE.md and docs/SPEC.md (§17). Walk through the launch checklist item by item, verify each one in production, fix anything missing, and produce docs/launch-report.md.
```

---

## 16. Risks and open questions

| Risk | Impact | Mitigation |
|---|---|---|
| Convex Auth + Next 16 `proxy.ts` friction | Auth setup delays | Spike + fallback ladder (§6.5) |
| `sendVerificationRequest` cannot reach DB | OTP emails can't use outbox | Verify, then httpAction fallback (§6.2) |
| Outbound SMTP blocked from Convex | Gmail transport unusable | Verify in Phase 3, Resend from day one if needed |
| Gmail daily limits | Emails fail at growth spikes | Switch to Resend + domain before marketing |
| Low-end device performance | Bad first impression | Tiers, poster LCP, tier 0 fallback, strict budgets |
| Abuse and harassment | Trust and safety damage | Kindness-only social model, moderation from day one |
| Empty universe at launch | Feels dead | Seed a curated set of "founder worlds" made by the team, show "just born" activity prominently |
| React Compiler with R3F code | Subtle render bugs | `"use no memo"` escape hatch + ADR |

Open questions for the owner:

1. Final name and domain (see brand guide).
2. Support and appeals email address.
3. Launch countries/languages (English first, French next is a strong candidate).

---

## 17. Launch checklist

- [ ] Domain connected to Vercel, HTTPS, `NEXT_PUBLIC_SITE_URL` and `SITE_URL` correct
- [ ] Google OAuth consent screen published with correct domains
- [ ] First admin bootstrapped, a second admin promoted
- [ ] Email: active config verified, test email received, unsubscribe works, auth emails under 30s
- [ ] Legal pages reviewed and published
- [ ] Sentry receiving events from production, alerts configured
- [ ] All jobs ran successfully at least once in production (System page green)
- [ ] Rate limits verified in production
- [ ] Founder worlds seeded
- [ ] OG images verified on WhatsApp, X, Facebook, Telegram, iMessage
- [ ] Lighthouse and Web Vitals within budget on real devices (one low-end Android, one iPhone)
- [ ] Backups: Convex snapshot export scheduled
- [ ] Maintenance mode tested on and off
- [ ] Account deletion tested end to end in production with a test account

---

## Appendix A: CLAUDE.md

Copy everything inside the block into `CLAUDE.md` at the repo root.

```markdown
# Worldling

Grow a world of your own. Visit everyone else's.
Full spec: docs/SPEC.md (source of truth). Progress: docs/PROGRESS.md. Decisions: docs/decisions/.

## Stack
Next.js 16 (App Router, React 19, Turbopack) · TypeScript strict · Tailwind v4 + shadcn/ui
Convex (DB, functions, scheduler, storage) · Convex Auth (Password + Google)
three + @react-three/fiber v9 + drei v10 + postprocessing · GSAP + ScrollTrigger · Lenis · Zustand
Email: outbox + workpool + nodemailer/Resend adapters, React Email · Vercel · Sentry · pnpm · Node 22

## Commands
pnpm dev            # next dev
npx convex dev      # convex dev deployment (run alongside)
pnpm typecheck      # tsc for app + convex
pnpm lint
pnpm test           # vitest (unit + convex-test)
pnpm test:e2e       # playwright
pnpm build

## Workflow rules
- Plan before coding. For anything non-trivial, show the plan and wait for approval.
- Work one phase (docs/SPEC.md §15) at a time. Update docs/PROGRESS.md at the end of every phase.
- If code and spec disagree, stop and ask. Changes to the spec need an ADR in docs/decisions/.
- Before saying "done": typecheck, lint, test and build must pass.
- Conventional commits. Small, focused changes.

## Architecture rules (MUST)
- Security lives in Convex. Next.js checks are UX only.
- Public Convex functions use wrappers from convex/lib/functions.ts. Never raw query/mutation for public functions.
- Every Convex function has args validators. Never accept userId from the client.
- Use indexes (withIndex). No .filter() on growing tables, no unbounded .collect().
- No Date.now() based filtering in queries.
- Business logic in convex/model/*. Handlers stay thin.
- Side effects (email, external APIs) via outbox/workpool/scheduler, never inline in mutations.
- Shared pure code lives in convex/shared/* (no Convex imports) and is used by both client and server.
- Every staff/admin mutation writes an audit entry in the same transaction.
- Throw expected errors with appError(code, ...). Never leak internals in messages.
- Log with ctx.log (structured JSON, event names domain.action.outcome). Never log secrets, tokens, passwords or codes.
- Email secrets are encrypted with convex/lib/crypto.ts and never returned to clients.

## 3D rules (MUST)
- One persistent canvas (src/three/ExperienceRoot.tsx). Scenes use drei <View>. Never add another <Canvas>.
- One clock: gsap.ticker drives Lenis and R3F.
- No allocations inside useFrame. Mutate uniform .value, never recreate materials. Dispose what you create.
- Respect quality tiers (src/three/quality.ts) and prefers-reduced-motion everywhere.
- Every 3D feature has a non-WebGL fallback.
- Performance budgets in docs/SPEC.md §8.8 are requirements.

## UI rules (MUST)
- Only design tokens (src/styles/tokens.css). No raw hex, px or ms in components.
- Every screen handles loading, empty, error, offline, signed-out states.
- WCAG 2.2 AA: keyboard reachable, visible focus, labels, live regions for async results.
- Copy voice: warm, short, plain language. Words: world, visit, comet, tend, bloom.
- No em dashes in UI copy.

## Code style
- TypeScript strict, no any (use unknown + narrowing). Named exports. Functions < ~50 lines, files < ~300 lines.
- Feature folders in src/features/*. Shared UI in src/components/*.
- No dead code, no commented-out code, no TODO without an issue reference.
```

## Appendix B: Glossary

| Term | Meaning |
|---|---|
| World | A user's procedural planet, defined by `worldParams` |
| Universe | The shared galaxy containing every world |
| Comet | A short kind message left on someone's world |
| Tend | The owner's first visit of the day to their own world |
| Bloom | The growth system (XP and levels) |
| Slot | A world's permanent position number in the galaxy |
| Sector | A square region of the galaxy used for streaming data |
| Tier | Device quality level (0 to 3) |
| Outbox | The table every email passes through |
| Founder worlds | Curated worlds seeded by the team before launch |
