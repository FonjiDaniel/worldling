# Progress

Where the build stands, phase by phase (SPEC §15). Updated at the end of every phase.

## Current status

**Phase 1: Design system and shell** is complete. Typecheck, lint, unit tests, build and e2e (smoke, axe, keyboard) pass locally. GitHub Actions is still blocked by the account billing lock (see Phase 0), so run the checks locally before pushing.

**Next:** Phase 2, Backend core.

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

- **Pinned versions.** All dependencies are exact (`.npmrc` `save-exact=true`). Only Phase 0 dependencies are installed. Later phases add theirs, also pinned.
- **TypeScript 6.0.3, not 7.** typescript-eslint 8.71 supports `<6.1.0`, and TS 7 (native port) breaks the compiler API used by Next and ESLint.
- **ESLint 9.39.5, not 10.** eslint-config-next 16.4.2 bundles eslint-plugin-react, -import and -jsx-a11y, which cap at ESLint 9. npm flags 9.x as deprecated. Move to 10 when those plugins support it.
- **Local Node is 22.16.0.** jsdom 30 and lint-staged 17 need Node 22.22+, so jsdom is pinned to 29.1.1 and lint-staged to 16.4.0. CI uses the latest Node 22 (`.nvmrc`). Upgrading local Node to 22.22+ would allow both bumps.
- **Cache Components + Partial Prefetching on.** These are the Next 16.4 template defaults and become default in the next major. Revisit in the Phase 4 auth spike (§6.5) if Convex Auth's server helpers clash with them.
- **`pnpm typecheck` runs `next typegen` first** so route types (`LayoutProps`, typed routes) exist on a clean checkout. It needs the Next env vars (CI sets placeholders).
- **Security headers (§11.2), Sentry, analytics** are not in Phase 0. They land with their phases.
- **Playwright** is not in CI yet (§13.3 step 6 needs Vercel previews).
