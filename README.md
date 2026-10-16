# Worldling

Grow a world of your own. Visit everyone else's.

- Spec: [docs/SPEC.md](docs/SPEC.md)
- Progress: [docs/PROGRESS.md](docs/PROGRESS.md)
- Decisions: [docs/decisions/](docs/decisions/)

## Setup

Requires Node 22 (`.nvmrc`) and pnpm 10.

```sh
pnpm install
npx convex dev          # first run: log in and create/link the project, writes .env.local
pnpm dev                # in a second terminal
```

Then add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local`. Every variable is documented in [.env.example](.env.example).

## Scripts

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Next dev server (Turbopack)                   |
| `pnpm typecheck` | Route typegen, then tsc for app and `convex/` |
| `pnpm lint`      | ESLint, zero warnings allowed                 |
| `pnpm format`    | Prettier write                                |
| `pnpm test`      | Vitest (unit + convex-test)                   |
| `pnpm test:e2e`  | Playwright (builds and starts the app)        |
| `pnpm build`     | Production build                              |
