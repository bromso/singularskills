---
name: ops-service-inventory
description: Map a production system for reliability work — its services, owners, users and critical journeys, dependencies, criticality tiers, and the current monitoring, alerting, on-call and deploy state, with the tooling recorded for later steps. Use when a team wants more reliable services and first needs a picture of what it runs. Not for a security asset inventory; see /security-monitoring-strategy.
metadata:
  argument-hint: "[project] [--skip-checks]"
  workflow: ops
  phase: 1
  artifact: 01-inventory.md
  stack-aware: true
---

# Inventory

Map what "$ARGUMENTS" runs in production, who depends on it, and how it is watched today.

**Arguments.** `$ARGUMENTS` may contain the project name and optional flags. Take the first token as `<project>` and treat `--skip-checks` as a flag; never include flags in file paths. All paths below use `<project>`. If `--skip-checks` is present, skip the prerequisite check and, **before writing any artifact**, append one line to `.singularskills/log.jsonl`: `{"ts":"<ISO timestamp>","skill":"ops-service-inventory","workflow":"ops","phase":1,"project":"<project>","event":"skipped","artifact":"01-inventory.md","note":"<reason or \"none given\">"}`.

**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.

## Prerequisites

**Part of a workflow.** This skill is phase 1 (Inventory) of the Reliability Cycle workflow (`ops`); cross-domain workflows run it too. First check `.singularskills/log.jsonl` for an open run for this project: a `run-started` line with `"project":"<project>"` and no later `run-finished` line for the same `workflow` and `project`. If one exists, the conductor is running you: continue here. Otherwise, if the user asked to start, run, continue or resume a process or workflow rather than this one step, do not continue here: invoke the `workflow` skill with the workflow the user asked for, or `ops` when they named none, followed by `<project>`; it runs this phase in order, asks before it writes and records the run. Otherwise, unless the user named this skill, ask one question, since this is the first phase of its workflow: "Just this step, or the whole Reliability Cycle workflow?" End your turn and wait; on the whole workflow, hand off the same way; on just this step, continue here.

**Recall.** Before you ask the user anything, look for what this repository already holds about `<project>`: if a tool is available whose description says it searches or maps this repository (a memory or repo-map server such as `repo_map` or `entities`), query it for `<project>` and this phase's subject and read what it returns, keeping only results from this repository; in every case also list `.singularskills/*/<project>/` and read the **Decisions** and **Open questions** of any artifact there, and the lines of `.singularskills/log.jsonl` whose `project` is `<project>`. After the frontmatter and title, add a `## Recalled` section of at most ten lines naming what you found and where (path or tool), or the single line `Nothing recalled: no earlier artifacts, log lines or memory results for <project>.` Ask the user only what this did not answer. The trail's shape is described in `references/memory/trail.md`, bundled with this skill.

**Stack.** Before you build, test, lint, run or generate code, read the `Stack` section of the project's `AGENTS.md`, or of `CLAUDE.md` when `AGENTS.md` has none. Use its commands exactly as written, its `layout` for where files go and its `rules` as requirements. If it names a `profile`, also read the file `<profile>.md` in the `stacks` folder of this skill's bundled references for the full commands, layout and rules; the project's own keys win where both speak. If there is no `Stack` section, run the `singular-detect` skill, state what you inferred in one line, and offer to write the section with `singular-init`. Never assume a package manager, test runner or formatter the project did not declare.

Before you start work, append this line to `.singularskills/log.jsonl` (create the folder and file if missing): `{"ts":"<ISO timestamp>","skill":"ops-service-inventory","workflow":"ops","phase":1,"project":"<project>","event":"started","artifact":"01-inventory.md","note":""}`.

None — this is the first phase.

## Process

1. **Read what exists:** the project's `AGENTS.md` or `CLAUDE.md` `Stack` section, any architecture or deploy docs the user names, and `.singularskills/development/<project>/` and `.singularskills/security/<project>/` artifacts when they exist.

2. **Ask the user what you could not find**, once and together: the services or components, who owns each (a team, not a person's contact details), who uses them, and what happened in the last few incidents.

3. **List the services:** for each, its job, its owner, its users, and the **critical user journeys** it serves (sign in, check out, search, upload).

4. **Map dependencies:** what each service calls (databases, queues, other services, third-party APIs) and what calls it; mark the dependencies that could take it down.

5. **Set a criticality tier** per service: tier 1 (users cannot do the core job without it), tier 2 (degraded but usable), tier 3 (internal or deferrable).

6. **Record the current state,** each item **known** or **unknown**: what is monitored, which alerts exist and who receives them, whether there is an on-call rotation, how deploys and rollbacks happen.

7. **Record the tooling** in a **Tooling** section, each tool **known** or **unknown**: the monitoring system and its query language (Prometheus and PromQL, Datadog, CloudWatch), the paging tool, the deploy and rollback tool, and infrastructure tooling (kubectl, terraform). Take them from the Stack section's text when it names them; otherwise ask once. Later phases write alert rules and runbook commands for these tools.

8. **Never touch live systems.** Do not run any command against a live system, and never say a command, alert or runbook was tested or verified; you write them for people to apply.

9. **Write the artifact** to `.singularskills/ops/<project>/01-inventory.md` with sections **Services**, **Critical journeys**, **Dependencies**, **Tiers**, **Current state** and **Tooling**.


## References

- `references/stacks/bun-react-ts.md` and `references/stacks/rust-gpui.md`: the shipped stack profiles

## Output

The inventory written to `.singularskills/ops/<project>/01-inventory.md`. Present a summary to the user highlighting:
- The tier 1 services and their critical journeys
- The dependencies most likely to take a service down
- What is unknown about monitoring, on-call and tooling

**Record the run.** After you have written the artifact, append this line to `.singularskills/log.jsonl` (the `started` line of Prerequisites, with `"event":"finished"`): `{"ts":"<ISO timestamp>","skill":"ops-service-inventory","workflow":"ops","phase":1,"project":"<project>","event":"finished","artifact":"01-inventory.md","note":""}`.

Open the artifact with this frontmatter (`agent` is the agent you run in, or `unknown`; `gate` is `none`, as this phase has no gate):

```yaml
---
skill: ops-service-inventory
workflow: ops
phase: 1
project: <project>
started: <ISO timestamp>
finished: <ISO timestamp>
agent: <the agent you run in, or "unknown">
gate: none
---
```

End the artifact with `## Decisions` and `## Open questions`, in this shape:

```markdown
## Decisions
- <what was chosen> — <why> — <what was rejected>

## Open questions
- <what the next phase or a reviewer must settle>
```
