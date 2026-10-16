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
