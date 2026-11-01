---
name: ops-incident-review
description: Write a blameless postmortem of a production outage or incident — impact, timeline, several contributing factors instead of one root cause, where the system misled the responders, what went well, and action items on the system with owners. Use when a production incident is over and the team needs to understand it. Not for project post-mortems; see /project-management-post-mortem.
metadata:
  argument-hint: "[project] [incident]"
---

# Incident review

Write the review of the incident in "$ARGUMENTS" so the team learns from it, as `references/incidents.md` describes: the question is what in the system let this happen, never who to blame.

**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.

## Prerequisites

The record: the timeline, chat log, alerts, graphs and notes the user supplies, as files or pastes. When `$ARGUMENTS` or the request names a project, use that name as `<project>` whether or not its folder exists yet in `.singularskills/ops/` (create it when you write). With no project named: with exactly one folder there, use it; with several, ask which; with no folder at all, name the project after the affected service in the record (for example `checkout`) and say so in Decisions. Read `.singularskills/ops/<project>/02-slos.md` and `04-runbooks.md` when they exist.

Append this line to `.singularskills/log.jsonl` before you write the review (create the folder and file if missing): `{"ts":"<ISO timestamp>","skill":"ops-incident-review","workflow":"ops","phase":null,"project":"<project>","event":"started","artifact":"incidents/<date>-<slug>.md","note":""}`, where `<date>` is today as `YYYY-MM-DD` and `<slug>` is two to four words naming the topic, never a person.

## Process

1. **Check it is not a security incident.** If the record shows signs of a breach (unauthorised access, exposed data, an attacker), stop and point the user to `/security-incident-response`.

2. **People by role, never by name,** even when the user or the record names them: "the deploying engineer", "the on-call engineer", "the incident commander". Rewrite names to roles everywhere: in the review and in your reply to the user, including when you explain that the review is blameless (say "the deploying engineer", not the person's name).

3. **Impact:** how long users were affected, which journeys, roughly how many users, and the error budget consumed, each `computed` from the record with a script written to `.singularskills/ops/<project>/` and included beside the result, or `not measured`. Scripts read the user's files where they keep them and write results under `.singularskills/`.

4. **Timeline:** times, what was seen, what was done, by role, from the first sign to full recovery; mark when the problem started, when it was detected, when it was mitigated and when it was resolved.

5. **Contributing factors, several, not one root cause.** Each tied to a part of the system or process: the tool, the guard that was missing, the alert that fired late, the runbook that was stale, the review that did not happen. **Human error is a starting point, not a finding:** when a person did something that caused harm, ask what made it easy to do and hard to notice, and write that as the factor.

6. **Where the system misled or failed the responders:** confusing output, missing signals, steps that did not work, information they did not have.

7. **What went well,** so it is kept.

8. **Action items that change the system or the process,** each with an owner (a role or team) and a date. Never retraining, discipline or "be more careful" as the fix for a systemic gap; if the user asks for one, explain why a guard in the system works where a reminder does not, and write the guard.

9. **Write the review** to `.singularskills/ops/<project>/incidents/<date>-<slug>.md` with sections **Summary**, **Impact**, **Timeline**, **Contributing factors**, **Where the system misled us**, **What went well** and **Action items**.

## Output

The review written to `.singularskills/ops/<project>/incidents/<date>-<slug>.md`. Present the contributing factors and the action items first, with their owners. Name nobody in the reply either: people by role only.

After you have written the review, append the `started` line of Prerequisites to `.singularskills/log.jsonl` with `"event":"finished"`: `{"ts":"<ISO timestamp>","skill":"ops-incident-review","workflow":"ops","phase":null,"project":"<project>","event":"finished","artifact":"incidents/<date>-<slug>.md","note":""}`.

The review opens with this frontmatter (`agent` is the agent you run in, or `unknown`; this utility has no gate, so `phase` is `null` and `gate` is `none`):

```yaml
---
skill: ops-incident-review
workflow: ops
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
