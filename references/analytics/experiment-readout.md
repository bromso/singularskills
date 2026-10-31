# Experiment readout

How to read out a finished A/B test so the call can be trusted. The checks run in this order, and a failure early in the list overrides anything later: a significant p-value means nothing if the test is broken.

## 1. Sample ratio mismatch (first, always)

Compare the users actually assigned to each arm with the **planned split** (50/50, 90/10, whatever the plan says) using a chi-square goodness-of-fit test. A sample ratio mismatch (SRM) at p < 0.001 means the assignment or the logging is broken: users were dropped, duplicated or mis-bucketed, often in a way that correlates with the outcome. An SRM is a symptom of a data-quality problem, and the result cannot be trusted until its cause is found and fixed (Fabijan et al., 2019, *KDD*: "Diagnosing Sample Ratio Mismatch in Online Controlled Experiments").

```python
from scipy.stats import chisquare
observed = [40112, 34391]          # users per arm, from the results
planned = [0.5, 0.5]                # the plan's split, not assumed 50/50
total = sum(observed)
stat, p = chisquare(observed, [total * s for s in planned])
print(f"chi2={stat:.2f} p={p:.2e} SRM={'yes' if p < 0.001 else 'no'}")
```

**When the planned split is unknown** (no plan and no answer), never call the test invalid on an assumed split: test the counts against 50/50 and the nearest conventional split they fit (90/10, 80/20, 2:1), and call it *inconclusive: planned split unknown*, naming that split and asking for the plan.

**Without a way to run code**, state no test statistic. Show the observed counts and shares against the planned split, label the check `not computed`, and if the shares are plainly off the plan (several points away on thousands of users), call the result *inconclusive: suspected sample ratio mismatch* until the check is computed.

## 2. Did the test run as planned?

Check that the planned sample size per arm and the planned duration were reached, and whether anyone stopped early. Checking a fixed-horizon test repeatedly and stopping when it looks significant inflates false positives far beyond the nominal 5%; continuous monitoring needs always-valid or sequential methods (Johari et al., 2017, *KDD*: "Peeking at A/B Tests"). Experimenters do stop at the first significant look in practice (Berman et al., 2018, "p-Hacking and False Discovery in A/B Testing"). An unplanned early stop makes the result *inconclusive* unless the plan used a sequential method.

## 3. The primary metric

The effect as an absolute and relative difference with a 95% confidence interval (two-proportion z-test for conversion metrics; Welch's t-test or a bootstrap for means), the sample per arm, and the p-value. Report the interval, not only the p-value: an interval that spans zero and a commercially meaningful effect is inconclusive, not "no effect".

## 4. Guardrails

A significant harm to a guardrail blocks shipping even when the call is inconclusive for another reason (an early stop, a sample short of plan); the readout says so beside the call.

Each guardrail metric's change with its interval. A significant harm to a guardrail blocks shipping regardless of the primary metric.

## 5. Base rates

Most experiments do not improve their key metric; success rates of about 10–20% are common, and with that base rate a p < 0.05 "win" is a false positive far more often than 5% of the time (Kohavi and Chen, 2024, *KDD*: "False Positives in A/B Tests"; the per-company figures they report range from about 8% to about 33%). A surprising or very large effect gets a replication run before a launch.

## The call

| Situation | Call |
| --- | --- |
| SRM computed at p < 0.001, or suspected from the counts | **invalid** (computed) or **inconclusive: suspected sample ratio mismatch** (not computed); find the cause before any decision |
| No plan, and the counts do not fit 50/50 | **inconclusive: planned split unknown**; ask for the plan |
| Unplanned early stop, or planned sample or duration not reached | **inconclusive** |
| A guardrail significantly worse | **don't ship** |
| Primary metric's interval entirely above zero, guardrails fine | **ship** (replicate first if the effect is surprising) |
| Primary metric's interval entirely below zero | **don't ship** |
| Interval spans zero | **inconclusive**; say what effect size it rules out |
