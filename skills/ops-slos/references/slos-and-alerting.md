# SLOs and alerting

How the ops skills decide how reliable a service must be, and when to wake someone up. The short version: measure what users experience, agree a budget for failure, and page only when that budget is burning fast.

## Labels

Every number is `computed` (from data the user supplied, with the script beside it), `not measured`, or `target` (a value someone chose). An SLO target is a `target`; attainment over a period is `computed` or `not measured`.

## SLIs and SLOs

An **SLI** (service level indicator) is a ratio: **good events ÷ valid events**, for one thing users care about on one critical journey.

| Kind | Good event | Valid event |
| --- | --- | --- |
| Availability | Request answered without a server error | Every request, excluding health checks and bots |
| Latency | Request answered within the threshold (for example 300 ms) | Every request that was answered |
| Correctness | Output matches the expected result | Every output checked |
| Freshness | Data updated within the threshold | Every read of the data |

An **SLO** is the target for that ratio over a window: for example 99.9% of checkout requests succeed over a rolling 30 days. Use rolling 28- or 30-day windows unless the business needs calendar months.

The **error budget** is what the SLO leaves: 1 − target. At 99.9% over 30 days the budget is 0.1%, which is 43.2 minutes of total downtime, or 1 failed request in every 1,000.

## The error budget policy

A budget only changes behaviour if a written policy says what each level of consumption triggers, and the people affected agree to it: the service owners, the product owner, and whoever is on call. Disagreement means the SLO is wrong, not the policy; iterate the SLO until they agree (Google SRE Workbook, *Implementing SLOs*, https://sre.google/workbook/implementing-slos).

A common shape:

| Budget consumed in the window | Action |
| --- | --- |
| Under 50% | Normal releases |
| 50–100% | Releases need a reliability check; prioritise reliability work |
| Over 100% | Freeze all changes except P0 fixes and security fixes until back within the SLO |

The policy names who decides exceptions, and is a draft until the user records who agreed it.

## Alerting on the budget: multiwindow, multi-burn-rate

Alert on how fast the budget is burning, not on raw thresholds. **Burn rate** is how many times faster than "exactly on budget" errors are arriving: a burn rate of 1 uses the whole budget in exactly one window.

Each alert checks a **long window** and a **short window** together, and fires only when both are above the threshold: the long window shows it matters, the short window shows it is still happening, which cuts false pages. Make the short window **1/12** of the long window (Google SRE Workbook, *Alerting on SLOs*, https://sre.google/workbook/alerting-on-slos/).

Starting thresholds for a 30-day window:

| Severity | Burn rate | Long window | Short window | Budget consumed when it fires |
| --- | --- | --- | --- | --- |
| **Page** | 14.4 | 1 hour | 5 minutes | 2% |
| **Page** | 6 | 6 hours | 30 minutes | 5% |
| **Ticket** | 1 | 3 days | 6 hours | 10% |

Budget consumed when an alert fires = burn rate × long window ÷ SLO window. The error-rate threshold for an alert = burn rate × (1 − SLO target): for 99.9%, the 14.4× page fires at an error rate above 1.44%.

```python
slo, window_days = 0.999, 30
budget = 1 - slo
print("budget minutes:", budget * window_days * 24 * 60)
for burn, long_h in [(14.4, 1), (6, 6), (1, 72)]:
    print(f"{burn}x over {long_h}h: error rate > {burn * budget:.4%}, "
          f"budget used {burn * long_h / (window_days * 24):.1%}")
```

Recompute for each SLO's own target and window; the table is a starting point, not a constant.

## What to page on

- **Page** for things a person must act on now; **ticket** for things that can wait for working hours.
- **Symptoms, not causes.** Page on what users experience (errors, latency, the SLO burning), not on CPU, memory or disk, unless no SLO covers a user-facing failure. Name each alert by what users see.
- **Every page links to its runbook.**
- **Actionable or gone.** Practice guides target 80% or more of alerts actionable, and delete or demote any alert not acted on in 90 days; Google's guideline is no more than 2–3 actionable pages per 12-hour shift (incident.io, *On-call best practices*, https://incident.io/blog/on-call-best-practices-guide-2026; itoc360, *On-Call Best Practices in 2026*, https://www.itoc360.com/on-call-best-practices/; practice sources, not research).
