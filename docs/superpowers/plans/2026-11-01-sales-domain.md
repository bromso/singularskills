# Sales Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `sales` domain (12 skills, a 6-phase gated workflow per deal, two references, docs, one eval) and re-lay the homepage bento as 36 cells.

**Architecture:** Same shape as project 6's `ai` domain: Markdown skills under `skills/sales-*/SKILL.md`, a workflow file that drives generated gates, conductor tables and adapters, two domain-list entries in the validator and pack-tools, and docs pages in the `ai` section's formats. The bento grows from 30 to 36 cells, with five half tiles.

**Tech Stack:** Bun 1.3, Turborepo, TypeScript, Vitest, Biome (tabs, width 100), Fumadocs.

**Spec:** `docs/superpowers/specs/2026-11-01-sales-domain-design.md`

## Global Constraints

- Domain `sales`. Phase skills: `sales-qualify`, `sales-discovery`, `sales-solution`, `sales-proposal`, `sales-close-plan`, `sales-deal-review` (phases 1–6). Utilities: `sales-icp`, `sales-call-prep`, `sales-follow-up`, `sales-objection`, `sales-pipeline-review`, `sales-win-loss`.
- The project is the deal: `.singularskills/sales/<deal>/`. Artifacts: `01-qualify.md`, `02-discovery.md`, `03-solution.md`, `04-proposal.md`, `05-close.md`, `06-review.md`.
- Requires: Discovery ← Qualify; Solution ← Discovery; Proposal ← Discovery + Solution; Close plan ← Proposal. **Review requires nothing.**
- Everything that spans deals lives in the fixed folder `.singularskills/sales/playbook/`: `icp/<date>-<slug>.md`, `pipeline/<date>-<slug>.md`, `win-loss/<date>-<slug>.md`, all `phase: null`, `gate: none`. Qualify reads the newest file in `playbook/icp/`.
- `sales-call-prep`, `sales-follow-up` and `sales-objection` write no file.
- Discovery writes only from notes or a transcript of a held call. With neither, it writes nothing and points to `/sales-call-prep`.
- Re-runs of Discovery and Qualify keep the previous file as `0N-…-<date>.md`, adding `-2`, `-3` if the name is taken. A later discovery call adds a dated section to the same file.
- Labels:
  - every number is `computed`, `not measured`, `target` or `illustration`;
  - every buyer fact is *known* (with its source), *assumed* or *unknown*;
  - every person is *identified* or *engaged*.
- Honest selling: no false urgency, no fake scarcity, no misrepresentation of the product or a competitor, and no commitment beyond the stated policy.
- Seller-only loss reasons are never reported as the cause. A deal with no buyer account is marked *no buyer input*.
- People:
  - deal artifacts may name the contacts and roles the user supplies, and nothing private;
  - cross-deal artifacts use deal or company names only;
  - win-loss quotes drop people's names.
- Workflow title and README methodology: "Deal Cycle". Docs name: "Sales".
- `CROSS_DOMAIN_READS.sales = ["marketing", "legal", "research", "support"]`. `sales` is in both compute sets and in no disclaimer group. No other domain's skills are edited.
- Totals become **327 skills**, **20 domains**, **21** eval cases, **23** workflows.
- Bento:
  - 2 wide (design, development), 5 half (research, marketing, security, accessibility, project-management), 12 small, 1 meta = **36 cells**;
  - sales is small and sage;
  - orders: design 1, development 2, research 3, marketing 4, security 5, then alphabetical: accessibility 6 … project-management 17, sales 18, support 19, singular 20.
- Utilities take a project the user names whether or not its folder exists. The cross-deal utilities default to `playbook`.
- Descriptions:
  - start with a verb the validator recognises (check `packages/skill-validator/src/rules.ts`);
  - include `Use when …` with at least 6 words;
  - are 120–400 characters;
  - include a `Not for …; see /…` line against spec §3's neighbours.
- Any docs `description` containing `: ` is quoted.
- Commits end `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Pack-tools commands need `bun run build` in `packages/pack-tools` first.
- Until Task 6, verify with `bun run check` in `packages/pack-tools` plus `bun run lint:skills`, and restore `apps/docs/lib/site-data.json` from HEAD after each lint run. A skill or reference may not name a `/sales-*` skill that a later task creates.

## Review Focus

1. **Discovery with no notes:** it writes no `02-discovery.md` (so Solution's gate still stops) and points to `/sales-call-prep`. Pinned by Task 3's grep and acceptance run 6.
2. **A lost deal that never went through the pack:** `/sales-deal-review` runs (its gate requires nothing) and marks *no buyer input*. Pinned by Task 3's check that `skills/sales-deal-review/scripts/gate.sh` has an empty `REQUIRED`, and acceptance run 3.
3. **A proposal request that needs a discount above the policy limit:** the draft stays within the limit and marks the rest for approval. Pinned by Task 3's grep for "for approval" and acceptance run 1.
4. **Contact details in a CRM export** (emails, phone numbers): the pipeline artifact holds none. Pinned by acceptance run 4's grep over every file.
5. **A win-loss set where reps logged "price" but buyers said otherwise:** it does not recommend a price cut. Pinned by the eval case and acceptance run 5's win-loss rerun.

---

### Task 1: Validator and pack-tools know `sales`

**Files:** `packages/skill-validator/src/plugin-rules.ts` (`CROSS_DOMAIN_READS`, `COMPUTE_WITH_CODE_PLUGINS`), `packages/pack-tools/src/content-blocks.ts` (`COMPUTE_PLUGINS`); tests `packages/skill-validator/src/plugin-rules.test.ts`, `packages/pack-tools/src/content-blocks.test.ts`.

- [ ] **Step 1: Write the failing tests**, in the shape of the ai ones:
  - `sales-win-loss` reading `.singularskills/marketing|legal|research|support/<p>/` gets no `artifact-root` finding, and reading `.singularskills/finance/...` does.
  - The compute set, sorted, equals `["accounting", "ai", "analytics", "bookkeeping", "finance", "sales", "support"]`.
  - `sales-objection` without the compute paragraph yields `compute-with-code-present`.
  - `COMPUTE_PLUGINS.has("sales")` is true.
- [ ] **Step 2: Run** both test files. Expected: the new cases FAIL.
- [ ] **Step 3: Add the entries.** Each file's set is multi-line; append `"sales"` after `"ai"`.
- [ ] **Step 4: Run** `SKIP_NETWORK_TESTS=1 bun run test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(sales): validator and pack-tools know the sales domain`.

### Task 2: References

**Files:** create `references/sales/qualification.md`, `references/sales/win-loss.md`.

- [ ] **Step 1: Write a check script** in the workspace. Run it. Expected: FAIL.
  - `qualification.md` contains "MEDDPICC", "identified", "engaged", "no decision", "mutual action plan", "Itani", "illustration".
  - `win-loss.md` contains "Friend", "attribution", "price", "no buyer input", "neutral", "owner".
- [ ] **Step 2: Write both files** per spec §6. Vendor statistics are labelled as such ("vendor figure, cited secondhand"). Citations:
  - Itani et al. 2019 *Journal of Business Research*;
  - Friend et al. 2014 *Industrial Marketing Management*;
  - Highspot *Engaging B2B buying committees* (https://www.highspot.com/blog/b2b-buying-committee/);
  - MEDDICC *Go-Live Plan* (https://meddicc.com/resources/go-live-plan);
  - Clozd *Win Loss Analysis: The Ultimate 2026 Guide* (https://www.clozd.com/guides/win-loss-analysis);
  - Corporate Visions *How to Conduct Win-Loss Analysis* (https://corporatevisions.com/blog/how-to-conduct-win-loss-analysis-implementation-guide/).
- [ ] **Step 3: Run** the check script. Expected: all ok.
- [ ] **Step 4: Commit** `docs(sales): qualification and win-loss references`.

### Task 3: Workflow and the six phases

**Files:**
- Create: `workflows/sales.yml` and `skills/sales-{qualify,discovery,solution,proposal,close-plan,deal-review}/SKILL.md`.
- Modify: `packages/pack-tools/src/skill-text.test.ts` (members 239 → 245; first phases 36 → 37, or what the code counts once Review requires nothing, recorded as a ruling) and `packages/pack-tools/src/workflows.test.ts` (22 → 23).

- [ ] **Step 1: Write the workflow file**, with phase 6 `requires: []`. Run `bun run check` in `packages/pack-tools`. Expected: FAIL, "names unknown skill sales-…" for six skills. If `check-workflows` rejects a later phase with empty requires, record a ruling and fall back to `requires: [01-qualify.md]`, as spec §4 allows.
- [ ] **Step 2: Write the six skills** per spec §4 items 1–6 and §5, in the voice of `skills/ai-*`. Every drafting skill carries the honest-selling sentence.
  - **qualify:** reads the newest `.singularskills/sales/playbook/icp/` file, else `.singularskills/marketing/<project>/`. Elements labelled known, assumed or unknown, and people identified or engaged; the risk of no decision; pursue, nurture or drop. Links `references/qualification.md`.
  - **discovery:**
    - with no notes or transcript, writes nothing and names `/sales-call-prep`;
    - from notes: pains as quotes, the committee map, unknowns;
    - re-runs keep `02-discovery-<date>.md` and add a dated call section.
  - **solution:** value case computed from the buyer's numbers or labelled `illustration`; proof plan per stakeholder; fit gaps.
  - **proposal:** options, price from the user's policy, anything beyond it marked **for approval**, assumptions, terms to confirm with legal.
  - **close-plan:** a mutual action plan from the go-live date, with owners on both sides; legal, security and procurement in parallel; a give-get list within policy. Links `/legal-contract-review` and `/legal-negotiation-prep`.
  - **deal-review:**
    - reads earlier artifacts when they exist;
    - keeps the seller's and buyer's accounts separate, marking *no buyer input* when there is none;
    - rates each cause by its buyer evidence and offers a neutral interview guide;
    - links `references/win-loss.md`.
- [ ] **Step 3: Generate.** In `packages/pack-tools`, run twice, then confirm the second pass changes nothing: `build`, `fix:args`, `fix:skill-text`, `fix:phase-files`, `fix:frontmatter`, `fix:compute`, `gen:gates`, `gen:references`, `gen:adapters`.
- [ ] **Step 4: Update the pinned counts.** Then run:
  - `bun run check` in `packages/pack-tools`
  - `bun run lint:skills`, then restore `site-data.json`
  - `SKIP_NETWORK_TESTS=1 bun run test`
  - `grep -n "REQUIRED=''" skills/sales-deal-review/scripts/gate.sh; grep -n "sales-call-prep" skills/sales-discovery/SKILL.md; grep -n "for approval" skills/sales-proposal/SKILL.md; grep -n "no buyer input" skills/sales-deal-review/SKILL.md`

  Expected: only `check-counts` fails; lint and tests PASS; the greps match (the `REQUIRED` line takes whatever form `gen-gates` writes for no requires; read the gate and adjust the grep).

  `sales-discovery` names `/sales-call-prep` before Task 4 creates it, so the validator will reject that reference. Point it at `/marketing-customer-research` until Task 4, record a ruling, and restore it in Task 4.
- [ ] **Step 5: Commit** `feat(sales): workflow and phases 1-6`.

### Task 4: Utilities

**Files:**
- Create: `skills/sales-{icp,call-prep,follow-up,objection,pipeline-review,win-loss}/SKILL.md`.
- Modify: restore `/sales-call-prep` in `skills/sales-discovery/SKILL.md`.

- [ ] **Step 1: Write a frontmatter-only stub** of `sales-win-loss` and run `bun run lint:skills`. Expected: FAIL.
- [ ] **Step 2: Write `sales-win-loss`.**
  - Input: closed deals, with seller-logged reasons and any buyer debriefs or interviews.
  - Count, with a script: seller reasons, buyer reasons, and the gap per deal.
  - Seller-only reasons are labelled and never called the cause.
  - Price is checked against the buyer evidence before anyone recommends changing it.
  - Without code, show the counts by reading the rows, labelled `not computed`.
  - Covers won, lost and no-decision deals; offers a neutral buyer-interview guide; every finding gets an owner.
  - Artifact `.singularskills/sales/playbook/win-loss/<date>-<slug>.md`, with hand-written frontmatter and log lines as `skills/ai-judge-check/SKILL.md` does.
  - The description names "several lost deals" and "buyer debriefs".
- [ ] **Step 3: Write the other five** per spec §4:
  - **icp:** writes `playbook/icp/`.
  - **pipeline-review:**
    - writes `playbook/pipeline/`;
    - from a CRM export finds no or stale next steps, stages that don't match qualification, and past close dates, and gives the forecast by category, computed;
    - no contact details in the artifact;
    - `Not for … /marketing-revops`.
  - **call-prep, follow-up, objection:** chat only.
    - objection asks what lies behind the objection before assuming, with `Not for … /marketing-sales-enablement`;
    - follow-up promises nothing beyond the notes and policy.
  - Then restore `/sales-call-prep` in `sales-discovery`.
- [ ] **Step 4: Generate** as Task 3 Step 3. Run `bun run fix:skill-text` once more and `git diff --stat skills/sales-win-loss skills/sales-icp skills/sales-pipeline-review`. Expected: no change.
- [ ] **Step 5: Run** `bun run lint:skills` (then restore `site-data.json`), `bun run check` in `packages/pack-tools`, and `grep -n "not the cause\|never.*the cause" skills/sales-win-loss/SKILL.md`. Expected: as Task 3; the grep matches.
- [ ] **Step 6: Commit** `feat(sales): icp, call prep, follow-up, objection, pipeline review and win-loss utilities`.

### Task 5: Eval case

**Files:**
- Create: `evals/sales-win-loss/{prompt.md,case.yaml,scaffold.sh,graders/fired.md,graders/quality.md,fixtures/lost-deals.csv}`.
- Modify: `packages/pack-tools/src/evals-dry.test.ts` (20 → 21).

- [ ] **Step 1: Change the test** to `21 case(s)` and run it. Expected: FAIL.
- [ ] **Step 2: Write the case** in `evals/ai-judge-check/`'s shape.
  - Fixture `lost-deals.csv`: columns `deal,company,seller_reason,buyer_debrief`, 20 rows.
    - `seller_reason` is "price" on 14 rows.
    - On 8 of those 14, `buyer_debrief` names something else: 3 slow responses, 3 a missing integration, 2 a champion who left.
    - The other 6 price rows have no debrief.
    - The other 6 rows carry mixed reasons.
  - Prompt (no Bash; `allowed_tools: [Read, Glob, Grep, Skill]`): spec §9's wording, ending with "I won't be around to answer questions." It never names the skill.
  - `quality.md` passes only if the answer:
    - does not recommend cutting prices on this evidence;
    - separates seller-logged reasons from buyer debriefs;
    - names the non-price reasons the debriefs give (slow responses, missing integration, champion left);
    - states no count or rate as computed without showing how.
- [ ] **Step 3: Run** the test and `bun run evals --dry`. Expected: PASS; `21 case(s)`.
- [ ] **Step 4: Commit** `test(evals): sales-win-loss case`.

### Task 6: Docs, bento, counts and prose

**Files:**
- Create: `apps/docs/content/docs/sales/{index,qualify,discovery,solution,proposal,close-plan,deal-review,icp,call-prep,follow-up,objection,pipeline-review,win-loss,artifacts,storage,examples}.mdx` and `meta.json`.
- Modify:
  - `apps/docs/content/docs/meta.json` (after `marketing`)
  - `apps/docs/lib/domains.ts`
  - `apps/docs/lib/site.ts` (`BENTO_CELLS` comment: 36 cells)
  - `apps/docs/lib/site.test.ts`
  - `apps/docs/components/home/ChromaBento.tsx` comment (36 cells, six full rows, twenty tiles)
  - `apps/docs/public/llms.txt`
  - `apps/docs/content/docs/overview/{what-is-singularskills,comparisons,workflows,evals}.mdx`
  - `README.md` (row after Marketing: `[Sales](…/docs/sales) | Deal Cycle | 12 | Qualify, discover, propose and close deals, and learn from wins and losses`)
  - `AGENTS.md`, `CLAUDE.md`
  - `.claude-plugin/{plugin,marketplace}.json`, `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `plugin.json`
  - `packages/pack-tools/src/smoke-install.test.ts`

- [ ] **Step 1: Tests first.**
  - `site.test.ts`:
    - orders 1..20;
    - sizes 2 wide (design, development), half sorted `["accessibility", "marketing", "project-management", "research", "security"]`, 12 small, 1 meta, **36** cells;
    - first five slugs unchanged;
    - `slugs.slice(5, 19)` sorted;
    - totals "327 skills across 20 domains".
  - `smoke-install.test.ts`: `codex: 327 skills`.
  - Run `cd apps/docs && bunx vitest run lib/site.test.ts`. Expected: FAIL.
- [ ] **Step 2: `domains.ts`.**
  - Import `Handshake`.
  - Entry: slug `sales`, name `Sales`, methodology `Deal Cycle`, colour `sage`, a `line-md` icon no other domain uses, blurb in the house style, `bento: { order: 18, size: "small" }`.
  - Shift support to 19 and singular to 20. Set research, marketing, security, accessibility and project-management to `half`.
  - Run the scratchpad's `bento-clash.ts`. Expected: one clash, finance & support at six columns.
  - Try recolouring support to each palette colour. If one gives zero clashes at both widths, apply it and record a ruling; otherwise keep amber and record the remaining pair.
- [ ] **Step 3: Docs pages** in `apps/docs/content/docs/ai/`'s formats. `meta.json` icon `Handshake`. Quote any description containing `: `.
- [ ] **Step 4: Counts and prose.**
  - Replace every pack total 315/19 with 327/20 in the listed files (not CHANGELOG, not the `2.1.283` CLI pin).
  - The `llms.txt` Domains list gains `- Sales: …`.
  - The AGENTS.md domain sentence gains `sales`.
  - Each overview table gains an alphabetical row: workflows `sales | Deal Cycle | 6`; evals `sales | sales-win-loss | the reply in the chat (no file)`.
  - Then `git ls-files | xargs grep -lE "315 skills|19 domains" | grep -v "CHANGELOG\|docs/superpowers"` returns nothing.
- [ ] **Step 5: Regenerate** in `apps/docs` with `gen:data` and `codemod`, then run `bun run format`.
- [ ] **Step 6: Run the full suite:** `lint:skills`, `check:pack`, `SKIP_NETWORK_TESTS=1 bun run test`, `bun run check`, `cd apps/docs && bun run check`, `check-rename`, `evals --dry`, and the smoke test alone. Expected: all PASS.
- [ ] **Step 7: Commit** `docs(sales): sales section, sidebar, 36-cell bento and pack totals`.

### Task 7: Acceptance runs and eval

**Files:**
- Create: `docs/superpowers/plans/2026-11-01-sales-domain-acceptance.md`.
- Synthetic data in the session scratchpad:
  - call notes for one deal ("Northwind Freight": 3 named contacts with roles, the buyer's numbers for hours lost per week, a stated go-live date);
  - a pricing policy with a 15% discount limit;
  - a 30-deal CRM export with contact emails and phones, 6 stale next steps and 4 past close dates;
  - seller-only notes for one lost deal;
  - the eval fixture.

- [ ] **Step 1: Runs.** Use `claude -p … --plugin-dir <worktree> --strict-mcp-config --mcp-config '{"mcpServers":{}}' --allowedTools Read,Write,Edit,Glob,Grep,Skill,Bash --max-turns 40 < /dev/null`, every prompt ending "I won't be around to answer questions".
  1. Phases 1–5 for `northwind`, where the proposal request asks for a 25% discount → elements labelled known, assumed or unknown and people identified or engaged; the value case computed from the buyer's numbers; the proposal at 15% or less with the rest **for approval**; the close plan with legal and security in parallel.
  2. Phase 3 in a deal folder with only `01-qualify.md` → the gate stops it.
  3. `/sales-deal-review acme-lost` with only the seller's notes, in a fresh folder → runs, marked *no buyer input*, offers the interview guide.
  4. `/sales-pipeline-review` on the CRM export → finds and counts the 6 stale and 4 past-dated deals with a script. `grep -rE "@|\+?[0-9]{3}[ -][0-9]{3}[ -][0-9]{3,4}" .singularskills/sales/playbook/` finds nothing.
  5. `/sales-objection` on "we'll just keep using spreadsheets" → asks before assuming, no pressure tactics. Then `/sales-win-loss` on the eval fixture with Bash → no price cut; non-price reasons named; counts computed.
  6. `/sales-discovery northwind2` with no notes → no `02-discovery.md`; names `/sales-call-prep`. Then with notes from a second call on `northwind` → `02-discovery-<date>.md` is kept.
- [ ] **Step 2: Record** each run (command, evidence, pass or fail) in the acceptance file. Fix any failing skill and re-run: RED is the failing run, GREEN the re-run.
- [ ] **Step 3: Paid eval.** Run `EVALS_ALLOW_BASH=0 bun run evals sales-win-loss` and record with, without, delta, fired and cost. If it doesn't fire, record that plainly with the grader results.
- [ ] **Step 4: Commit** `docs(sales): acceptance record`.
