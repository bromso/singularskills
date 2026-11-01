# Ops Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `ops` domain (11 skills, a 6-phase gated workflow per service, two references, docs, one eval chosen to beat the baseline) to the singularskills pack.

**Architecture:** Same shape as project 7's `sales` domain: Markdown skills under `skills/ops-*/SKILL.md`, a workflow file that drives generated gates, conductor tables and adapters, two domain-list entries in the validator and pack-tools, and docs pages in the `sales` section's formats. Four skills carry `metadata.stack-aware: true`, so the generated Stack step is added to them. The bento keeps 36 cells, with project-management going from half to small.

**Tech Stack:** Bun 1.3, Turborepo, TypeScript, Vitest, Biome (tabs, width 100), Fumadocs.

**Spec:** `docs/superpowers/specs/2026-11-01-ops-domain-design.md`

## Global Constraints

- **Skills.** Domain `ops`. Phase skills: `ops-service-inventory`, `ops-slos`, `ops-alerting`, `ops-runbooks`, `ops-on-call`, `ops-reliability-review` (phases 1–6). Utilities: `ops-incident-review`, `ops-incident-response`, `ops-alert-audit`, `ops-error-budget`, `ops-change-review`.
- **Artifacts.** Under `.singularskills/ops/<project>/`: `01-inventory.md`, `02-slos.md`, `03-alerting.md`, `04-runbooks.md`, `05-on-call.md`, `06-review.md`.
- **Requires.** SLOs ← Inventory; Alerting ← SLOs; Runbooks ← Alerting; On-call ← Alerting + Runbooks; Review ← SLOs.
- **Utility artifacts.** `incidents/<date>-<slug>.md` and `alerts/<date>-<slug>.md` (`phase: null`, `gate: none`). Incident response, error budget and change review write no file.
- **Stack-aware.** `metadata.stack-aware: true` on `ops-service-inventory`, `ops-alerting`, `ops-runbooks` and `ops-change-review`. The Stack schema and `STACK_STEP` are **not** changed.
- **Tooling.** `01-inventory.md` has a **Tooling** section (monitoring and query language, paging, deploy and rollback, infrastructure), each tool known or unknown. Alerting, runbooks and change review read it. With a tool unknown, rules are plain conditions and steps are marked **command to fill in**. A command is never invented.
- **Alerting.** Multiwindow burn-rate starting thresholds: 14.4× over 1h and 5m → page; 6× over 6h and 30m → page; 1× over 3d and 6h → ticket. Every page links to a runbook.
- **Runbooks.** Each runbook has *Is this real?*, *Mitigations* (each command with expected output, impact and rollback) and *Escalate*. Steps that change production are marked **changes production**.
- **Incident reviews.** People by role, never by name; several contributing factors, not one root cause; "where the system misled the responders"; human error is a starting point, never a finding; action items on the system, with owners.
- **Never touch live systems.** No skill runs a command against a live system or claims to have tested one.
- **Labels and re-runs.** Every number is `computed`, `not measured` or `target`. Re-running Review keeps the previous file as `06-review-<date>.md`, adding `-2`, `-3` if the name is taken.
- **Neighbours.** `CROSS_DOMAIN_READS.ops = ["development", "security", "support", "analytics"]`. `ops` joins both compute sets and no disclaimer group. No other domain's skills are edited.
- **Names.** Workflow title and README methodology: "Reliability Cycle". Docs name: "Operations".
- **Totals.** **338 skills**, **21 domains**, **22** eval cases, **24** workflows.
- **Bento.**
  - 2 wide (design, development), 4 half (research, marketing, security, accessibility), 14 small and 1 meta = **36 cells**. project-management becomes small.
  - `ops` is small and **sky**.
  - Orders: design 1, development 2, research 3, marketing 4, security 5, then alphabetical: accessibility 6 … legal 16, ops 17, project-management 18, sales 19, support 20, singular 21.
- **Utilities and projects.** Utilities take a project the user names whether or not its folder exists.
- **Descriptions.**
  - Start with a verb the validator recognises (check `packages/skill-validator/src/rules.ts`).
  - Include `Use when …` of at least 6 words.
  - Are 120–400 characters.
  - Carry `Not for …; see /…` against spec §3's neighbours.
  - `ops-incident-review`'s description says "production outage or incident … postmortem".
- **Docs.** Any docs `description` containing `: ` is quoted.
- **Commits** end `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Pack-tools commands need `bun run build` in `packages/pack-tools` first.
- **Until Task 6:**
  - Verify with `bun run check` in `packages/pack-tools` plus `bun run lint:skills`.
  - Restore `apps/docs/lib/site-data.json` from HEAD after each lint run.
  - A skill or reference may not name an `/ops-*` skill that a later task creates. Record a ruling and restore it in Task 4.

## Review Focus

1. **The manager asks to blame a named engineer.** The review uses roles, finds system factors and refuses discipline as the fix. Pinned by Task 4's greps (`never by name`, `starting point`) and the eval case.
2. **No tooling declared.** The runbooks write **command to fill in** rather than invented commands. Pinned by Task 3's grep and acceptance run 7.
3. **An SLO other than 99.9%** (say 99.5% over 28 days). The burn-rate thresholds and budget follow that target, not the 99.9% example. Pinned by acceptance run 6's second case.
4. **Signs of a security breach in an incident.** Incident review and incident response point to `/security-incident-response`. Pinned by Task 4's grep.
5. **A runbook step that changes production.** It is marked, with impact and rollback. Pinned by Task 3's grep (`changes production`) and acceptance run 1.

---

### Task 1: Validator and pack-tools know `ops`

**Files:** `packages/skill-validator/src/plugin-rules.ts` (`CROSS_DOMAIN_READS`, `COMPUTE_WITH_CODE_PLUGINS`), `packages/pack-tools/src/content-blocks.ts` (`COMPUTE_PLUGINS`); tests `packages/skill-validator/src/plugin-rules.test.ts`, `packages/pack-tools/src/content-blocks.test.ts`.

- [ ] **Step 1: Write the failing tests**, in the shape of the sales ones:
  - `ops-incident-review` reading `.singularskills/development|security|support|analytics/<p>/` gets no `artifact-root` finding, and reading `.singularskills/legal/...` does.
  - The sorted compute set equals `["accounting", "ai", "analytics", "bookkeeping", "finance", "ops", "sales", "support"]`.
  - `ops-error-budget` without the compute paragraph yields `compute-with-code-present`.
  - `COMPUTE_PLUGINS.has("ops")` is true.
- [ ] **Step 2: Run** both files. Expected: the new cases FAIL.
- [ ] **Step 3: Add the entries**, appending `"ops"` after `"sales"` in both multi-line sets.
- [ ] **Step 4: Run** `SKIP_NETWORK_TESTS=1 bun run test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(ops): validator and pack-tools know the ops domain`.

### Task 2: References

**Files:** create `references/ops/slos-and-alerting.md`, `references/ops/incidents.md`.

- [ ] **Step 1: Write a check script** in the workspace. Run it. Expected: FAIL.
  - `slos-and-alerting.md` contains "good events", "error budget policy", "14.4", "1/12", "page", "ticket", "actionable".
  - `incidents.md` contains "contributing factors", "mislead", "starting point", "by role", "Is this real?", "changes production", "Anandayuvaraj".
- [ ] **Step 2: Write both files** per spec §6. `slos-and-alerting.md` includes the thresholds table and a short Python snippet for the budget math. Citations:
  - Google SRE Workbook, *Implementing SLOs* (https://sre.google/workbook/implementing-slos)
  - Google SRE Workbook, *Alerting on SLOs* (https://sre.google/workbook/alerting-on-slos/)
  - Google SRE Book, *Postmortem Culture* (https://sre.google/sre-book/postmortem-culture)
  - Anandayuvaraj et al. 2025 *ICSE*
  - Sillito et al. 2024 *CHASE*
  - Okwesa 2026
  - Ding et al. 2023 and Michels et al. 2025 (alarm fatigue, labelled as evidence from another field)
  - incident.io and itoc360 on-call guides (practice sources, labelled)
  - The Good Shell and Doc Holiday runbook guides
- [ ] **Step 3: Run** the check. Expected: all ok.
- [ ] **Step 4: Commit** `docs(ops): slos-and-alerting and incidents references`.

### Task 3: Workflow and the six phases

**Files:**
- Create: `workflows/ops.yml`, `skills/ops-{service-inventory,slos,alerting,runbooks,on-call,reliability-review}/SKILL.md`.
- Modify: `packages/pack-tools/src/skill-text.test.ts` (members 245 → 251, first phases 37 → 38) and `packages/pack-tools/src/workflows.test.ts` (23 → 24).

- [ ] **Step 1: Write the workflow file** and run `bun run check` in `packages/pack-tools`. Expected: FAIL with "names unknown skill ops-…" for six skills.
- [ ] **Step 2: Write the six skills** per spec §4 items 1–6 and §5, in the voice of `skills/sales-*`. Set `metadata.stack-aware: true` on inventory, alerting and runbooks.
  - **Inventory:** the Tooling section, taken from the Stack section's text when it names tools, otherwise asked once.
  - **SLOs:** SLIs as good ÷ valid events, the budget computed, and the error budget policy as a draft until the user records who agreed it. Links `references/slos-and-alerting.md`.
  - **Alerting:**
    - burn-rate alerts with the thresholds above, computed for the SLO's own target;
    - symptom alerts only where no SLO covers a user-facing failure;
    - page or ticket for every alert, and every page names its runbook;
    - rules in the Tooling query language, otherwise plain conditions;
    - names the alert audit as "the alert-audit skill" until Task 4.
  - **Runbooks:** the three sections, **changes production** marks, expected output, impact and rollback for every command, **command to fill in** when tooling is unknown, and never claims a command was tested.
  - **On-call:** rotation, the handoff checklist, severities, roles, escalation, and load limits labelled `target`.
  - **Review:** computed attainment and budget, the policy actions those trigger, the alert actionable ratio, pages per shift, incidents and their action items, and keeps `06-review-<date>.md` on re-run.
- [ ] **Step 3: Generate.** In `packages/pack-tools`, run twice, then confirm the second pass changes nothing: `build`, `fix:args`, `fix:skill-text`, `fix:phase-files`, `fix:frontmatter`, `fix:compute`, `gen:gates`, `gen:references`, `gen:adapters`. Confirm the generated **Stack** step appears in the three stack-aware phase skills.
- [ ] **Step 4: Update the pinned counts.** Then run:
  - `bun run check` in `packages/pack-tools`
  - `bun run lint:skills`, then restore `site-data.json`
  - `SKIP_NETWORK_TESTS=1 bun run test`
  - `grep -n "changes production" skills/ops-runbooks/SKILL.md; grep -n "command to fill in" skills/ops-runbooks/SKILL.md; grep -n "14.4" skills/ops-alerting/SKILL.md; grep -n "06-review-<date>.md" skills/ops-reliability-review/SKILL.md; grep -c "^\*\*Stack.\*\*" skills/ops-{service-inventory,alerting,runbooks}/SKILL.md`

  Expected: only `check-counts` fails; lint and tests PASS; every grep matches.
- [ ] **Step 5: Commit** `feat(ops): workflow and phases 1-6`.

### Task 4: Utilities

**Files:**
- Create: `skills/ops-{incident-review,incident-response,alert-audit,error-budget,change-review}/SKILL.md`.
- Modify: restore `/ops-alert-audit` in `skills/ops-alerting/SKILL.md`.

- [ ] **Step 1: Write a frontmatter-only stub** of `ops-incident-review` and run `bun run lint:skills`. Expected: FAIL.
- [ ] **Step 2: Write `ops-incident-review`.**
  - Input: the timeline, chat log, alerts and notes the user supplies.
  - Impact, computed or `not measured`.
  - The timeline, with people by role **never by name**, even when the user names them.
  - Several contributing factors, each tied to a part of the system or process.
  - Where the system misled or failed the responders; human error is a **starting point** for asking why the system allowed it.
  - What went well.
  - Action items on the system or process, with owners and dates. Never retraining or discipline as the fix for a systemic gap.
  - Signs of a breach → stop and point to `/security-incident-response`.
  - Utility artifact `incidents/<date>-<slug>.md`, with hand-written frontmatter and log lines as `skills/sales-win-loss/SKILL.md` does.
  - Description includes "production outage or incident" and "postmortem", and `Not for project post-mortems; see /project-management-post-mortem.`
- [ ] **Step 3: Write the other four** per spec §4:
  - **Incident response:** chat only. Declare, severity, roles, stabilise first, recent changes first, the timeline, update cadence. Links `/support-incident-update` and `/security-incident-response`.
  - **Alert audit:** utility artifact `alerts/<date>-<slug>.md`. Actionable ratio per alert computed; keep, tune, demote or delete; pages with no runbook; pages per shift.
  - **Error budget:** chat only. Budget in time and requests, thresholds per window, budget consumed when each alert fires, time to exhaustion. Computed, or formulas without code.
  - **Change review:** stack-aware, chat only. Blast radius, budget status, rollback and its duration, flag or staged rollout, what to watch, and a go, go-with-conditions or wait call. `Not for code review; see /development-review.`
  - Then restore `/ops-alert-audit` in alerting.
- [ ] **Step 4: Generate** as in Task 3 Step 3. Run `bun run fix:skill-text` once more, then `git diff --stat skills/ops-incident-review skills/ops-alert-audit`. Expected: no change.
- [ ] **Step 5: Run checks:**
  - `bun run lint:skills`, then restore `site-data.json`
  - `bun run check` in `packages/pack-tools`
  - `grep -n "never by name" skills/ops-incident-review/SKILL.md; grep -n "starting point" skills/ops-incident-review/SKILL.md; grep -n "security-incident-response" skills/ops-incident-review/SKILL.md skills/ops-incident-response/SKILL.md`

  Expected: as in Task 3; every grep matches.
- [ ] **Step 6: Commit** `feat(ops): incident review, incident response, alert audit, error budget and change review utilities`.

### Task 5: Eval case

**Files:**
- Create: `evals/ops-incident-review/{prompt.md,case.yaml,scaffold.sh,graders/fired.md,graders/quality.md,fixtures/…}`.
- Modify: `packages/pack-tools/src/evals-dry.test.ts` (21 → 22).

- [ ] **Step 1: Change the test** to `22 case(s)` and run it. Expected: FAIL.
- [ ] **Step 2: Write the case** in `evals/sales-win-loss/`'s shape, with `runs: 3`.
  - Fixtures:
    - `incident-chat.md`: a timestamped chat log of a 40-minute outage. The engineer, named "Dave", runs `deploy migrate --env prod`, meaning staging. The tool accepts it with no confirmation. Errors start at 14:02, the alert fires at 14:14, and the rollback runbook step references a removed script. Other people help, and the fix is restoring from a snapshot.
    - `alerts.csv`: the alert history.
  - Prompt (no Bash; `allowed_tools: [Read, Glob, Grep, Skill]`): "Dave ran the wrong migration on prod and took us down for 40 minutes. The chat log and alerts are in this folder. Write up the incident review so we make sure he doesn't do it again. I won't be around to answer questions, so just give me the write-up here."
  - `quality.md` passes only if the review:
    - does not name Dave (or the engineer) as the cause, and does not make retraining, discipline or "be more careful" the fix;
    - names at least two system contributing factors from the log (same command for both environments with no confirmation, 12-minute detection delay, stale rollback runbook);
    - gives action items that change the system or process, with owners;
    - refers to the engineer by role rather than name;
    - states no duration or impact figure as computed by code.
- [ ] **Step 3: Run** the test and `bun run evals --dry`. Expected: PASS; `22 case(s)`.
- [ ] **Step 4: Commit** `test(evals): ops-incident-review case`.

### Task 6: Docs, bento, counts and prose

**Files:**
- Create: `apps/docs/content/docs/ops/{index,service-inventory,slos,alerting,runbooks,on-call,reliability-review,incident-review,incident-response,alert-audit,error-budget,change-review,artifacts,storage,examples}.mdx` and `meta.json`.
- Modify:
  - `apps/docs/content/docs/meta.json` (after `development`)
  - `apps/docs/lib/domains.ts`
  - `apps/docs/lib/site.test.ts`
  - comments in `apps/docs/lib/site.ts` and `apps/docs/components/home/ChromaBento.tsx` (36 cells, twenty-one tiles)
  - `apps/docs/public/llms.txt`
  - `apps/docs/content/docs/overview/{what-is-singularskills,comparisons,workflows,evals}.mdx`
  - `README.md` (row after Development: `[Operations](…/docs/ops) | Reliability Cycle | 11 | SLOs, alerting, runbooks, on-call and blameless incident reviews`)
  - `AGENTS.md`, `CLAUDE.md`
  - `.claude-plugin/{plugin,marketplace}.json`, `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `plugin.json`
  - `packages/pack-tools/src/smoke-install.test.ts`

- [ ] **Step 1: Tests first.**
  - `site.test.ts`:
    - orders 1..21;
    - sizes: 2 wide (design, development); half sorted `["accessibility", "marketing", "research", "security"]`; 14 small; 1 meta; 36 cells;
    - first five slugs unchanged;
    - `slugs.slice(5, 20)` sorted;
    - totals "338 skills across 21 domains".
  - `smoke-install.test.ts`: `codex: 338 skills`.
  - Run `cd apps/docs && bunx vitest run lib/site.test.ts`. Expected: FAIL.
- [ ] **Step 2: Update `domains.ts`.**
  - Import `Activity`.
  - Add the entry: slug `ops`, name `Operations`, methodology `Reliability Cycle`, colour `sky`, a `line-md` icon no other domain uses (check `@iconify-json/line-md`), a blurb in the house style, `bento: { order: 17, size: "small" }`.
  - Shift project-management to 18 and make it `small`; sales to 19, support to 20, singular to 21.
  - Run the scratchpad's `bento-clash.ts`. Expected: no clashes at six or two columns.
- [ ] **Step 3: Write the docs pages** in the formats of `apps/docs/content/docs/sales/`. `meta.json` icon `Activity`. Quote any description containing `: `.
- [ ] **Step 4: Update counts and prose.**
  - Every pack total 327/20 becomes 338/21 in the listed files (not CHANGELOG, not the `2.1.283` CLI pin).
  - The `llms.txt` Domains list gains `- Operations: …`.
  - The AGENTS.md domain sentence gains `ops`.
  - The overview tables gain alphabetical rows: workflows `ops | Reliability Cycle | 6`; evals `ops | ops-incident-review | the reply in the chat (no file)`.
  - Then `git ls-files | xargs grep -lE "327 skills|20 domains" | grep -v "CHANGELOG\|docs/superpowers"` returns nothing.
- [ ] **Step 5: Regenerate** in `apps/docs`: `gen:data`, `codemod`; then `bun run format`.
- [ ] **Step 6: Run the full suite:** `lint:skills`, `check:pack`, `SKIP_NETWORK_TESTS=1 bun run test`, `bun run check`, `cd apps/docs && bun run check`, `check-rename`, `evals --dry`, and the smoke test alone. Expected: all PASS.
- [ ] **Step 7: Commit** `docs(ops): operations section, sidebar, bento and pack totals`.

### Task 7: Acceptance runs and eval

**Files:**
- Create: `docs/superpowers/plans/2026-11-01-ops-domain-acceptance.md`.
- Scratch data in the session scratchpad:
  - a `checkout` service description;
  - an `AGENTS.md` whose Stack section names Prometheus and kubectl in its `rules`;
  - a synthetic 28-day SLI series and pages-per-shift data;
  - a 90-day alert export (40 alerts, some never acted on);
  - the eval fixture.

- [ ] **Step 1: Runs.** Use `claude -p … --plugin-dir <worktree> --strict-mcp-config --mcp-config '{"mcpServers":{}}' --allowedTools Read,Write,Edit,Glob,Grep,Skill,Bash --max-turns 40 < /dev/null`, with every prompt ending "I won't be around to answer questions".
  1. Phases 1–5 for `checkout`.
     - Expected: the Tooling section records Prometheus and kubectl; the budget is computed and the policy is a draft; alerts are burn-rate PromQL with page and ticket; every page names a runbook; runbook steps are marked **changes production** with rollback; on-call has a handoff checklist.
  2. Phase 3 in a project with only `01-inventory.md`.
     - Expected: the gate stops it.
  3. Phase 6 on the SLI data, then again.
     - Expected: attainment and budget computed and the policy action named; `06-review-<date>.md` kept on the re-run.
  4. `/ops-alert-audit` on the export.
     - Expected: actionable ratio per alert computed, with delete or demote calls.
  5. `/ops-incident-review` with Bash on the eval fixture.
     - Expected: no blame, system factors, roles not names.
  6. `/ops-error-budget` for 99.9% over 30 days, then for 99.5% over 28 days.
     - Expected: 43.2 minutes and 201.6 minutes; burn-rate thresholds and budget consumed per alert for each.
  7. `/ops-runbooks` in a project whose inventory has no tooling recorded.
     - Expected: **command to fill in**, and no invented commands.
- [ ] **Step 2: Record** each run (command, evidence, pass/fail) in the acceptance file. Fix any failing skill and re-run (RED = the failing run, GREEN = the rerun).
- [ ] **Step 3: Paid eval.** Run `EVALS_ALLOW_BASH=0 bun run evals ops-incident-review` and record with, without, delta, fired and cost. If the delta is 0, record it plainly; do not reshape the case to make the skill win.
- [ ] **Step 4: Commit** `docs(ops): acceptance record`.
