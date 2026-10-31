---
name: analytics-experiment-readout
description: Read out a finished A/B test — sample ratio check first, then whether it ran as planned, the primary metric's effect and interval, guardrails, and a ship, don't ship, inconclusive or invalid call. Use when a test has finished and the user asks whether the change won and can ship. Not for designing a test; see /marketing-ab-test-setup.
metadata:
  argument-hint: "<results file> [project]"
---

# Experiment readout

Read out the finished test in "$ARGUMENTS" and make a call that can be trusted. The checks run in a fixed order, and a failure early in the order overrides everything after it: a significant p-value means nothing if the test is broken.

**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.

## Prerequisites

The results: a file path or a pasted table with, per arm, the users assigned and the outcome (conversions, or a mean and spread). When `$ARGUMENTS` or the request names a project, use that name as `<project>` whether or not its folder exists yet in `.singularskills/analytics/` (create it when you write). With no project named: with exactly one folder there, use it; with several, ask which; with no folder at all, ask for a project name.

Read the test plan from the `## A/B Test:` section of `.singularskills/marketing/<project>/03-convert.md` when it exists: the planned split, primary metric, guardrails, planned sample size per arm and duration. Without a plan, ask once for those; with no answer, the planned split is unknown: say so, treat the sample size and duration as unknown, and never call the test invalid on an assumed split. If the file has more than one `## A/B Test:` section, use the one whose name matches the test in the request or the results file; with several and no match, ask which.

Append this line to `.singularskills/log.jsonl` before you write the readout (create the folder and file if missing): `{"ts":"<ISO timestamp>","skill":"analytics-experiment-readout","workflow":"analytics","phase":null,"project":"<project>","event":"started","artifact":"experiments/<date>-<slug>.md","note":""}`, where `<date>` is today as `YYYY-MM-DD` and `<slug>` is two to four words naming the test, never a person.

## Process

1. **Check the sample ratio first.** Compare the users in each arm with the **planned split** from the plan (not an assumed 50/50 when the plan says otherwise), using a chi-square goodness-of-fit test computed with a script, as `references/experiment-readout.md` shows. At p < 0.001 there is a sample ratio mismatch: the assignment or the logging is broken, the result cannot be trusted until the cause is found, and the call is **invalid** whatever the primary metric shows. List the usual causes to check: users dropped by a redirect or a crash in one arm, bots, a logging change mid-test, mis-bucketing.

   **When the planned split is unknown** (no plan and no answer), test the counts against 50/50 and against the nearest conventional split they fit (90/10, 80/20, 2:1). If they fit neither, or fit a split other than 50/50, the call is **inconclusive: planned split unknown**, naming the split the counts fit and asking for the plan; a deviation from an assumed split is never **invalid**.

   **Without a way to run code**, state no test statistic or p-value. Show the observed users per arm and their shares against the planned split, label the check `not computed`, and if the shares are plainly off the plan (several points away on thousands of users), the call is **inconclusive: suspected sample ratio mismatch** until the check is computed. Do not go on to call a winner.

2. **Check the test ran as planned:** the planned sample per arm and duration were reached, and nobody stopped it early because it looked significant. An unplanned early stop, or a test short of its planned sample or duration, makes the call **inconclusive** unless the plan used a sequential method.

3. **Compute the primary metric's effect:** absolute and relative difference with a 95% confidence interval, the sample per arm and the p-value (two-proportion z-test for a conversion metric; Welch's t-test or a bootstrap for a mean), with a script written to `.singularskills/analytics/<project>/` and included beside the result. Scripts read the user's files where they keep them and write only aggregates (counts, sums, rates and intervals): no row-level data, names, emails or raw IDs go into any file under `.singularskills/`. Without a way to run code, report the raw rates per arm as `not computed` and make no significance claim.

4. **Check the guardrails** the plan names, each with its change and interval. A significantly worse guardrail means **don't ship**, and blocks shipping even when the call is **inconclusive** for another reason: say so beside the call.

5. **Weigh the base rate:** most tests do not move their primary metric, so a surprising or very large effect needs a replication run before launch; say so when it applies.

6. **Make the call** from this table, top row first:

   | Situation | Call |
   | --- | --- |
   | Sample ratio mismatch computed at p < 0.001 | **invalid** |
   | Shares plainly off the planned split, check not computed | **inconclusive: suspected sample ratio mismatch** |
   | No plan, and the counts do not fit 50/50 | **inconclusive: planned split unknown** |
   | Unplanned early stop, or planned sample or duration not reached | **inconclusive** |
   | A guardrail significantly worse | **don't ship** |
   | Primary metric's interval entirely above zero, guardrails fine | **ship** (replicate first if surprising) |
   | Primary metric's interval entirely below zero | **don't ship** |
   | Interval spans zero | **inconclusive**, with the effect sizes it rules out |

7. **Write the readout** to `.singularskills/analytics/<project>/experiments/<date>-<slug>.md` with sections **Plan** (as read, or assumed), **Sample ratio**, **Ran as planned**, **Primary metric**, **Guardrails**, **Call** and **Next step**.

## Output

The readout written to `.singularskills/analytics/<project>/experiments/<date>-<slug>.md`. Present the call first, then the check that decided it, then the primary metric's effect with its interval or `not computed`.

After you have written the readout, append the `started` line of Prerequisites to `.singularskills/log.jsonl` with `"event":"finished"`: `{"ts":"<ISO timestamp>","skill":"analytics-experiment-readout","workflow":"analytics","phase":null,"project":"<project>","event":"finished","artifact":"experiments/<date>-<slug>.md","note":""}`.

The readout opens with this frontmatter (`agent` is the agent you run in, or `unknown`; this utility has no gate, so `phase` is `null` and `gate` is `none`):

```yaml
---
skill: analytics-experiment-readout
workflow: analytics
phase: null
project: <project>
started: <ISO timestamp>
finished: <ISO timestamp>
agent: <the agent you run in, or "unknown">
gate: none
---
```

The readout ends with `## Decisions` and `## Open questions`, in this shape:

```markdown
## Decisions
- <what was chosen> — <why> — <what was rejected>

## Open questions
- <what the next phase or a reviewer must settle>
```
