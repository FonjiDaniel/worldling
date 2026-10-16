# Progress

Where the build stands, phase by phase (SPEC §15). Updated at the end of every phase.

## Current status

**Phase 0: Foundation** is complete. Typecheck, lint, test, build and the e2e smoke test pass locally, and the app is live on Vercel with Convex (https://worldling-ecru.vercel.app). One open item: GitHub Actions can't start jobs because the GitHub account has a billing lock (not a code issue). A support ticket is open. Until it clears, run the CI checks locally before pushing.

**Next:** Phase 1, Design system and shell.

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
