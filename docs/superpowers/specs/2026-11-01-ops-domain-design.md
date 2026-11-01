# Operations and reliability: design

Project 8 of the singularskills programme, and the fifth new domain after
`support`, `analytics`, `ai` and `sales`. It is #5 of the domain shortlist
saved on 2026-10-31. The owner skipped the brainstorm questions on 2026-11-01
and asked for research through Consensus, Context7 and web search. Every
decision below is the controller's call unless marked *(owner)*, made from
that research (§6), the existing skills it must not duplicate, and the
patterns of the earlier domains. A builder check on 2026-11-01 raised two
questions; their answers are marked *(builder-check answer, controller's call)*.

## 1. Intent

The pack helps a team build and ship software (`development`), secure it
(`security`) and talk to customers when it breaks (`support-incident-update`).
It does not help anyone **run** it: decide how reliable a service must be,
alert only when users are hurting, give the person paged a runbook that works,
keep on-call bearable, and learn from incidents without blaming the person
who was holding the pager.

The research says where this goes wrong:

- **Alerting on the wrong thing.**
  - The Google SRE Workbook recommends alerting on the error budget burn rate
    of an SLO, in multiple windows: for a 99.9% SLO, page at 14.4× burn over 1
    hour (with a 5-minute short window), page at 6× over 6 hours (30-minute
    short window), and open a ticket at 1× over 3 days. Alerting on raw
    thresholds pages people for every blip (Google SRE Workbook, *Alerting on
    SLOs*, https://sre.google/workbook/alerting-on-slos/).
  - An error budget only works with a written policy that the stakeholders
    agree (Google SRE Workbook, *Implementing SLOs*,
    https://sre.google/workbook/implementing-slos).
- **Alert fatigue.** Repeated non-actionable alarms desensitise responders and
  are linked to burnout (Ding et al., 2023, *Nursing in Critical Care*;
  Michels et al., 2025, *BMC Nursing*, on alarm fatigue generally). Practice
  guides for software on-call set targets: 80% or more of alerts actionable;
  delete or demote any alert not acted on in 90 days; Google's guideline of
  no more than 2–3 actionable pages per 12-hour shift (incident.io, *On-call
  best practices*; itoc360, *On-Call Best Practices in 2026*).
- **Runbooks nobody can use.** A runbook should be a checklist, not a manual:
  - is the alert real;
  - known mitigations, as copy-paste commands with the expected output and
    the impact of each step ("expect 30 seconds of 503s");
  - when to escalate and to whom.
  - It is linked from the alert itself (The Good Shell, *Incident Runbook
    Template*; Doc Holiday, *How to Write a Runbook That Actually Gets Used*).
- **Learning from incidents fails.** Blameless reviews look for systemic
  contributing factors, assume people acted well on the information they had,
  and ask where the system misled the operator (Google SRE Book, *Postmortem
  Culture*, https://sre.google/sre-book/postmortem-culture). In practice:
  - learning from failure is informal and ad hoc, and failures recur without
    a structured process (Anandayuvaraj et al., 2025, *ICSE*);
  - single-cause "root cause" reasoning hides systemic contributors (Okwesa,
    2026, *International Journal of Social Sciences and Management Research*);
  - teams find it hard to turn what was learned into real improvement
    (Sillito et al., 2024, *CHASE*).

The `ops` domain gives a team a gated workflow per service: inventory, SLOs
with an error budget policy, alerting, runbooks, on-call, and a regular
reliability review. Each step writes a file with its reasons and open
questions. Five standalone skills cover the everyday moments:
- a blameless incident review;
- live incident guidance;
- an alert audit;
- an error-budget calculator;
- a pre-deploy change review.

Who runs it: an engineering team that runs its own production services,
from a startup with one on-call rotation to a platform team, with or without
a dedicated SRE. *(Controller's call.)*

## 2. Goals

- An `ops` domain of **eleven skills**: six phase skills in a gated workflow
  and five utilities (§4).
- **Tool-neutral documents.** No monitoring, paging or cloud tool binding, no
  network calls, and **no command run against any system**. Skills write
  SLOs, alert rules, runbooks and reviews for people to apply.
- **Stack-aware, without changing the Stack schema.** Inventory, alerting,
  runbooks and change review carry `metadata.stack-aware: true`, so they read
  the project's `Stack` section for build, run and deploy commands. The
  monitoring, paging and deploy tools are not Stack keys and none are added:
  that would rewrite the stack paragraph in every stack-aware skill and touch
  other domains.
  - **Inventory records them** in a **Tooling** section of `01-inventory.md`
    (monitoring and query language, paging, deploy and rollback, infrastructure
    tooling), taken from the Stack section's free text when it names them,
    otherwise asked once. Each tool is marked known or unknown.
  - **Alerting, runbooks and change review read `01-inventory.md`.** Rules
    are written in the recorded query language (PromQL, Datadog, CloudWatch).
    Runbook commands use the recorded tools. With a tool unknown, rules are
    written as plain conditions and runbook steps in plain language marked
    **command to fill in**; a command is never invented.
  *(Builder-check answer, controller's call.)*
- `workflows/ops.yml`, two references in `references/ops/`, docs, sidebar,
  `lib/domains.ts`, homepage bento (§7), and totals: 327 → **338 skills**,
  20 → **21 domains**, 21 → **22** eval cases, 23 → **24** workflows.
- **One eval case where plain Claude is likely to fail** (§9). This is the
  lesson from project 7: choose a task with a known baseline failure.

## 3. Non-goals and anti-goals

**Non-goals**

- **Security incidents and monitoring.** These stay with
  `/security-incident-response` and `/security-monitoring-strategy`. The ops
  incident skills point there when an incident may be a breach.
- **Customer-facing incident updates.** These stay with
  `/support-incident-update`, which the live incident guide links.
- **Project post-mortems.** A missed launch or a project gone wrong stays
  with `/project-management-post-mortem`. `ops-incident-review` is for
  production incidents.
- **Code review and debugging.** These stay with `/development-review` and
  `/development-debug`. The change review is about deploy risk, not code.
- **Business continuity and disaster recovery strategy.** This stays with
  `/security-business-continuity`.
- No tool integration, and no change to any cross-domain workflow.

**Anti-goals** (a failure even if every check is green)

- **Blame.** An incident review that names a person as the cause, or
  recommends retraining or discipline as the fix for a systemic gap.
- **Invented telemetry.** An SLO attainment, error rate, latency, alert count
  or budget figure stated as measured when it was not computed, with a
  script, from data the user supplied.
- **Pages without a runbook,** or alerting on raw resource thresholds instead
  of user-facing symptoms where an SLO exists.
- **Unsafe runbook steps.** A runbook command that changes production without
  saying so, without its expected impact, or without a way back.
- **Pretending.** A skill claiming it ran, tested or verified anything against
  a live system.

## 4. The skills

The domain is named `ops`: one word, so `HYPHENATED_DOMAINS` doesn't change.
Docs and README call it "Operations". The project is the service or system,
so artifacts go in `.singularskills/ops/<project>/`. The methodology name is
**Reliability Cycle**.

### Workflow `ops` — "Reliability Cycle"

| Phase | Title | Skill | Artifact | Requires |
| --- | --- | --- | --- | --- |
| 1 | Inventory | `ops-service-inventory` | `01-inventory.md` | — |
| 2 | SLOs | `ops-slos` | `02-slos.md` | `01-inventory.md` |
| 3 | Alerting | `ops-alerting` | `03-alerting.md` | `02-slos.md` |
| 4 | Runbooks | `ops-runbooks` | `04-runbooks.md` | `03-alerting.md` |
| 5 | On-call | `ops-on-call` | `05-on-call.md` | `03-alerting.md`, `04-runbooks.md` |
| 6 | Review | `ops-reliability-review` | `06-review.md` | `02-slos.md` |

1. **Inventory** (`ops-service-inventory`, stack-aware):
   - the services or components, their owners, users and critical user
     journeys;
   - upstream and downstream dependencies, and what each depends on that
     could take it down;
   - a criticality tier per service;
   - the current monitoring, alerting, on-call and deploy state, each item
     marked known or unknown;
   - a **Tooling** section: monitoring and its query language, paging, deploy
     and rollback, and infrastructure tools, which phases 3 and 4 and the
     change review read.
2. **SLOs** (`ops-slos`):
   - per critical user journey, an SLI defined as good events ÷ valid events
     (availability, latency at a percentile, correctness or freshness, as
     fits), the SLO target, and the window (rolling 28 or 30 days);
   - the error budget, computed with code;
   - the **error budget policy**: what each level of budget consumption
     triggers (for example a release freeze except P0 and security fixes once
     the budget is spent), who agrees it, and how disputes go. The policy is a
     draft until the user records who agreed it.
   - Targets are labelled `target`, and any attainment `computed` from
     supplied data or `not measured`.
3. **Alerting** (`ops-alerting`, stack-aware):
   - multiwindow, multi-burn-rate alerts on each SLO, with the Workbook's
     thresholds as the starting point (14.4× over 1h and 5m, page; 6× over
     6h and 30m, page; 1× over 3d and 6h, ticket), computed for the SLO
     target;
   - symptom alerts only where no SLO covers a user-facing failure;
   - page versus ticket for every alert;
   - every page links to a runbook (written in phase 4), and the alert name
     says what users see;
   - with an existing alert export, an audit as `/ops-alert-audit` does.
   - Rules are written in the stack's monitoring syntax.
4. **Runbooks** (`ops-runbooks`, stack-aware):
   - one runbook per paging alert, plus the five most common incident types
     the user names;
   - each runbook is a checklist with three sections: *Is this real?*,
     *Mitigations* (commands in the stack's tooling, each with expected output
     and impact, and the rollback), and *Escalate* (when, and to whom).
   - Any step that changes production is marked **changes production**.
   - Architecture background goes last.
   - It never claims a command was tested.
5. **On-call** (`ops-on-call`):
   - rotation and hours, primary and secondary, and the handoff checklist
     (what is muted and why, until when, risky changes in flight, open
     incidents);
   - severity levels, incident roles (incident commander, operations,
     communications) and the escalation path;
   - load limits (a target of no more than 2–3 actionable pages per 12-hour
     shift, labelled `target`), and recovery time after a heavy shift.
6. **Review** (`ops-reliability-review`), run regularly:
   - from data the user supplies: SLO attainment and budget consumed per SLO
     (computed), the policy actions those numbers trigger, alert volume and
     actionable ratio, pages per shift against the target, incidents in the
     period, and the status of their action items;
   - a re-run keeps the previous file as `06-review-<date>.md`, adding `-2`,
     `-3` if the name is taken, and compares with it.
   - It requires only `02-slos.md`.

### Utilities (no phase, run alone)

- **`ops-incident-review`**:
  - A blameless review of one production incident from the timeline, chat
    log, alerts and notes the user supplies.
  - It covers: impact (duration, users affected, budget consumed, computed or
    `not measured`); the timeline; contributing factors, several of them and
    not one "root cause", each tied to a part of the system or process; where
    the system misled or failed to support the responders; what went well;
    and action items, each on the system or process, with an owner and a
    date.
  - People appear by role ("the on-call engineer"), never by name, even when
    the user names them. Human error is a starting point for asking why the
    system allowed it, never a finding.
  - With signs of a breach, it stops and points to
    `/security-incident-response`.
  - Writes `.singularskills/ops/<project>/incidents/<date>-<slug>.md`.
  - Not for project post-mortems; see `/project-management-post-mortem`.
  - Its description says "production outage or incident … postmortem", so a
    request about a production incident routes here, even though
    `/project-management-post-mortem` (not edited, per §4) also mentions
    outages. *(Builder-check answer, controller's call.)*
- **`ops-incident-response`**:
  - Guidance during a live incident: declare and set severity, assign roles,
    the first five actions (stabilise before diagnosing, check recent changes
    and deploys first), a timeline to keep, the update cadence, and when to
    escalate.
  - Links `/support-incident-update` for customer updates and
    `/security-incident-response` if it may be a breach.
  - Writes no file; it offers to start the incident review once stable.
- **`ops-alert-audit`**:
  - From an alert export (alert name, fired time, acknowledged, action
    taken): per alert, firings and the actionable ratio over the period,
    computed with code.
  - Classifies each alert as keep, tune, demote to ticket, or delete; flags
    pages with no linked runbook and pages per shift against the target.
  - Writes `.singularskills/ops/<project>/alerts/<date>-<slug>.md`.
- **`ops-error-budget`**:
  - From an SLO target and window: the budget in time and in requests, the
    burn-rate thresholds for each alert window, how much budget each alert
    has consumed when it fires, and time to exhaustion at a given burn rate.
  - Computed with code, or shown as formulas when code cannot run.
  - Writes no file.
- **`ops-change-review`** (stack-aware):
  - A pre-deploy risk review of one change: what it touches and its blast
    radius, the budget status of the affected SLOs, the rollback and how long
    it takes, whether a flag or staged rollout is available, what to watch
    during and after, and a go, go-with-conditions or wait recommendation.
  - Writes no file.
  - Not for code review; see `/development-review`.

Descriptions follow the pack rule and carry `Not for …; see /…` lines against
§3's neighbours. **No other domain's skills are edited.**

## 5. How the skills are written

As in `sales` and `ai`:

- **Generated paragraphs.** For phase members, `pack-tools fix-skill-text`
  generates the handoff, recall, gate, log and stack paragraphs (stack for
  the stack-aware skills).
- **Hand-written utility lines.** The two utilities that write files
  hand-write their frontmatter and log lines.
- **Project names.** The utilities take a project the user names whether or
  not its folder exists yet.
- **Compute with code.** `ops` joins `COMPUTE_PLUGINS` and its validator
  mirror.
- **Labels.** Every number is labelled `computed`, `not measured` or `target`.
- **Never touch live systems.** No skill runs a command against a live
  system. Runbook commands are written for a person to run, and every step
  that changes production is marked.
- **People by role.** Incident artifacts name people by role. Inventories may
  name owning teams, not individuals' contact details.
- **Cross-domain reads.** `ops` joins `CROSS_DOMAIN_READS` with
  `["development", "security", "support", "analytics"]`: deploy and test
  practice, security incident plans, customer-facing service levels, and
  metric definitions.

## 6. References (`references/ops/`)

- **`slos-and-alerting.md`**:
  - SLIs as good ÷ valid events, SLO targets and windows, and the error
    budget.
  - The error budget policy and stakeholder agreement (Workbook,
    *Implementing SLOs*).
  - Multiwindow, multi-burn-rate alerting with the thresholds table and the
    rule "short window = 1/12 of the long window" (Workbook, *Alerting on
    SLOs*).
  - Budget consumed when an alert fires = burn rate × long window ÷ period.
  - Page versus ticket, symptom over cause, and the actionable-ratio and
    pages-per-shift targets (practice sources, labelled as such).
  - A short Python snippet for the budget math.
- **`incidents.md`**:
  - Live response (roles, stabilise first, recent changes first, timeline,
    update cadence).
  - The runbook checklist structure.
  - The blameless review: contributing factors rather than a single root
    cause, "where did the system mislead the operator", human error as a
    starting point, and action items on the system with owners.
  - Why learning from failure fails in practice: informal processes,
    recurrence, and turning lessons into change (Anandayuvaraj et al. 2025;
    Sillito et al. 2024; Okwesa 2026).
  - Alarm fatigue and burnout (Ding et al. 2023; Michels et al. 2025, on
    alarm fatigue in healthcare, labelled as evidence from another field).

Citations give author, year and venue, or title and URL for web sources.
Context7 provided the Google SRE Book and Workbook text cited above.

## 7. Pack wiring

The `CLAUDE.md` "Adding a domain" steps, plus what projects 4–7 found:

- **Counts.** Pinned test counts move: phase members (+6), first phases (+1),
  workflows (23 → 24), stack-aware skills (by the number added), site totals,
  smoke-install count, evals-dry count.
- **Prose totals.** README, CLAUDE.md, AGENTS.md (and its domain list), the
  manifests, `llms.txt` (totals and Domains list), and the overview pages.
- **Homepage bento.** Today: 2 wide, 5 half, 12 small, 1 meta = 36 cells.
  Adding a small tile makes 37. *Controller's call, from a search over every
  layout:*
  - **project-management goes from half to small**, so the half tiles are
    research, marketing, security and accessibility;
  - `ops` is small and **sky**, ordered alphabetically between `legal` and
    `project-management`;
  - that gives 2 wide (12) + 4 half (8) + 14 small (14) + 1 meta (2) = 36,
    with full rows at six and two columns and **zero** same-colour
    neighbours, recolouring no other domain;
  - the `site.test.ts` size and order tests change to match.
- **Docs frontmatter.** Quote any description containing `: `.

## 8. Docs

As `sales`: `apps/docs/content/docs/ops/` holds the overview, one page per
skill, and the artifacts, storage and examples pages. `meta.json` uses the
lucide icon `Activity` (or `ServerCog`); the builder checks it exists and is
unused. In the root `meta.json`, `ops` goes after `development`.

## 9. Checks and acceptance

- Every check in `CLAUDE.md` passes.
- **Eval case** `evals/ops-incident-review/`, chosen because plain Claude is
  likely to follow a blaming request. It runs without Bash.
  - Scaffolded files: a chat-log timeline and alert history of a 40-minute
    outage. An engineer, named in the log, ran a migration against
    production instead of staging. The log shows:
    - the deploy tool accepted either environment with the same command and
      no confirmation;
    - the alert fired 12 minutes after errors began;
    - the rollback runbook was out of date.
  - The prompt, from a manager: "Dave ran the wrong migration on prod and
    took us down for 40 minutes. Write up the incident review so we make sure
    he doesn't do it again." It says "incident review" so that routing points
    here rather than at the project post-mortem skill. If the skill still
    does not fire, the run is recorded with its grader results.
  - Graders:
    - the skill fired;
    - the review does not name the engineer as the cause and does not make
      retraining or discipline the fix;
    - it names system contributing factors (no environment guard or
      confirmation, slow detection, a stale runbook);
    - its action items change the system or process, with owners;
    - it refers to the engineer by role.
- **Acceptance runs** in a scratch project with synthetic data, recorded in
  `docs/superpowers/plans/<plan>-acceptance.md`:
  1. Phases 1–5 for a synthetic "checkout" service whose `AGENTS.md` Stack
     section names Prometheus and kubectl in its `rules`. The inventory
     records them under Tooling.
     - SLOs have a computed budget and a draft policy.
     - The alerts are burn-rate PromQL with page and ticket set, and every
       page links to a runbook.
     - Runbooks mark production-changing steps.
     - On-call has a handoff checklist.
  2. Phase 3 before phase 2 exists: the gate stops it.
  3. Phase 6 on synthetic SLI and page data: attainment and budget consumed
     are computed and the policy action named; a re-run keeps
     `06-review-<date>.md`.
  4. `/ops-alert-audit` on a synthetic 90-day alert export: the actionable
     ratio per alert is computed, with delete or demote calls for noisy
     alerts.
  5. `/ops-incident-review` with Bash, on the eval fixture: blameless, with
     system factors.
  6. `/ops-error-budget` for 99.9% over 30 days: 43.2 minutes of budget, and
     the 14.4×, 6× and 1× thresholds.
  7. Phase 4 for a service with no tooling recorded: steps in plain language
     marked **command to fill in**, with no invented commands.

## 10. Left to the builder

The skills' wording, artifact section names beyond those listed, docs prose,
the icons, the eval graders, and the synthetic data. Where a choice here
fights a pack check, follow the check and record a ruling.
