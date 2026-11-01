# Sales domain: acceptance record

Plan: `2026-11-01-sales-domain.md`. Spec: `docs/superpowers/specs/2026-11-01-sales-domain-design.md` §9. Branch `sales-domain`, verified 2026-11-01 on macOS with Claude Code. The pack was loaded from this worktree with `--plugin-dir`, with no MCP servers (`--strict-mcp-config --mcp-config '{"mcpServers":{}}'`), `--allowedTools Read,Write,Edit,Glob,Grep,Skill,Bash` and `--max-turns 40`. Every prompt ended "I won't be around to answer questions".

Data, all synthetic:
- **Two call-note files for "Northwind Freight".** The contacts are an ops director, a head of planning and a CFO named on the second call. The notes give 4 planners × 8 hours a week at £38 an hour and a stated go-live date.
- **A pricing policy:** 15% discount without approval; more needs the Sales Director.
- **A 30-deal CRM export** with invented contact names, emails and phone numbers, 6 next steps in the past and 4 close dates in the past.
- **The seller's notes on a lost deal** ("Acme Tools").
- **The eval fixture** `lost-deals.csv`.

## Runs

| # | Run | Result | Evidence |
| --- | --- | --- | --- |
| 1 | `/sales-qualify northwind` through `/sales-close-plan northwind`, with a 25% discount request | Pass | All five artifacts were written, each with started and finished log lines. `01-qualify.md` has 35 known, assumed or unknown labels and 12 identified or engaged labels. The value case computes the cost of the problem from Northwind's own figures ("about £58,000 to £63,000 a year") and labels the savings an **illustration**, because what the product saves is not measured. The proposal applies 15%, and Priya's 25% request is under **For approval** ("Sam's limit is 15%; anything more goes to Maria"). The close plan says "Security (7 → 14 → 17), legal (11 → 18) and budget (5) run in parallel". |
| 2 | `/sales-solution northwind` in a deal folder with only `01-qualify.md` | Pass | `gate: northwind needs 02-discovery.md first`. The refusal was logged and nothing else was written. The run declined to treat "go with what's here" as `--skip-checks`. |
| 3 | `/sales-deal-review acme-lost` with only the seller's notes, in a fresh folder | Pass | The review ran with no gate and no earlier artifacts. It is marked **no buyer input**. Price and the security delay are both rated "seller-reported only", and "Price is not reported as the cause". It offers a buyer interview guide: "the review's main action is a buyer interview, run by someone other than you … I wrote the interview guide". |
| 4 | `/sales-pipeline-review crm-export.csv` | Pass | It counted, with a script, 6 next steps in the past and 4 close dates in the past, and showed what share of the commit forecast passes every check. It said two checks were not possible because the columns are missing. `grep -rE "@\|\+44 ?7700\|Person [0-9]"` over `playbook/` finds nothing. |
| 5a | `/sales-objection` on "we'll just keep using spreadsheets" | Pass | It lists possible concerns, each marked **possible**, with questions to ask first ("Don't answer this yet. Find out which concern it is first"). There are no pressure tactics. It said plainly that no Northwind record existed in this folder. |
| 5b | `/sales-win-loss lost-deals.csv`, with Bash | Pass | "Don't cut prices on this evidence." It names missing integrations (3), slow responses (3) and a champion who left (2), and says none of the 11 debriefs mentions price. |
| 6 | `/sales-discovery hollis` with no notes, then a second Northwind call | Pass | Hollis: "I didn't write `02-discovery.md` for Hollis, because the call hasn't happened yet", and it pointed to `/sales-call-prep hollis`. It also noticed that the test setup had copied Northwind's qualification into the Hollis folder. Northwind's second call kept `02-discovery-2026-11-01.md`. |

## Paid eval

`EVALS_ALLOW_BASH=0 bun run evals sales-win-loss`:

| run | with | without | delta | fired | cost |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.5 | 0 | 0.5 | 1/2 | $0.67 |
| 2, after making grader 4 explicit | 1 | 1 | 0 | 2/2 | $0.84 |
| 3, redesigned case (follow-up), 3 runs per arm | 1 | 1 | 0 | 1/3 | $1.07 |

- **Run 1.** The run that used the skill failed all three judge votes on an answer that meets every criterion as written. The judge's reasons were not kept. The with-skill run in which the skill did not fire passed.
- **The grader fix.** Grader 4 was ambiguous about a script the model wrote but could not run, and now says so explicitly.
- **Run 2.** In 2 runs per arm, the case did **not** separate the skill from plain Claude (n=2 proves neither separation nor its absence). With the seller's reasons and the buyer debriefs side by side in one file, plain Claude also declines the price cut. Redesigning the case so the buyer evidence is not laid out next to the seller's reasons is deferred to the follow-up, as was done for `support-reply`.

## Follow-up: redesigned case (run 3)

The follow-up split the evidence the way teams usually hold it:
- `lost-deals.csv` holds only the reasons reps logged.
- `debriefs/` holds ten buyer notes, one file per company rather than per deal ID. Two of them mention price but say it was not decisive.
- Each arm now has three runs.

All six runs passed, with and without the pack: plain Claude matched the debriefs by company, did not count the two price mentions, and declined the price cut. Two conclusions:
- **The verdict.** On this task the right answer is within reach without the skill, so the eval measures no difference there. What the skill adds is structure: a saved review in `playbook/win-loss/`, seller and buyer accounts kept apart, an owner for each change, and an interview guide for deals with no buyer input. The judge does not grade those.
- **Routing.** The skill fired in only 1 of 3 with-pack runs. A question phrased as "should we cut prices?" is usually answered directly.

The case is kept as it is: it is harder and more realistic than the first one, and it records that baseline competence. Further reshaping it until the skill wins was ruled out.
