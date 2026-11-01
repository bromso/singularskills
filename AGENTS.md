# singularskills

Instructions for agents working on this repository. singularskills is one pack of Agent Skills for digital production work: 338 skills across 21 domains, ordered into gated workflows. Users install it with `npx skills add bromso/singularskills` (any agent) or as the `singularskills` Claude Code plugin; this file is about changing the pack, not using it.

## Layout

```
skills/<domain>-<skill>/     # the pack, flat: SKILL.md, scripts/gate.sh (when gated), references/
skills/workflow/             # the conductor skill: runs a workflow phase by phase
workflows/<name>.yml         # one workflow: phases, member skills, artifact, requires
references/<domain>/         # canonical reference docs shared by several skills of a domain
references/stacks/           # stack profiles (empty until project 2; see "Stack" below)
evals/<skill>/               # claude plugin eval cases: prompt.md, graders/, fixtures, scaffold
adapters/claude/             # generated: command wrappers, gates.json, gate-hook.sh, hooks.json
adapters/gemini/commands/    # generated: Gemini CLI command wrappers
.claude-plugin/              # the one Claude plugin manifest and its marketplace entry
packages/skill-validator/    # validates every SKILL.md (lint:skills)
packages/pack-tools/         # pack checks and generators (check:pack, gen-*)
apps/docs/                   # the docs site (Fumadocs + Next.js, static export)
scripts/                     # run-evals.sh, smoke-install.sh, check-rename.sh
docs/superpowers/            # specs and plans (history; not rewritten)
```

The domains are `accessibility`, `accounting`, `ai`, `analytics`, `bookkeeping`, `branding`, `coaching`, `compliance`, `design`, `development`, `finance`, `leadership`, `legal`, `marketing`, `ops`, `project-management`, `research`, `sales`, `security`, `support` and `singular` (the cross-domain skills). A skill's folder name is `<domain>-<skill>` and equals its frontmatter `name`; it is invoked as `/<domain>-<skill>`.

## How a skill, a workflow file and a gate relate

- A **workflow file** (`workflows/design.yml`) lists phases. Each phase names its member `skills`, the `artifact` it writes (for example `02-define.md`) under `.singularskills/<folder>/<project>/`, and the artifacts it `requires` from earlier phases.
- A **skill** carries `metadata.workflow`, `metadata.phase` and `metadata.artifact` in its frontmatter, matching its workflow file. Its Prerequisites section tells the agent to run `scripts/gate.sh <project>` and to stop if it fails; the prose names the required files too, so the gate holds in agents that do not run scripts.
- A **gate** (`skills/<skill>/scripts/gate.sh`) is generated from the workflow file by `gen-gates`: it exits 1 naming each missing required artifact, else 0. In Claude Code, `adapters/claude/gate-hook.sh` (with `gates.json`, also generated) blocks the write itself. `--skip-checks` bypasses a gate and appends a `skipped` line to the run log, `.singularskills/log.jsonl`.
- The **conductor** (`skills/workflow`) reads the workflow file, runs each phase's members, and records `run-started` and `phase-approved` lines in the run log; a phase is complete only when approved. A member skill hands off to the conductor when you ask for the whole process rather than one step: its Prerequisites open with a generated handoff paragraph that first checks the run log for an open run (the conductor's own run), then the request's intent; a first-phase member picked without being named and without a run asks whether you want just that step or the whole workflow, and a later-phase member runs on its own behind its gate.

Edit the workflow file, never a generated gate or adapter, then regenerate.

## Checks

Run from the repository root:

```bash
bun install
bun run lint:skills    # skill-validator over every SKILL.md
bun run check:pack     # pack-tools: workflows, gen-gates/gen-references/gen-adapters --check, fixers --check, counts
bun run test           # Vitest in every package
bun run evals --dry    # list the eval cases; fails if a prompt names its own skill (spends nothing)
bun run check          # Biome (tabs, width 100)
```

`bun run evals` without `--dry` runs `claude plugin eval` and spends credits (capped by `EVALS_MAX_COST_USD`). `scripts/check-rename.sh` fails on any mention of the old project name outside the history allowlist.

Inside `claude plugin eval` runs the sandbox denies reads of the plugin's own files: skills cannot open their `references/`, and the conductor uses the workflows block built into its SKILL.md instead of the workflow files. To be reported upstream; the conductor handoff acceptance record carries the issue link once filed.

To regenerate after editing workflows, references or skill frontmatter, from `packages/pack-tools` (after `bun run build`): `bun run gen:gates`, `bun run gen:references`, `bun run gen:adapters`. For the docs site, from `apps/docs`: `bun run gen:data`.

## Stack

This repository's own declaration, read by the stack-aware skills when they run here. A project that uses the pack writes the same kind of section into its own `AGENTS.md` (or `CLAUDE.md` when `AGENTS.md` has none); `/singular-init` writes it from the project's files, and the full key set, the two shipped profiles (`bun-react-ts`, `rust-gpui`, under `references/stacks/`) and how to add one are on the docs site's Stack page and in `references/stacks/README.md`. Only `stack` is required; a key left out falls back to a named `profile`, and this repository names none.

```yaml
stack: TypeScript 5, Bun 1.3 workspaces with Turborepo; Next.js 16 docs site; Vitest 3; Biome
install: bun install
build: bun run build
test: bun run test
lint: bun run check
format: bun run format
run: cd apps/docs && bun run dev
layout: packages/* (pack-tools, skill-validator), apps/docs, skills/*, workflows/*.yml, references/*; tests colocated as *.test.ts
rules: Biome, tabs, width 100. Conventional commits. Never edit generated gates, reference copies or adapters; edit the source and regenerate. lint:skills, check:pack and the docs check stay green at every commit.
```

Skills with `metadata.stack-aware: true` (14 today) open their Prerequisites with a generated **Stack** step that reads the section, uses its commands exactly, reads the named profile bundled under their own `references/stacks/` for the rest, and runs `singular-detect` when there is no section. Every stack-aware skill links every profile in `references/stacks/` (the validator's `stack-step` rule checks this), so adding a profile means adding its link line to those 14 skills and, when a match rule exists, to `singular-init` and `singular-detect`.

## Figma

Nine design skills carry `metadata.figma-aware: true` (`design-empathize`, `design-define-component`, `design-ideate`, `design-prototype`, `design-test`, `design-a11y-audit`, `design-design-review`, `design-export-tokens`, `design-system-overview`). Each opens its Prerequisites, after the handoff, recall and stack paragraphs, with a generated **Figma** step (owned by `fix-skill-text`, pinned by the validator's `figma-step` rule) that binds the capabilities its steps name (`read-tokens`, `find-components`, `read-node`, `screenshot`, `write-design`, `write-figjam`, `write-slides`) to whatever Figma MCP server the user connected, and records the binding in the artifact's `## Tools` section. The contract is `references/design/figma-capabilities.md`; the checks a skill computes itself are in `references/design/a11y-checks.md`; both are bundled by `gen-references`. Process steps use the form `*Figma (<capabilities>):* … *Without Figma:* …` and never name a server's tool: the validator's `no-server-tool-names` rule rejects any `figma_*` or `figjam_*` identifier. The pack ships no server and makes no network calls.
