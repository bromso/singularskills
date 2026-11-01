# Bun, React and TypeScript

Written against `bromso/boilerplate-bun` at `32bc3561e15171a2c224eb312eb51a2c5fe90da1` (main) on 2026-10-30. Refresh this file from that repository's `main`, never the other way round.

A Bun workspaces monorepo: Next.js 16 (App Router) apps with React 19 and Tailwind 4, two Bun services (`apps/api` on `Bun.serve` + oRPC + `Bun.sql`, `apps/ai` on the Vercel AI SDK), shared `packages/ui` (shadcn/ui on Radix and Base UI), design tokens, oRPC contracts, Biome for lint and format, Playwright for end-to-end tests, Storybook, Husky + lint-staged + commitlint, Changesets.

## Declare it

Paste into the project's `AGENTS.md` (or `CLAUDE.md`) under `## Stack`:

```yaml
stack: TypeScript 5.9, Next.js 16 (App Router), React 19, Tailwind 4, Bun 1.4 workspaces
profile: bun-react-ts
install: bun install
build: bun run build
test: bun run test:services
lint: bun run check
format: bun run format:fix
typecheck: bun run typecheck
run: bun dev
layout: apps/* (Next apps and Bun services) and packages/* (ui, tokens, contracts); tests colocated as *.test.ts; e2e in apps/e2e/tests/*.spec.ts; docs in docs/guides
rules: Always Bun, never npm/pnpm/yarn. Frontend layers tokens → components → blocks → views → pages, one-way imports. Biome only. Conventional Commits. bun run validate must pass before claiming done.
```

## Commands

| When | Command |
| --- | --- |
| Install | `bun install` |
| Build everything | `bun run build` |
| Test the services and packages (`bun test` per workspace) | `bun run test:services` |
| Lint and format check (Biome) | `bun run check` (fix: `bun run check:fix`) |
| Lint only | `bun run lint` (fix: `bun run lint:fix`) |
| Format | `bun run format:fix` |
| Typecheck | `bun run typecheck` (UI package: `bun run typecheck:ui`; scripts: `bun run typecheck:scripts`) |
| Run everything in dev | `bun dev` |
| Run one app | `bun --filter @repo/<app> dev` (`app` :3001, `www` :3000, `api` :3007, `ai` :3008, `story` :6006) |
| End-to-end tests | `bun --filter @repo/e2e e2e` |
| The full gate, before a commit or before claiming done | `bun run validate` (= `bun test scripts`, Biome check, all typechecks, service tests, build) |
| What CI runs | `bun run ci` (same as validate with `biome ci`) |
| Add a shadcn component | `bunx --bun shadcn@latest add <component> -c packages/ui` (never into an app) |
| Commit interactively | `bun commit` (commitizen) |
| Changeset for a user-facing package change | `bun changeset` |

Package manager: Bun (`packageManager: bun@1.4.2`). `npm`, `pnpm` and `yarn` are never used.

## Layout

```
apps/        www, app, auth, account, docs, help, jobs, blog (Next 16), api, ai (Bun services), story (Storybook), e2e, load
packages/    ui, tokens, api-contract, ai-contract, public-api-contract, service-kit, session, sites, content, email, i18n, i18n-guard, log, telemetry, typescript-config
docs/        guides/*.md, ROADMAP.md
scripts/     repo tooling (doctor, security, CI plan)
biome.json, tsconfig.json, .env.example, docker-compose*.yml at the root
```

- Tests sit next to the code as `*.test.ts` (`apps/ai/src/summarize.test.ts`); end-to-end specs are `apps/e2e/tests/*.spec.ts`.
- A UI primitive used by two or more apps goes in `packages/ui/src/components/`; a shared section pattern (block) in `packages/ui/src/blocks/`; a page-level composition (view) in `apps/<app>/src/views/`; an app-specific layout component in `apps/<app>/src/components/`; a page is a thin `apps/<app>/src/app/<route>/page.tsx` that renders a view; a Storybook story in `apps/story/stories/<Component>.stories.tsx`.
- A typed API endpoint: contract in `packages/api-contract`, handler in `apps/api/src/router.ts`, then a test. An AI tool or endpoint: `packages/ai-contract`, then `apps/ai/src/tools/` or `src/router.ts`.
- A shared dependency goes in the root `package.json` `catalog` and is referenced as `"catalog:"`.

## Rules

- Always Bun, never npm, pnpm or yarn.
- Five frontend layers with one-way imports: tokens → components → blocks → views → pages. A block may import components but never views or pages; a view may import blocks and components and is never imported by them.
- The Next apps are frontend-only. Server-side work lives in the Bun services; frontends call them only through `@repo/api-contract` / `@repo/ai-contract` and never import another app.
- Biome is the only linter and formatter (no ESLint, no Prettier): double quotes, no semicolons, 2-space indent, 100-character width. A pre-commit hook runs `biome check --write` on staged files.
- Conventional Commits, enforced by commitlint: `feat(scope): …`, `fix(scope): …`, `refactor(scope): …`, `chore(scope): …`, `docs(scope): …`.
- A changeset accompanies a user-facing change to a versioned package; internal refactors and tooling changes skip it.
- Naming: components PascalCase (`UserProfile.tsx`); blocks and views kebab-case files with PascalCase exports (`hero.tsx`, `home-view.tsx` → `HomeView`); utilities camelCase; pages lowercase-with-hyphens; type-only files `*.types.ts`.
- `bun run validate` passes before a change is called done.

## For skills

- **Build, test, lint, ship:** run `bun run check`, `bun run typecheck`, `bun run test:services` and `bun run build` as the Commands table says; for a final gate run `bun run validate`. Never substitute `npm test`, `jest` or `eslint`.
- **Review:** check the layer rule (no upward imports), that server work is in a service and not in a Next app, that new shared primitives landed in `packages/ui` and not in an app, that commits are conventional, and that Biome passes.
- **Prototype or component generation:** a new component goes in `packages/ui/src/components/<Name>.tsx` with a story in `apps/story/stories/<Name>.stories.tsx`; it uses shadcn/ui primitives and the tokens in `packages/tokens`; a page renders a view, never markup of its own.
