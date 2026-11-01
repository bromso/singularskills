---
name: ops-reliability-review
description: Review a service's reliability over a period — SLO attainment and error budget consumed, the policy actions they trigger, alert volume and actionable ratio, pages per shift, incidents and whether their action items are done — compared with the last review. Use when a team holds its regular reliability review or must decide whether to freeze releases. Not for setting the targets; see /ops-slos.
metadata:
  argument-hint: "[project] [--skip-checks]"
  workflow: ops
  phase: 6
  artifact: 06-review.md
---

# Review

Look back at how reliable "$ARGUMENTS" was, and decide what the error budget policy says to do now.

**Arguments.** `$ARGUMENTS` may contain the project name and optional flags. Take the first token as `<project>` and treat `--skip-checks` as a flag; never include flags in file paths. All paths below use `<project>`. If `--skip-checks` is present, skip the prerequisite check and, **before writing any artifact**, append one line to `.singularskills/log.jsonl`: `{"ts":"<ISO timestamp>","skill":"ops-reliability-review","workflow":"ops","phase":6,"project":"<project>","event":"skipped","artifact":"06-review.md","note":"<reason or \"none given\">"}`.

**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.

## Prerequisites

**Part of a workflow.** This skill is phase 6 (Review) of the Reliability Cycle workflow (`ops`); cross-domain workflows run it too. First check `.singularskills/log.jsonl` for an open run for this project: a `run-started` line with `"project":"<project>"` and no later `run-finished` line for the same `workflow` and `project`. If one exists, the conductor is running you: continue here. Otherwise, if the user asked to start, run, continue or resume a process or workflow rather than this one step, do not continue here: invoke the `workflow` skill with the workflow the user asked for, or `ops` when they named none, followed by `<project>`; it runs this phase in order, asks before it writes and records the run. Otherwise continue here: a later phase runs on its own, behind its gate.

Run this skill's gate before writing: `sh <this skill's folder>/scripts/gate.sh <project> <project root>`, where `<project root>` is the folder that contains `.singularskills/` (use `.` when you are already there). If it exits non-zero, stop and tell the user what it printed, unless `--skip-checks` was given (see Arguments). On a refusal, before you stop, append this line to `.singularskills/log.jsonl` (create the folder and file if missing): `{"ts":"<ISO timestamp>","skill":"ops-reliability-review","workflow":"ops","phase":6,"project":"<project>","event":"refused","artifact":"06-review.md","note":"<what the gate printed>"}`. Once the gate has passed, or under `--skip-checks` once you have appended the `skipped` line, append this line before you start work: `{"ts":"<ISO timestamp>","skill":"ops-reliability-review","workflow":"ops","phase":6,"project":"<project>","event":"started","artifact":"06-review.md","note":""}`.

Read `.singularskills/ops/<project>/02-slos.md` for the SLOs, budgets and policy. Read `03-alerting.md` and `05-on-call.md` when they exist, and any incident reviews in `.singularskills/ops/<project>/incidents/`.

If `.singularskills/ops/<project>/06-review.md` already exists, keep it as `06-review-<date>.md` (today's date as `YYYY-MM-DD`; if that name is taken, add `-2`, `-3` and so on) before you write, and compare against it.

## Process

1. **Get the data:** ask once for the SLI data over the period (good and valid events, or the SLO tool's report), page and alert history, and the incidents. Without data, the review lists what to measure and every number is `not measured`.

2. **Compute per SLO** with a script written to `.singularskills/ops/<project>/` and included beside the result: attainment over the window, error budget consumed, and the burn rate now. Scripts read the user's files where they keep them and write results under `.singularskills/`.

3. **Apply the policy:** what `02-slos.md`'s error budget policy says for each SLO at its consumption (for example, a freeze at over 100%), stated plainly as the policy's action, not a new decision.

4. **Alert and on-call health:** alert volume, the actionable ratio, and pages per shift against the target, computed from the history.

5. **Incidents and action items:** the incidents in the period, their impact, and whether each action item from their reviews is done, late or not started.

6. **Compare with the previous review** when one was kept: the change in attainment, budget and pages.

7. **Write the artifact** to `.singularskills/ops/<project>/06-review.md` with sections **Period**, **SLOs and budgets**, **Policy actions**, **Alerts and on-call**, **Incidents and action items** and **Compared with last review**.

## Output

The review written to `.singularskills/ops/<project>/06-review.md`. Present the policy actions first (freeze or not), then the SLOs at risk, then overdue action items.

**Record the run.** After you have written the artifact, append this line to `.singularskills/log.jsonl` (the `started` line of Prerequisites, with `"event":"finished"`): `{"ts":"<ISO timestamp>","skill":"ops-reliability-review","workflow":"ops","phase":6,"project":"<project>","event":"finished","artifact":"06-review.md","note":""}`.

Open the artifact with this frontmatter (`agent` is the agent you run in, or `unknown`; `gate` is `passed` when the gate ran clean and `skipped` under `--skip-checks`):

```yaml
---
skill: ops-reliability-review
workflow: ops
phase: 6
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
