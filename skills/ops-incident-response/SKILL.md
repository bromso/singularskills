---
name: ops-incident-response
description: Guide a team through a live production incident — declare it and set a severity, assign incident commander, operations and communications, stabilise before diagnosing, check recent changes first, keep a timeline, and update on a cadence. Use when production is broken right now and the team needs to act in the right order. Not for a security breach; see /security-incident-response.
metadata:
  argument-hint: "[project] <what is happening>"
---

# Incident response

Help the team handle the incident in "$ARGUMENTS" now, in the right order, as `references/incidents.md` describes.

**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.

## Prerequisites

What is happening, in the user's words. When `$ARGUMENTS` or the request names a project, use that name as `<project>` whether or not its folder exists yet in `.singularskills/ops/`. With no project named: with exactly one folder there, use it; with several, ask which; with no folder at all, read none and continue. Read `.singularskills/ops/<project>/04-runbooks.md` and `05-on-call.md` when they exist, for the runbook and roles.

## Process

1. **Is it a security incident?** Signs of a breach (unauthorised access, exposed data, an attacker) mean following `/security-incident-response` instead.

2. **Declare it and set the severity** from `05-on-call.md`, or by impact: users cannot use a core journey is the highest.

3. **Assign the roles:** incident commander (coordinates and decides; the primary on call until handed over), operations (works the fix), communications (updates stakeholders, and customers with `/support-incident-update`).

4. **The first actions, in order:**
   1. Acknowledge and say "I have this, investigating" so nobody duplicates work.
   2. Check what changed recently: deploys, config, feature flags, dependencies.
   3. Find the matching runbook in `04-runbooks.md` and follow it.
   4. **Stabilise before diagnosing:** roll back, fail over, shed load or disable a feature; say which steps change production, what each does to users, and how to undo it.
   5. Escalate when the runbook says so, or after 15 minutes without progress.

5. **Keep a timeline** from now on: time, what was seen, what was done, by role.

6. **Update on a cadence:** every 30 minutes for the highest severity, saying what is known, what is not, and when the next update comes.

7. **Never touch live systems.** Do not run any command against a live system, and never say a command, alert or runbook was tested or verified; you write them for people to apply.

## Output

In chat: the severity, the roles, the next actions in order, and the next update time. When the incident is stable, offer to write the review with `/ops-incident-review`. This skill writes no file.
