# singularskills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Agent Skills](https://img.shields.io/badge/Agent_Skills-format-CC785C)](https://agentskills.io)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Plugin-CC785C?logo=anthropic&logoColor=white)](https://claude.ai/code)
[![Codex CLI](https://img.shields.io/badge/Codex_CLI-Compatible-10A37F?logo=openai&logoColor=white)](https://github.com/openai/codex)
[![OpenCode](https://img.shields.io/badge/OpenCode-Compatible-6366F1)](https://opencode.ai)
[![Cursor](https://img.shields.io/badge/Cursor-Compatible-000?logo=cursor&logoColor=white)](https://cursor.com)
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-Compatible-4285F4?logo=googlegemini&logoColor=white)](https://github.com/google-gemini/gemini-cli)
[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun&logoColor=000)](https://bun.sh)

One pack of agent skills for digital production work: **338 skills across 21 domains**, from design and research to legal, security and accounting. Each skill is a plain `SKILL.md` folder that any agent supporting the Agent Skills format can load.

What you get:

- **Skills**: one folder per task (`design-empathize`, `development-plan`, ...). Each says what it needs first, what it does step by step, and where it writes its result.
- **Workflows**: one YAML file per workflow (`workflows/design.yml`, `workflows/launch-product.yml`, ...) that puts skills into ordered phases. The `workflow` skill runs one phase at a time and stops for your approval at every boundary.
- **Gates**: a skill whose phase needs earlier results checks that they exist before it writes (its `scripts/gate.sh`, plus a write hook in Claude Code). Pass `--skip-checks` to go ahead anyway; the skip is recorded.
- **Run log**: every started run, approved phase and skipped gate is one line in `.singularskills/log.jsonl`, so you, your team and the `singular-status` skill can see where each project stands.

> Migrating from metapowers: move `.metapowers/` to `.singularskills/` and replace `/domain:skill` with `/domain-skill`. Artifacts written before the run log existed count as written: the conductor offers them for approval instead of re-running their skills.

## Install

**Any agent** (the universal installer copies `skills/` into each detected agent's skills folder):

```bash
npx skills add bromso/singularskills            # this project
npx skills add bromso/singularskills --global   # every project, user scope
npx skills add bromso/singularskills --agent codex -y   # one agent, no prompts
```

Skills land in `.agents/skills/` for Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI and Kimi Code CLI, and in `.claude/skills/` for Claude Code. Each skill keeps its `scripts/` (the phase gates, executable) and `references/` folders.

**Claude Code** (also installs the `/design-empathize`-style command wrappers and the gate hook):

```
/plugin marketplace add bromso/singularskills
/plugin install singularskills@singularskills
```

**Codex:**

```bash
codex plugin marketplace add bromso/singularskills
codex plugin add singularskills@singularskills
```

**GitHub Copilot CLI and Gemini CLI:** use the universal installer. For Gemini command wrappers (`/design-empathize` and the rest), also copy `adapters/gemini/commands/*.toml` into `.gemini/commands/` (project) or `~/.gemini/commands/` (user).

Workflow artifacts are written to `.singularskills/<domain>/<project>/` in your project. That folder is meant to be committed: it is the record of what each phase produced, and the gates read it.

Then try a skill (the Claude Code and Gemini CLI command form; other agents pick skills up by name or description):

```
/design-empathize date-picker
/research-discover user-onboarding
/development-plan auth-system
```

### Supported agents

**Tier 1, tested per release** (`scripts/smoke-install.sh` installs into each and runs a gate): Claude Code, Codex, OpenCode, Cursor, GitHub Copilot (VS Code and CLI), Gemini CLI, Kimi Code CLI.

**Tier 2, supported through the universal installer, not tested per release:** everything `npx skills add` supports, including Windsurf, Zed, Cline, Antigravity, Roo Code, Qwen Code, Goose, Amp, Kilo Code, Trae and the rest.

## Domains

| Domain | Methodology | Skills | Description |
|--------|-------------|--------|-------------|
| [Design](https://bromso.github.io/singularskills/docs/design) | Design Thinking | 9 | Component design from research to usability test |
| [Research](https://bromso.github.io/singularskills/docs/research) | Double Diamond | 4 | Structured discovery and validation |
| [Analytics](https://bromso.github.io/singularskills/docs/analytics) | Decision Analytics Cycle | 10 | Decision-led metrics, data checks, analysis, dashboards and experiment readouts |
| [AI Product](https://bromso.github.io/singularskills/docs/ai) | AI Feature Lifecycle | 12 | Design, build, evaluate, ship and monitor AI features in a product |
| [Development](https://bromso.github.io/singularskills/docs/development) | Dev Workflow | 6 | Plan, build, test, debug, review, ship |
| [Operations](https://bromso.github.io/singularskills/docs/ops) | Reliability Cycle | 11 | SLOs, alerting, runbooks, on-call and blameless incident reviews |
| [Marketing](https://bromso.github.io/singularskills/docs/marketing) | RACE Framework | 37 | Full growth marketing lifecycle |
| [Sales](https://bromso.github.io/singularskills/docs/sales) | Deal Cycle | 12 | Qualify, discover, propose and close deals, and learn from wins and losses |
| [Support](https://bromso.github.io/singularskills/docs/support) | Support Operations Cycle | 10 | Support journey, taxonomy, macros, escalation, SLAs and account health |
| [Branding](https://bromso.github.io/singularskills/docs/branding) | Brand Lifecycle | 6 | Brand creation and compliance auditing |
| [Accessibility](https://bromso.github.io/singularskills/docs/accessibility) | WCAG-EM | 6 | Accessibility audit and remediation |
| [Project Management](https://bromso.github.io/singularskills/docs/project-management) | Scrum | 32 | Sprint-based project management |
| [Coaching](https://bromso.github.io/singularskills/docs/coaching) | Domain Coaching | 5 | Expert feedback across 5 disciplines |
| [Leadership](https://bromso.github.io/singularskills/docs/leadership) | Leadership Dev | 12 | Team building and management tools |
| [Legal](https://bromso.github.io/singularskills/docs/legal) | Legal Lifecycle | 35 | Contracts, compliance, governance |
| [Security](https://bromso.github.io/singularskills/docs/security) | NIST CSF 2.0 | 39 | Cybersecurity framework |
| [Compliance](https://bromso.github.io/singularskills/docs/compliance) | GRC Lifecycle | 51 | 30+ regulatory frameworks |
| [Bookkeeping](https://bromso.github.io/singularskills/docs/bookkeeping) | Bookkeeping Cycle | 9 | Transaction recording and reporting |
| [Accounting](https://bromso.github.io/singularskills/docs/accounting) | Accounting Cycle | 13 | Full 8-phase accounting cycle |
| [Finance](https://bromso.github.io/singularskills/docs/finance) | FP&A | 11 | Financial planning and analysis |
| [Singular](https://bromso.github.io/singularskills/docs/overview) | Cross-domain | 8 | The `workflow` conductor, plus status, init, report, detect, find, create and improve skills |

## How It Works

Each domain's skills follow the phases of a proven methodology. A workflow file lists the phases, the artifact each one writes, and what it requires:

```yaml
name: design
folder: design
phases:
  - phase: 1
    title: Empathize
    artifact: 01-empathize.md
    requires: []
    skills: [design-empathize]
  - phase: 2
    title: Define
    artifact: 02-define.md
    requires: [01-empathize.md]
    skills: [design-define-component]
```

- **Declare your stack once**: `/singular-init` writes a `Stack` section into `AGENTS.md` from your project's own files; the skills that build, test, review or generate code read it, and a profile (`bun-react-ts`, `rust-gpui`) fills in the rest.
- **Run one skill** by name: `/design-empathize date-picker` writes `.singularskills/design/date-picker/01-empathize.md`, after recalling what the repository already holds about `date-picker`.
- **Run a whole workflow** with the conductor: `/workflow design date-picker` runs phase 1, plays back what it decided, and asks before it moves to phase 2. A member skill hands off to the conductor when you ask for the whole process rather than one step; a first-phase skill picked for you without a run in progress asks whether you want just that step or the whole workflow.
- **Gates keep the order**: `/design-define-component date-picker` will not write `02-define.md` until `01-empathize.md` exists, unless you pass `--skip-checks`.
- **Artifacts** are Markdown files with a short frontmatter (skill, workflow, phase, finished) under `.singularskills/<folder>/<project>/`. Commit them.

## Cross-Domain Skills

```bash
/workflow launch-product acme          # Run a cross-domain workflow phase by phase
/singular-status                       # Where every project stands, from the run log
/singular-report                       # Cross-domain summary report
/singular-detect                       # Scan the project's stack, suggest skills
/singular-find-skill <topic>           # Search skill marketplaces
/singular-create-skill <topic>         # Write a new skill in this pack's format
/singular-improve-skill <name>         # Refine a skill from feedback
```

## Documentation

Full documentation: **[bromso.github.io/singularskills](https://bromso.github.io/singularskills/)**

## Project Structure

```
singularskills/
├── skills/                    # The pack: one folder per skill (SKILL.md, scripts/gate.sh, references/)
├── workflows/                 # One YAML file per workflow: phases, artifacts, requirements
├── references/                # Reference docs shared by several skills; stacks/ for project stacks
├── evals/                     # claude plugin eval cases, one folder per skill (bun run evals)
├── adapters/                  # Per-agent wrappers: Claude commands, gates.json and hook; Gemini commands
├── .claude-plugin/            # Claude Code plugin manifest and marketplace
├── packages/
│   ├── pack-tools/            # Pack checks and generators (gates, references, adapters)
│   └── skill-validator/       # SKILL.md validation
├── apps/docs/                 # Documentation site (Fumadocs + Next.js)
├── scripts/                   # run-evals.sh, smoke-install.sh, check-rename.sh
└── docs/                      # Design specs and implementation plans
```

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.3
- Any agent that loads Agent Skills, to try the skills

### Setup

```bash
git clone https://github.com/bromso/singularskills.git
cd singularskills
bun install
```

### Commands

```bash
bun run build          # Build all packages
bun run test           # Run all tests
bun run lint:skills    # Validate every SKILL.md
bun run check:pack     # Pack checks: workflows, generated gates/references/adapters, counts
bun run evals --dry    # List the eval cases (free); bun run evals runs them (spends credits)
bun run check          # Biome check
bun run format         # Biome format
```

See [AGENTS.md](AGENTS.md) for how the repository fits together.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

[MIT](LICENSE) — Jonas Broms
