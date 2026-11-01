# Sales: design

Project 7 of the singularskills programme, and the fourth new domain after
`support`, `analytics` and `ai`. It is #4 of the domain shortlist saved on
2026-10-31. The owner skipped the brainstorm questions on 2026-11-01 and asked
for research through Consensus, Context7 and web search. Every decision below
is the controller's call unless marked *(owner)*, made from that research (§6),
the existing marketing and legal skills it must not duplicate, and the patterns
of the earlier domains.

## 1. Intent

The pack helps a company get ready to sell, but not help anyone sell. Marketing
covers team-level sales material (`/marketing-sales-enablement`: battle cards,
the objection guide), cold outbound (`/marketing-cold-email`), pipeline design
(`/marketing-revops`) and pricing (`/marketing-pricing-strategy`). Legal covers
contract review and negotiation prep. What is missing is the **individual
deal**: is this one worth pursuing, what does this buyer actually need, what do
we propose, how does it close, and why did it end the way it did.

The research says where deals go wrong:

- **Listening and adapting drive results.** A meta-analysis of about 20 years
  of research links salesperson listening to both relationship and sales
  outcomes, through adapting to what the buyer needs (Itani et al., 2019,
  *Journal of Business Research*).
- **Sellers misjudge why they lose.** Interviews with buyers after lost
  key-account proposals found the causes were adaptability, relationship
  potential and cost. The authors collected them from buyers because
  seller-reported reasons carry attribution bias (Friend et al., 2014,
  *Industrial Marketing Management*). Practitioner guides agree: "price" is
  the easy answer that ends an awkward conversation (Clozd, *Win Loss
  Analysis: The Ultimate 2026 Guide*; Corporate Visions, *How to Conduct
  Win-Loss Analysis*).
- **Complex deals are decided by a committee, and often by no one.** Buying
  groups of roughly 6–10 people are typical (Gartner, cited by Highspot,
  *Engaging B2B buying committees*). "No decision" is commonly called the
  biggest competitor; vendor sources put it at 40–60% of deals, citing CSO
  Insights secondhand. A stakeholder who is *identified* is not the same as
  one who is *engaged*.
- **Deals stall after the proposal** when nobody agreed the steps to
  signature with the buyer. A mutual action plan worked back from go-live,
  with legal, security and procurement running in parallel, is the
  recommended fix (MEDDICC, *Go-Live Plan*).

The `sales` domain gives a seller a gated workflow per deal, as in every
other domain. Each step writes a file with its reasons and open questions.
Six standalone skills cover the everyday moments: the ideal customer
profile, call prep, the follow-up email, answering one objection in a live
deal, a pipeline review, and a win-loss review across many deals.

Who runs it: a founder, account executive or small sales team selling B2B,
where deals involve more than one person on the buyer's side. *(Controller's
call: the owner skipped the question of who sells.)*

## 2. Goals

- A `sales` domain of **twelve skills**: six phase skills in a gated workflow
  and six utilities (§4).
- Tool-neutral documents like every other domain: no CRM binding, no network
  calls. Skills work from notes, transcripts, CRM exports and emails the user
  supplies.
- `workflows/sales.yml`, two references in `references/sales/`, docs,
  sidebar, `lib/domains.ts`, homepage bento (§7), and totals: 315 → **327
  skills**, 19 → **20 domains**, 20 → **21** eval cases, 22 → **23**
  workflows.
- One eval case that separates the skill from plain Claude (§9).

## 3. Non-goals and anti-goals

**Non-goals**

- **Team-level sales material:** battle cards and the objection-handling
  guide stay with `/marketing-sales-enablement`. `sales-objection` answers one
  objection in one live deal.
- **Prospecting at scale:** cold outbound stays with `/marketing-cold-email`.
- **Pipeline and funnel design:** stages, lead scoring and routing stay with
  `/marketing-revops`. `sales-pipeline-review` reviews the deals in a pipeline
  that already exists.
- **Pricing design:** list prices and packaging stay with
  `/marketing-pricing-strategy`. Proposals use the pricing and discount policy
  the user gives.
- **Contracts:** contract review and legal negotiation stay with
  `/legal-contract-review` and `/legal-negotiation-prep`. The close plan links
  them.
- **No CRM integration** and no change to any cross-domain workflow.

**Anti-goals** (a failure even if every check is green)

- **Invented buyer facts:** a buyer's need, number, quote, stakeholder or
  commitment stated as fact when the user never supplied it.
- **Pressure or deception:** manipulative tactics (false urgency, fake
  scarcity, misrepresenting the product or a competitor) in any draft.
- **Promises beyond policy:** a discount, term or delivery date the user's
  stated policy does not allow.
- **Seller reasons as truth:** a lost-deal reason recorded as the cause when
  only the seller supplied it.
- **Personal data beyond the deal:** contact details or private information
  about people copied beyond what the deal needs.

## 4. The skills

The domain is named `sales`: one word, so `HYPHENATED_DOMAINS` doesn't
change. The project is the deal, usually the buyer's company name, so a
deal's artifacts go in `.singularskills/sales/<deal>/`. The methodology name
is **Deal Cycle**.

### Workflow `sales` — "Deal Cycle"

| Phase | Title | Skill | Artifact | Requires |
| --- | --- | --- | --- | --- |
| 1 | Qualify | `sales-qualify` | `01-qualify.md` | — |
| 2 | Discovery | `sales-discovery` | `02-discovery.md` | `01-qualify.md` |
| 3 | Solution | `sales-solution` | `03-solution.md` | `02-discovery.md` |
| 4 | Proposal | `sales-proposal` | `04-proposal.md` | `02-discovery.md`, `03-solution.md` |
| 5 | Close plan | `sales-close-plan` | `05-close.md` | `04-proposal.md` |
| 6 | Review | `sales-deal-review` | `06-review.md` | `01-qualify.md` |

1. **Qualify** (`sales-qualify`):
   - Fit against the ideal customer profile (from `/sales-icp` when it
     exists, else from `.singularskills/marketing/` customer research, else
     from the user).
   - A MEDDPICC-style qualification, every element marked *known* (with its
     source), *assumed* or *unknown*: metrics, economic buyer, decision
     criteria, decision process, paper process, identified pain, champion,
     competition.
   - People marked *identified* or *engaged*, never just named.
   - The risk of no decision: what the buyer does if they do nothing.
   - A pursue, nurture or drop recommendation, with the gaps that would
     change it.
2. **Discovery** (`sales-discovery`). Two modes in one phase:
   - Before the call: a call plan with goals, open questions per
     qualification gap, and who should attend.
   - After the call, from notes or a transcript the user supplies: the
     buyer's pains, in their words and as quotes; metrics they gave; the
     decision criteria and process as stated; and the buying committee map
     (role, stance, identified or engaged).
   - Anything the buyer did not say stays *unknown*.
   - It plans questions that make the buyer talk: open, one at a time, and
     following up on their words rather than pitching.
3. **Solution** (`sales-solution`):
   - The value case, tied to the buyer's own metrics: any ROI or savings
     figure is computed with code from numbers the buyer supplied, or
     labelled an illustration.
   - What the buyer needs to see, per stakeholder: the demo or proof plan.
   - The fit gaps, stated honestly.
4. **Proposal** (`sales-proposal`):
   - The proposal draft: the buyer's situation in their words, scope,
     outcomes tied to their metrics, options (two or three where useful),
     price from the user's pricing and discount policy, assumptions, terms
     to confirm with legal, and next steps.
   - Never a discount or term outside the stated policy; anything else is
     marked for approval.
5. **Close plan** (`sales-close-plan`):
   - A mutual action plan worked back from the buyer's go-live date: every
     step with an owner on each side and a date, with legal, security review
     and procurement in parallel rather than at the end.
   - The risks to the date, and the give-get list for negotiation (what the
     seller may give, and what it asks for in return), within policy.
   - Links `/legal-contract-review` and `/legal-negotiation-prep`.
6. **Review** (`sales-deal-review`), after the deal is won, lost or ends in
   no decision:
   - The seller's account and the buyer's account kept separate. The buyer's
     comes from an interview, email or debrief the user supplies; with none,
     it is marked *no buyer input*.
   - The causes, rated by how well the buyer's own words support them.
   - What to repeat or change.
   - It requires only `01-qualify.md`, because a deal can end at any phase.
   - When the user wants buyer input, it drafts a short, neutral interview
     guide.

### Utilities (no phase, run alone)

- **`sales-icp`**:
  - The ideal customer profile and the qualification criteria, from the
    user's won and lost deals when they supply an export (fit and win rate
    by segment, computed with code) and from marketing's customer research.
  - Writes `.singularskills/sales/<project>/icp/<date>-<slug>.md`, where the
    project names the sales motion (for example `playbook`).
  - Not for buyer personas for marketing; see `/marketing-customer-research`.
- **`sales-call-prep`**:
  - Preparation for one upcoming call, from the deal's artifacts: goal,
    agenda, the attendees and what each cares about, questions for the open
    gaps, and the one next step to ask for.
  - Writes no file.
- **`sales-follow-up`**:
  - The follow-up email after a call, from the user's notes: what was heard,
    in the buyer's words; what was agreed; the next step with a date.
  - Promises nothing the notes and policy don't support.
  - Writes no file.
- **`sales-objection`**:
  - One objection in one live deal: what may lie behind it (asked, not
    assumed), questions to understand it, and a response grounded in the
    deal's facts.
  - Never deceptive or pressuring; links the team guide when it exists.
  - Writes no file. Not for the team's objection guide; see
    `/marketing-sales-enablement`.
- **`sales-pipeline-review`**:
  - From a CRM export: deals with no next step or a stale one, deals whose
    stage doesn't match their qualification, close dates in the past, and
    the forecast by category. Computed with code.
  - Writes `.singularskills/sales/<project>/pipeline/<date>-<slug>.md`.
  - Not for designing stages; see `/marketing-revops`.
- **`sales-win-loss`**:
  - Across many closed deals: reasons as the seller logged them against
    reasons from the buyer's side where the user supplies interviews or
    debriefs, and the gap between them, with counts computed with code.
  - Seller-only reasons are labelled as such and never reported as the cause.
  - It can draft a neutral buyer-interview guide.
  - Writes `.singularskills/sales/<project>/win-loss/<date>-<slug>.md`.

Descriptions follow the pack rule and carry `Not for …; see /…` lines against
§3's neighbours.

## 5. How the skills are written

As in `ai` and `analytics`:

- **Generated paragraphs.** For phase members, `pack-tools fix-skill-text`
  generates the handoff, recall, gate and log paragraphs.
- **Hand-written utility lines.** The three utilities that write files
  hand-write their frontmatter and log lines.
- **Project names.** The utilities take a project the user names whether or
  not its folder exists yet.
- **Compute with code.** `sales` joins `COMPUTE_PLUGINS` and its validator
  mirror (value cases, pipeline, win-loss).
- **Labels.** Every number is labelled `computed`, `not measured`, `target`
  or `illustration`.
- **Known, assumed or unknown.** Every qualification element and buyer fact
  is marked *known* (with its source), *assumed* or *unknown*.
- **People.** A deal's artifacts may name the buyer's contacts and their
  roles as the user supplies them (business contact data, kept to what the
  deal needs: no personal phone numbers, home details or private life).
  Cross-deal artifacts (pipeline, win-loss) use deal or company names and
  never contact details. Quotes in win-loss artifacts drop people's names.
- **Honest selling.** Every drafting skill says plainly: no false urgency, no
  fake scarcity, no misrepresentation of the product or a competitor, and no
  commitment beyond the stated policy.
- **Cross-domain reads.** `sales` joins `CROSS_DOMAIN_READS` with
  `["marketing", "legal", "research", "support"]`.

## 6. References (`references/sales/`)

- **`qualification.md`**:
  - The MEDDPICC elements with the known, assumed or unknown labels, the
    identified and engaged states, the buying committee (Highspot citing
    Gartner), and no decision as a competitor (labelled as a vendor statistic
    cited secondhand).
  - Discovery questioning: open questions, one at a time, follow up on the
    buyer's words, listen before pitching (Itani et al., 2019).
  - The mutual action plan (MEDDICC's Go-Live Plan).
  - The value case: compute from the buyer's numbers, or label it an
    illustration.
- **`win-loss.md`**:
  - Seller attribution bias and the buyer's view (Friend et al., 2014).
  - Price as the easy answer (Clozd; Corporate Visions).
  - Interviewing buyers soon after the decision, ideally by someone neutral.
  - Covering won, lost and no-decision deals.
  - Open "what" and "why" questions.
  - The gap between the seller's and the buyer's account as the main finding.
  - Every finding gets an owner.
  - Vendor statistics labelled as such.

Citations give author, year and venue, or title and URL for web sources.
Context7 holds no sales-methodology sources worth citing. It does list prior
art: *Sales Skills* (`louisblythe/sales-skills`), a library of 122 standalone
sales skills for Claude Code. Many of them are for building AI sales bots,
alongside call scripts, question lists and objection answers. This domain
differs on purpose: a gated workflow per deal, every buyer fact labelled known,
assumed or unknown, and win-loss that keeps the seller's view apart from the
buyer's. None of that pack's text is used.

## 7. Pack wiring

The `CLAUDE.md` "Adding a domain" steps, plus what projects 4–6 found:

- **Counts.** Pinned test counts move: phase members (+6), first phases (+1),
  workflows (22 → 23), site totals, smoke-install count, evals-dry count.
- **Prose totals.** README, CLAUDE.md, AGENTS.md (and its domain list), the
  manifests, `apps/docs/public/llms.txt` (totals and Domains list), and the
  overview pages (`what-is-singularskills`, `comparisons`, `workflows`,
  `evals`).
- **Homepage bento.** Today there are 2 wide, 16 small and 1 meta tile: 30
  cells, with no half tile left to shrink. A twentieth tile cannot fit in 30
  cells, so the grid grows to **36 cells, six full rows**. *Controller's
  call, from a search over every layout:*
  - **research, marketing and security** go back to half tiles, which
    restores the original story row;
  - **accessibility and project-management** become half tiles;
  - every other domain is small, and **sales is small, in sage**.
  - That gives 2 wide (12) + 5 half (10) + 12 small (12) + 1 meta (2) = 36.
    Rows are full at six and at two columns, and the first five tiles are
    unchanged (design, development, research, marketing, security).
  - It leaves **one** same-colour pair (finance & support, both amber, at six
    columns), down from four on main today. The builder may recolour support
    if a single colour removes that last clash without creating another
    (checked with the layout script).
  - The `site.test.ts` size and order tests change to match.
- **Docs frontmatter.** Quote any description containing `: `.

## 8. Docs

As `ai`: `apps/docs/content/docs/sales/` holds the overview, one page per
skill, and the artifacts, storage and examples pages. `meta.json` uses the
lucide icon `Handshake` (or `BadgeDollarSign` if that is missing); the
builder checks. In the root `meta.json`, `sales` goes after `marketing`.

## 9. Checks and acceptance

- Every check in `CLAUDE.md` passes.
- **Eval case** `evals/sales-win-loss/`, built so a baseline without the
  pack is likely to fail. It runs without Bash.
  - Scaffolded file: 20 lost deals. The seller-logged reason is "price" on
    14, but buyer debrief notes on 8 of them say something else: slow
    responses, a missing integration, a champion who left.
  - The prompt: "we keep losing on price — should we cut our prices?"
  - Graders:
    - the skill fired;
    - the answer does not recommend a price cut on this evidence;
    - it separates the seller-logged reasons from the buyer debriefs and
      names the non-price reasons;
    - it states no count or rate as computed without showing how.
- **Acceptance runs** in a scratch project with synthetic data, recorded in
  `docs/superpowers/plans/<plan>-acceptance.md`:
  1. Phases 1–5 for one deal from synthetic call notes.
     - Qualification elements are labelled known, assumed or unknown, and
       people identified or engaged.
     - The value case is computed from the buyer's numbers.
     - The proposal stays within a stated 15% discount limit.
     - The close plan runs legal and security in parallel.
  2. Phase 3 for a deal with only `01-qualify.md`: the gate stops it.
  3. `/sales-deal-review` on a lost deal with only the seller's notes:
     marked *no buyer input*, and it offers an interview guide.
  4. `/sales-pipeline-review` on a 30-deal CRM export: stale next steps and
     past close dates are found and counted with a script, and no contact
     details appear in the artifact.
  5. `/sales-objection` on "we'll just keep using spreadsheets": it asks
     before assuming, and the draft has no pressure tactics.

## 10. Left to the builder

The skills' wording, artifact section names beyond those listed, docs prose,
the icons, the eval graders, and the synthetic data. Where a choice here
fights a pack check, follow the check and record a ruling.
