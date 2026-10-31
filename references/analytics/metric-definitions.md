# Metric definitions

How the analytics skills define, organise and compute metrics. A metric nobody can reproduce is an opinion; a definition is what lets two people get the same number from the same data.

## Labels

Every number an analytics artifact reports carries one of these labels:

- `computed`: calculated with a script from data the user supplied; the script goes in the artifact beside the result.
- `not measured`: the data needed is missing; say which column, table or period.
- `not checked`: a data-quality check that could not run; say why.
- `target`: a value someone chose, not an observation.

## Aggregates only

Scripts read the user's files where they keep them and write only aggregates (counts, sums, rates, intervals) under `.singularskills/`. No row-level data, names, emails, user or order IDs go into any file there: not into artifacts, not into scripts as literals, not into output files. `.singularskills/` is indexed by memory tools and often committed.

## The definition template

Every metric in `02-metrics.md` is defined with all of these fields:

| Field | What it says |
| --- | --- |
| Name | One name, used everywhere: dashboards, readouts and queries |
| Question | The phase 1 question it answers |
| Formula | Numerator and denominator in words and in pseudo-SQL |
| Unit and grain | Percent, currency, count; per user, per order, per day |
| Inclusions and exclusions | Which rows count: test accounts, refunds, internal users, bots |
| Window | The period it covers and how it is anchored (calendar week, rolling 28 days) |
| Segments | The cuts it is reported by |
| Source | The table, file or event it is computed from (phase 3 confirms it exists) |
| Owner | Who answers questions about it |
| Traps | What has gone wrong with it before, or is likely to (see below) |

A metric already defined in another domain's artifact (a support metric in `.singularskills/support/<project>/06-service-levels.md` or `07-health.md`, a finance KPI) is referenced by that name and file, never redefined.

## Metric trees and guardrails

Start from the decision. For each decision area pick one **primary metric** that would tell you the decision worked, then the **input metrics** that drive it (for example, revenue = active customers × orders per customer × average order value), so a movement in the primary metric can be traced to an input. Add **guardrails**: metrics that must not get worse while the primary improves (refund rate, support contacts, page load time). A tree with more than about a dozen metrics has stopped being a tree.

## Traps

- **Ratios whose denominator moves.** A conversion rate can rise because fewer, better visitors arrived. Report the numerator and denominator beside every ratio.
- **Average of averages.** The mean of daily averages is not the period's average when days differ in size. Average order value is total revenue ÷ total orders for the period, not the mean of each day's average order value.
- **Simpson's paradox.** A trend in the total can reverse inside every segment when the mix of segments changes. Example:

  | Segment | Last month: visitors, conversion | This month: visitors, conversion |
  | --- | --- | --- |
  | Mobile | 2,000 at 2.0% | 6,000 at 2.2% |
  | Desktop | 8,000 at 5.0% | 4,000 at 5.5% |
  | **Total** | 10,000 at **4.4%** | 10,000 at **3.5%** |

  Both segments improved; the total fell because traffic moved to mobile. Always decompose a change in a total into mix and rate before explaining it.
- **Survivorship.** Metrics over "active users" leave out the users who left; cohort the denominator at the start of the window.
- **Time zones and late data.** Define the day's boundary and time zone; recent periods are often incomplete until late events arrive, so mark the latest period as provisional.
- **Definition drift.** A metric whose definition changed mid-period is two metrics; split the series at the change.
