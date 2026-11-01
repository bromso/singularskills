# singularskills

One pack of Agent Skills: 338 skills across 21 domains, ordered into gated workflows. Read [AGENTS.md](AGENTS.md) first: it covers the layout, how a skill, a workflow file and a gate relate, and the checks.

## Commands

Run from the repository root unless a directory is given.

| Command | What it does |
| --- | --- |
| `bun run build` | Build every package |
| `bun run test` | Vitest in every package (`SKIP_NETWORK_TESTS=1` skips the install smoke test) |
| `bun run lint:skills` | Validate every `skills/*/SKILL.md` |
| `bun run check:pack` | pack-tools checks: workflows, generated gates/references/adapters, fixers, counts |
| `bun run evals --dry` | List the eval cases; fail if a prompt names its own skill (free) |
| `bun run evals [skill…]` | Run `claude plugin eval` (spends credits, capped by `EVALS_MAX_COST_USD`, default 10) |
| `bun run check` / `bun run format` | Biome lint check / auto-format |
| `bun run gen:gates` (in `packages/pack-tools`) | Regenerate `skills/*/scripts/gate.sh` from `workflows/` |
| `bun run gen:references` (in `packages/pack-tools`) | Copy `references/<domain>/` files into the skills that link them |
| `bun run gen:adapters` (in `packages/pack-tools`) | Regenerate `adapters/` (command wrappers, `gates.json`, hook) |
| `bun run gen:data` (in `apps/docs`) | Regenerate the docs site data from the pack |
| `bash scripts/check-rename.sh` | Fail on any mention of the old project name outside the history allowlist |

## Conventions

- **Skill names**: the folder is `skills/<domain>-<skill>/` and the frontmatter `name` equals it; invoked as `/<domain>-<skill>`.
- **Descriptions**: verb-first sentence, then `Use when <the user's situation, at least six words>.`, optionally `Not for <x>; see /<domain>-<skill>.`; 120 to 400 characters (enforced by skill-validator).
- **Frontmatter**: only `name`, `description`, `allowed-tools` and `metadata` at the top level; `metadata` holds `argument-hint`, `workflow`, `phase`, `artifact`, `disable-model-invocation`.
- **Artifacts**: written to `.singularskills/<folder>/<project>/` with numbered prefixes (`01-`, `02-`, ...); the run log is `.singularskills/log.jsonl`.
- **Generated files**: never edit `skills/*/scripts/gate.sh`, `skills/*/references/` copies of `references/<domain>/` files, or `adapters/`; edit the source and regenerate.
- **Commits**: conventional commits (`feat(design):`, `fix(docs):`, `chore:`, `ci:`).
- **Formatting**: Biome, tabs, width 100.

## Adding a skill to a domain

1. Create `skills/<domain>-<skill>/SKILL.md` (frontmatter as above; Prerequisites, Process and Output sections).
2. If it belongs to a phase, add it to that phase's `skills` list in `workflows/<domain>.yml` and set `metadata.workflow`, `metadata.phase` and `metadata.artifact` to match.
3. In `packages/pack-tools` (after `bun run build`): `bun run gen:gates`, `bun run gen:references`, `bun run gen:adapters`.
4. Add its docs page in `apps/docs/content/docs/<domain>/<skill>.mdx` and list it in that domain's `meta.json`.
5. In `apps/docs`: `bun run gen:data`, then `bun run codemod`; commit the regenerated files.
6. Run `bun run lint:skills` and `bun run check:pack`.

## Adding a domain

1. Create its skills as above, named `<domain>-<skill>`. A domain name with a hyphen also goes in `HYPHENATED_DOMAINS` in `packages/skill-validator/src/parse-skill.ts` and `packages/pack-tools/src/skills.ts`.
2. Write `workflows/<domain>.yml` with its phases, member skills, artifacts and `requires`.
3. Put reference docs used by several of its skills in `references/<domain>/`.
4. Regenerate: `gen:gates`, `gen:references`, `gen:adapters` (in `packages/pack-tools`).
5. Add its docs pages in `apps/docs/content/docs/<domain>/`, the sidebar entry in `apps/docs/content/docs/meta.json`, and the domain in `apps/docs/lib/domains.ts`; then `bun run gen:data` and `bun run codemod` in `apps/docs`.
6. Update the domain table in `README.md` (`check:pack` checks its counts), then run `bun run lint:skills` and `bun run check:pack`.

## Key files

- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: the one Claude plugin and its marketplace entry.
- `workflows/*.yml`: the source of every gate and of the conductor's phases.
- `packages/skill-validator/src/rules.ts`: validation rules and recognized verbs.
- `apps/docs/content/docs/meta.json`: docs sidebar.
- `fumadocs-ui`/`fumadocs-core` are pinned to `~16.8.1` because three files depend on their internals: `apps/docs/components/docs/sidebar.tsx`, the popover selector in `apps/docs/app/global.css`, and `apps/docs/components/search.tsx`; recheck all three before bumping.
