---
name: sales-pipeline-review
description: Review a sales pipeline from a CRM export — deals with no next step or a stale one, close dates in the past, stages that do not match their qualification, and the forecast by category — with counts computed. Use when a seller or manager wants to know which deals need attention before a forecast call. Not for designing pipeline stages or lead scoring; see /marketing-revops.
metadata:
  argument-hint: "<export file> [project]"
---

# Pipeline review

Find the deals in "$ARGUMENTS" that need attention, and what the forecast really rests on.

**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.

## Prerequisites

The export: one row per open deal with name, stage, amount, close date, last activity, next step and its date, and forecast category if the CRM has one. When `$ARGUMENTS` or the request names a project, use that name as `<project>` whether or not its folder exists yet in `.singularskills/sales/` (create it when you write). With no project named, use `playbook`, the folder for everything that spans deals. Read the deals' own folders in `.singularskills/sales/` when they exist, for their qualification.

Append this line to `.singularskills/log.jsonl` before you write the review (create the folder and file if missing): `{"ts":"<ISO timestamp>","skill":"sales-pipeline-review","workflow":"sales","phase":null,"project":"<project>","event":"started","artifact":"pipeline/<date>-<slug>.md","note":""}`, where `<date>` is today as `YYYY-MM-DD` and `<slug>` is two to four words naming the topic, never a person.

## Process

1. **Compute the checks** with a script written to `.singularskills/sales/<project>/` and included beside the result, as of today:
   - deals with **no next step**, or a next step dated in the past (**stale**)
   - **close dates in the past**
   - no activity for 30 days or more
   - stage against qualification: a late stage with an unknown economic buyer, decision process or paper process (from the deal's `01-qualify.md` when it exists)
   - the forecast: amount by category, and how much of it sits on deals flagged above
   Scripts write only counts, amounts and deal or company names under `.singularskills/`; contact names, emails and phone numbers in the export never go into any file there.

2. **List the deals that need attention,** each with the flags and the one action that fixes it (set a next step, re-date, re-qualify, move to nurture).

3. **Write the review** to `.singularskills/sales/<project>/pipeline/<date>-<slug>.md` with sections **Checks** (counts), **Deals needing attention**, **Forecast** and **Actions**.

## Output

The review written to `.singularskills/sales/<project>/pipeline/<date>-<slug>.md`. Present the counts first, then the deals that put the most forecast at risk.

After you have written the review, append the `started` line of Prerequisites to `.singularskills/log.jsonl` with `"event":"finished"`: `{"ts":"<ISO timestamp>","skill":"sales-pipeline-review","workflow":"sales","phase":null,"project":"<project>","event":"finished","artifact":"pipeline/<date>-<slug>.md","note":""}`.

The review opens with this frontmatter (`agent` is the agent you run in, or `unknown`; this utility has no gate, so `phase` is `null` and `gate` is `none`):

```yaml
---
skill: sales-pipeline-review
workflow: sales
phase: null
project: <project>
started: <ISO timestamp>
finished: <ISO timestamp>
agent: <the agent you run in, or "unknown">
gate: none
---
```

The review ends with `## Decisions` and `## Open questions`, in this shape:

```markdown
## Decisions
- <what was chosen> — <why> — <what was rejected>

## Open questions
- <what a reviewer must settle>
```
