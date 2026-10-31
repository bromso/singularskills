---
name: analytics-dashboards
description: Design dashboards per audience — the question each tile answers, its metric by its agreed name, chart, comparison, filters, refresh, alert threshold and optionally the query behind it — cutting any tile that answers no question. Use when the user wants dashboards that keep answering the team's questions. Not for pipeline and revenue dashboards for leadership; see /marketing-revops.
metadata:
  argument-hint: "[project] [--skip-checks]"
  workflow: analytics
  phase: 5
  artifact: 05-dashboards.md
---

# Dashboards

Specify the dashboards for "$ARGUMENTS": few tiles, each answering a question someone asked.

**Arguments.** `$ARGUMENTS` may contain the project name and optional flags. Take the first token as `<project>` and treat `--skip-checks` as a flag; never include flags in file paths. All paths below use `<project>`. If `--skip-checks` is present, skip the prerequisite check and, **before writing any artifact**, append one line to `.singularskills/log.jsonl`: `{"ts":"<ISO timestamp>","skill":"analytics-dashboards","workflow":"analytics","phase":5,"project":"<project>","event":"skipped","artifact":"05-dashboards.md","note":"<reason or \"none given\">"}`.

**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.

## Prerequisites

**Part of a workflow.** This skill is phase 5 (Dashboards) of the Decision Analytics Cycle workflow (`analytics`); cross-domain workflows run it too. First check `.singularskills/log.jsonl` for an open run for this project: a `run-started` line with `"project":"<project>"` and no later `run-finished` line for the same `workflow` and `project`. If one exists, the conductor is running you: continue here. Otherwise, if the user asked to start, run, continue or resume a process or workflow rather than this one step, do not continue here: invoke the `workflow` skill with the workflow the user asked for, or `analytics` when they named none, followed by `<project>`; it runs this phase in order, asks before it writes and records the run. Otherwise continue here: a later phase runs on its own, behind its gate.

Run this skill's gate before writing: `sh <this skill's folder>/scripts/gate.sh <project> <project root>`, where `<project root>` is the folder that contains `.singularskills/` (use `.` when you are already there). If it exits non-zero, stop and tell the user what it printed, unless `--skip-checks` was given (see Arguments). On a refusal, before you stop, append this line to `.singularskills/log.jsonl` (create the folder and file if missing): `{"ts":"<ISO timestamp>","skill":"analytics-dashboards","workflow":"analytics","phase":5,"project":"<project>","event":"refused","artifact":"05-dashboards.md","note":"<what the gate printed>"}`. Once the gate has passed, or under `--skip-checks` once you have appended the `skipped` line, append this line before you start work: `{"ts":"<ISO timestamp>","skill":"analytics-dashboards","workflow":"analytics","phase":5,"project":"<project>","event":"started","artifact":"05-dashboards.md","note":""}`.

Read `.singularskills/analytics/<project>/02-metrics.md` for the metric names and definitions and `.singularskills/analytics/<project>/03-data.md` for which metrics are fit to show. Read `.singularskills/analytics/<project>/01-questions.md` for the questions and audiences when it exists.

## Process

1. **Name the audiences:** who looks at each dashboard (the decision-makers in `01-questions.md`, the team, leadership), how often, and what they do after looking.

2. **Choose the tiles** per audience: for each, the question it answers (from `01-questions.md`), the metric by its `02-metrics.md` name, and why this audience needs it. Cut any tile that answers no question, and any metric `03-data.md` marks not usable.

3. **Specify each tile:**
   - **Chart** — a line for a trend over time, a bar for comparing categories, a single number with its comparison for a headline; no pie charts for more than three parts
   - **Comparison** — target, previous period or same period last year
   - **Filters and segments** — only those in the metric's definition
   - **Refresh** — how often, and the latest complete period it shows
   - **Alert** — a threshold that should make someone act, and who, where one makes sense
   - **Query** — optionally, the SQL behind the tile in the user's dialect, following the metric's definition

4. **Order each dashboard:** the primary metric first, inputs next, guardrails last; at most about eight tiles per dashboard.

5. **Write the artifact** to `.singularskills/analytics/<project>/05-dashboards.md` with one section per dashboard: **Audience**, **Tiles** (a table: question, metric, chart, comparison, filters, refresh, alert) and **Queries**, and a final **Cut** section listing tiles considered and cut, with why.

## Output

The dashboard specs written to `.singularskills/analytics/<project>/05-dashboards.md`. Present a summary to the user highlighting:
- The dashboards and their audiences
- The alerts and who acts on them
- The tiles cut, and why

**Record the run.** After you have written the artifact, append this line to `.singularskills/log.jsonl` (the `started` line of Prerequisites, with `"event":"finished"`): `{"ts":"<ISO timestamp>","skill":"analytics-dashboards","workflow":"analytics","phase":5,"project":"<project>","event":"finished","artifact":"05-dashboards.md","note":""}`.

Open the artifact with this frontmatter (`agent` is the agent you run in, or `unknown`; `gate` is `passed` when the gate ran clean and `skipped` under `--skip-checks`):

```yaml
---
skill: analytics-dashboards
workflow: analytics
phase: 5
project: <project>
started: <ISO timestamp>
finished: <ISO timestamp>
agent: <the agent you run in, or "unknown">
gate: <passed|skipped>
---
```

End the artifact with `## Decisions` and `## Open questions`, in this shape:

```markdown
## Decisions
- <what was chosen> — <why> — <what was rejected>

## Open questions
- <what the next phase or a reviewer must settle>
```
