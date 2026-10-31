# AI product and LLM features: design

Project 6 of the singularskills programme, and the third new domain after
`support` (project 4) and `analytics` (project 5). It is #2 of the domain
shortlist saved on 2026-10-31. This time the owner took the brainstorm
questions (2026-11-01). Decisions marked *(owner)* are theirs; everything else
is the controller's call, made from the research summarised in §6 (Consensus,
Context7 and a web search, run at the owner's suggestion) and from the
patterns of the earlier domains.

## 1. Intent

A product team adding an AI feature to its own product (a support chatbot, a
document summariser, search over its own content) has no structured way to go
from "we want an AI feature" to "we know it is good enough to ship, and we will
know if it gets worse". Research and practitioner writing agree on where teams
struggle:

- **Knowing whether it works.** Teams move from informal "vibe checks"
  towards systematic evaluation, and often gather evaluation data they cannot
  turn into improvements (van der Maden et al., 2026, *CHI*).
- **Plausible but wrong output.** Hallucination is the central risk, and
  teams rely on human checking to catch it (Huang et al., 2023, *ACM TOIS*).
- **Ad hoc prompts.** Prompt design is treated as trial and error, which makes
  outputs inconsistent and sensitive to wording (Debnath et al., 2026).
- **Checking costs what writing used to.** Effort moves from producing
  output to verifying it (Tabarsi et al., 2025, *Empirical Software
  Engineering*).

The `ai` domain gives that team a gated workflow whose heart is **designing
and building** the feature *(owner)*: define it, choose the approach, design
the prompt and context, design how it behaves for users when it is unsure or
wrong, specify the build, evaluate it on real outputs, decide whether to ship,
and monitor it. Each step writes a file with its reasons and open questions,
as every domain does. Four standalone skills cover the everyday moments:
review a prompt, plan attack tests, check an AI judge against human labels,
and compare models.

Who runs it: a product team adding an AI feature to its own product
*(owner)*: a product manager, an engineer, a designer, or a founder doing all
three.

## 2. Goals

- An `ai` domain of **twelve skills**: eight phase skills in a gated workflow
  and four utilities (§4).
- Tool-neutral documents like every other domain *(owner)*: no evaluation-tool
  configuration files (no promptfoo YAML or similar), no network calls, and no
  calls to any model API from a skill.
- `workflows/ai.yml`, two references in `references/ai/`, docs, sidebar,
  `lib/domains.ts`, homepage bento, and totals: 303 → **315 skills**, 18 →
  **19 domains**, 19 → **20** eval cases, 21 → **22** workflows.
- One eval case that separates the skill from plain Claude (§9).

## 3. Non-goals and anti-goals

**Non-goals**

- **The skills do not write the feature's code.** Phase 5 writes a build spec
  (prompt files, context and retrieval design, tool definitions, the test
  set) and hands it to `/development-plan`, then `/development-build`. The
  development domain writes the code. *(Controller's call; the owner's answer
  "looks good" did not choose between writing the code and handing it off.
  This is flagged for the owner in the hand-over.)*
- **The skills never run the AI feature or any model.** They work from the
  prompts, outputs, logs, test results and human labels the team supplies.
- **No regulatory assessment.** That is `/compliance-eu-ai-act`,
  `/compliance-nist-ai-rmf` and `/compliance-iso42001`; the Ship phase links
  them.
- **No general security testing programme.** That is
  `/security-security-testing`. The attack test plan here covers attacks on
  the model itself (prompt injection, jailbreaks, data leakage, acting outside
  its job).
- **No component or visual design.** That is the design domain. The
  Experience phase covers how the AI behaves for users.
- **No change to any cross-domain workflow.**

**Anti-goals** (a failure even if every check is green)

- A quality, accuracy or cost number stated as measured that was not computed,
  with a script, from outputs or labels the team supplied.
- Shipping guidance that lets a feature launch with no human review where its
  own evaluation says it fails.
- Prompts, outputs or logs copied into `.singularskills/` with users' personal
  data in them.
- A skill that duplicates one of the neighbours in the non-goals.

## 4. The skills

The domain is named `ai`: one word, so `HYPHENATED_DOMAINS` doesn't change.
Its artifacts go in `.singularskills/ai/<project>/`. Its methodology name is
**AI Feature Lifecycle**. The docs and README call it "AI Product".

### Workflow `ai` — "AI Feature Lifecycle"

| Phase | Title | Skill | Artifact | Requires |
| --- | --- | --- | --- | --- |
| 1 | Define | `ai-define` | `01-define.md` | — |
| 2 | Approach | `ai-approach` | `02-approach.md` | `01-define.md` |
| 3 | Prompt and context | `ai-prompt-design` | `03-prompt.md` | `01-define.md`, `02-approach.md` |
| 4 | Experience | `ai-experience` | `04-experience.md` | `01-define.md`, `02-approach.md` |
| 5 | Build | `ai-build` | `05-build.md` | `03-prompt.md`, `04-experience.md` |
| 6 | Evaluate | `ai-evaluate` | `06-evaluate.md` | `01-define.md`, `05-build.md` |
| 7 | Ship | `ai-ship` | `07-ship.md` | `06-evaluate.md` |
| 8 | Monitor | `ai-monitor` | `08-monitor.md` | `07-ship.md` |

1. **Define** (`ai-define`):
   - The job the feature does, for whom, and the moment they use it.
   - Whether AI is the right tool at all: a rule, a search or a form may do.
   - Success criteria, each phrased so a check could tell pass from fail.
   - The failure modes that matter: wrong, made up, unsafe, off-task, leaks
     data, too slow, too costly.
   - Budgets for latency and cost per use.
   - Reads `research`, `support` and `analytics` artifacts when present.
2. **Approach** (`ai-approach`):
   - The simplest approach that could meet the criteria, chosen from prompt
     only, retrieval over the team's content, tool use, or a multi-step agent,
     with why the simpler ones were not enough.
   - The data and tools it needs.
   - Criteria for choosing a model (quality on the task, cost, latency,
     context length, data handling); model names come from the team's
     shortlist.
3. **Prompt and context** (`ai-prompt-design`):
   - The system prompt draft and how context is assembled per request.
   - Examples, the output format, and refusal and uncertainty behaviour.
   - The defences against prompt injection: untrusted input kept apart from
     instructions, and the least privilege for tools.
   - Prompts are versioned like code, with changes reviewed and re-evaluated.
4. **Experience** (`ai-experience`), how the feature behaves for users:
   - telling users they are dealing with AI;
   - showing sources, and showing uncertainty;
   - how users correct it or undo what it did;
   - the fallback to a human or a non-AI path;
   - capturing feedback;
   - what happens when the model is slow or down.
5. **Build** (`ai-build`). The build spec: components, prompt files, the
   retrieval pipeline or tool definitions, configuration, logging needs, and
   the initial test set drawn from phase 1's failure modes. It hands off to
   `/development-plan`, then `/development-build`.
6. **Evaluate** (`ai-evaluate`). Error analysis first, as practitioners
   recommend:
   - Someone who knows the domain reads a sample of real outputs the team
     supplies (aim for about 100), notes problems, groups them and counts each
     group, computed with a script.
   - The top groups become checks: plain checks for clear-cut failures, an AI
     judge for judgement calls, pass/fail rather than scales.
   - Any AI judge is validated against human labels (`/ai-judge-check`).
   - Results are computed per check, with the sample size.
7. **Ship** (`ai-ship`):
   - The launch bar per check, and where human review stays.
   - The rollout (internal, then a small share of users, then everyone) and
     the kill switch.
   - Which compliance skills apply.
   - A launch, hold or fix decision against the bar, with the evidence.
8. **Monitor** (`ai-monitor`):
   - What to log (inputs, outputs, sources, feedback, cost, latency, with
     personal data handled).
   - The signals that trigger a look, and the error analysis repeated
     monthly.
   - A re-evaluation on every prompt or model change.
   - Cost and latency against budget.

### Utilities (no phase, run alone)

- **`ai-prompt-review`**:
  - Reviews one prompt for unclear or conflicting instructions, missing
    context, output-format gaps, and places where user input could override
    instructions.
  - Gives a rewritten version and the change list.
  - Writes no file.
- **`ai-red-team`**:
  - Writes an attack test plan against the feature: prompt injection (direct,
    and through retrieved content), jailbreaks, system-prompt and data
    leakage, and tool misuse.
  - Each attack comes with a test input and what a safe response looks like.
  - Writes `.singularskills/ai/<project>/red-team/<date>-<slug>.md`. Not for a
    security testing programme; see `/security-security-testing`.
- **`ai-judge-check`**:
  - Compares an AI judge's pass/fail verdicts against human labels the team
    supplies, computed with code: agreement, true-positive rate (the human's
    passes the judge also passes), true-negative rate (the human's fails the
    judge also fails), and the disagreements listed.
  - Says whether the judge can be trusted for this check, and how to fix the
    judge's prompt if not.
  - Writes `.singularskills/ai/<project>/judges/<date>-<slug>.md`.
- **`ai-model-compare`**:
  - Compares two or more models on the team's own test results for pass rate
    per check, cost per use and latency, computed with code.
  - Recommends one, with the trade-off stated.
  - Writes no file.

Descriptions follow the pack rule and carry `Not for …; see /…` against §3's
neighbours.

## 5. How the skills are written

As in `analytics`:

- **Generated paragraphs.** For phase members, `pack-tools fix-skill-text`
  generates the handoff, recall, gate and log paragraphs.
- **Hand-written utility lines.** The two utilities that write files
  hand-write their frontmatter and log lines.
- **Project names.** The utilities take a project the user names whether or
  not its folder exists yet (the rule project 5's review added).
- **Compute with code.** `ai` joins `COMPUTE_PLUGINS` and its validator mirror.
- **Labels.** Every number is labelled `computed`, `not measured` or `target`.
- **Aggregates only.** Scripts read the team's outputs and logs where the team
  keeps them, and write only aggregates under `.singularskills/`. Quoted
  outputs replace personal data with placeholders.
- **Cross-domain reads.** `ai` joins `CROSS_DOMAIN_READS` with `["research",
  "support", "analytics", "development", "compliance"]`.

## 6. References (`references/ai/`)

- **`evaluation.md`**: how to evaluate an AI feature.
  - Error analysis first: read about 100 real outputs, note, group and count.
    Practitioners report spending most evaluation time here and warn against
    handing it entirely to an LLM (Husain, *AI Evals FAQ*, 2026).
  - Then choose check types: plain checks for clear-cut failures, AI judges
    for subjective ones, pass/fail over 1–5 scores.
  - Validate the judge against human labels, and re-validate on a schedule.
  - Treat prompts as versioned code.
  - Start with human review everywhere and remove it only where the
    evaluation earns it.
  - The results-actionability gap (van der Maden et al., 2026), and how to
    avoid it: every check maps to a failure group and a fix owner.
  - Practitioners disagree on when to write evals. Some write them before
    building; others say failures cannot be predicted until real outputs
    exist. The domain writes an initial test set from phase 1's failure modes
    and grows it from error analysis.
- **`prompt-and-context.md`**: prompt and context design.
  - Instructions separate from untrusted input.
  - Examples, output formats, refusal and uncertainty instructions.
  - Retrieval: chunking, citing sources, what happens when nothing relevant
    is found.
  - Prompt injection, including through retrieved documents, and its
    defences: least privilege for tools, confirmation for actions with
    side effects, output checks.
  - The hallucination taxonomy in brief (Huang et al., 2023).

Citations give author, year and venue. Web sources give a title and URL. Both
files are linked from the skills that use them.

## 7. Pack wiring

The `CLAUDE.md` "Adding a domain" steps, plus what projects 4 and 5 found:

- Pinned test counts move: phase members (+8), first phases (+1), workflows
  (21 → 22), site totals, smoke-install count, evals-dry count.
- Prose totals change in README, CLAUDE.md, AGENTS.md (and its domain list),
  the manifests, `apps/docs/public/llms.txt` (totals and Domains list), and
  the overview pages (`what-is-singularskills`, `comparisons`, `workflows`,
  `evals`).
- **Homepage bento.** Today: 2 wide, 1 half (research), 14 small, 1 meta = 30
  cells. Adding a small tile makes 31. *Controller's call:* `ai` is
  **small** and research goes from half to small: 2 wide (12) + 16 small (16)
  + 1 meta (2) = 30 cells.
  - Six columns: rows of 6, 6 and 4 small tiles plus the meta tile.
  - Two columns: 16 small tiles pair evenly. With no half tile left, nothing
    can wrap.
  - The `site.test.ts` order test (first five tiles: design, development,
    research, marketing, security) still holds.
  - Colour: one that matches no tile touching `ai` at six or two columns,
    diagonals included.
  - Animated icon: a `line-md` icon no other domain uses.
- **Docs frontmatter.** Quote any `description` that contains `: `; the
  frontmatter test from project 5's follow-up enforces it.

## 8. Docs

As `analytics`: `apps/docs/content/docs/ai/` holds the overview, one page per
skill, and the artifacts, storage and examples pages. `meta.json` uses the
lucide icon `Sparkles` if no other domain uses it, else `Bot`; the builder
checks. In the root `meta.json`, `ai` goes after `analytics`.

## 9. Checks and acceptance

- Every check in `CLAUDE.md` passes.
- **Eval case** `evals/ai-judge-check/`, built so a baseline without the pack
  is likely to fail. It runs without Bash, like the others.
  - Scaffolded file: 40 rows of an AI judge's verdicts beside human labels.
    The judge agrees on 85% of rows overall, but passes nearly every row the
    human failed: high agreement, near-zero true-negative rate. The judge is
    not trustworthy.
  - The prompt asks "our judge agrees with us 85% of the time, can we use it?"
  - Graders:
    - the skill fired;
    - the answer does not approve the judge;
    - it names the failure on the human-failed rows (true-negative rate or
      equivalent);
    - it states no figure as computed without showing how.
  - Without code, the skill shows the counts per cell of the agreement table
    rather than computing rates mentally.
- **Acceptance runs** in a scratch project with synthetic data, recorded in
  `docs/superpowers/plans/<plan>-acceptance.md`:
  1. Phases 1–5 for a support-chatbot feature. Artifacts and log lines are
     written, and the gate passes. Phase 1 includes a "should this be AI at
     all" check. Phase 5 hands off to `/development-plan`.
  2. Phase 6 on 100 synthetic outputs with a seeded mix of failures (made-up
     policies, wrong tone, a leaked email address). The failure groups are
     counted with a script, and no personal data from the outputs appears in
     any file.
  3. Phase 7 before phase 6 exists: the gate stops it.
  4. `/ai-red-team` names indirect prompt injection through retrieved
     documents for a retrieval feature.
  5. `/ai-judge-check` on the eval fixture, with code: it reports the
     near-zero true-negative rate and does not approve the judge.

## 10. Left to the builder

The skills' wording, artifact section names beyond those listed, docs prose,
icons and colour, the eval graders, and the synthetic data. Where a choice
here fights a pack check, follow the check and record a ruling.
