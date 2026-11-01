# Evaluating an AI feature

How the AI skills find out whether a feature works, and keep finding out. The short version: read real outputs before you write any check, turn the failures you find into checks, and trust an AI judge only after it has been checked against people.

## Labels and data

Every number an AI artifact reports is `computed` (from outputs, logs or labels the team supplied, with the script beside it), `not measured`, or `target`. Scripts read the team's files where they keep them and write aggregates under `.singularskills/`. Three artifacts are row-level by nature: the per-output notes of `06-evaluate.md`, the disagreements of a judge check, and the test inputs of an attack plan. These may list a row number or the team's output ID with a short quote, with names, emails, phone numbers and account IDs always replaced by placeholders.

## 1. Error analysis comes first

Before writing a single check, read real outputs. Practitioners agree this is the step that matters most and the one teams skip; on real projects it takes most of the evaluation time, and handing it entirely to an LLM breaks the loop from failure to fix (Husain, *AI Evals FAQ*, 2026, https://hamel.dev/blog/posts/evals-faq/).

1. Take a sample of real outputs: about 100, from real or realistic inputs, over-weighting the ones with negative feedback, unusual length or high latency.
2. Write a one-line note on each: what is wrong, or "fine".
3. Group the notes into failure groups (made-up facts, wrong tone, ignores the user's constraint, leaks data) and count each group, with a script.
4. Rank the groups by count and by harm.

**Who reads.** When the team supplies its own notes per output, use them. Otherwise Claude does the first pass: it writes the notes and proposes the groups. A person who knows the domain then confirms, merges, splits or renames the groups. Until a person has confirmed them, the groups are **proposed**: they are written down and counted, but no check is built from a proposed group.

## 2. From failures to checks

- Fix what can be fixed now (a missing instruction, a wrong document) instead of writing a check for it.
- **Plain checks** for clear-cut failures: the output must cite a source, must not contain an email address, must be valid JSON, must be under 200 words.
- **AI judges** for judgement calls: is the answer faithful to the retrieved documents, is the tone right. Write the judge's criteria for one failure group at a time.
- **pass/fail, not 1–5.** A binary verdict is easier to define, to agree on and to act on.
- Every check maps to a failure group and to an owner who fixes it. The results-actionability gap, where teams collect evaluation results but cannot turn them into improvements, is the most common way evaluation fails (van der Maden et al., 2026, *CHI*: "Results-Actionability Gap: Understanding How Practitioners Evaluate LLM Products in the Wild").

## 3. Checking a judge against people

An AI judge is only useful if it agrees with the people who know what good looks like, especially on the failures. Compare its pass/fail verdicts with human labels on the same outputs:

| | Human: pass | Human: fail |
| --- | --- | --- |
| **Judge: pass** | both pass (a) | judge misses a failure (b) |
| **Judge: fail** | judge rejects a good output (c) | both fail (d) |

- **Agreement** = (a + d) ÷ all rows
- **True-positive rate** = a ÷ (a + c): of the outputs people passed, the share the judge passed
- **True-negative rate** = d ÷ (b + d): of the outputs people failed, the share the judge also failed

Agreement alone misleads when most outputs pass. Example: 90 human passes and 10 human fails, and a judge that passes everything. Agreement is 90%, and the true-negative rate is 0%: the judge catches none of the failures it exists to catch. Judge the judge on the true-negative rate first.

**Too few to judge.** With fewer than 10 human-labelled fails, or fewer than 30 labelled rows, the rates are too unstable to trust either way; say "too few labels to judge the judge" and ask for more. (Threshold: the pack's call, a common rule of thumb.)

Re-check the judge against fresh human labels after any change to its prompt or model, and on a schedule (quarterly is common). Never invent human labels.

## 4. Keep it going

- **Prompts are versioned code.** Every prompt change gets a diff, a review and an evaluation run.
- **Human review is earned away.** Start with a person reviewing outputs everywhere; remove review only where the evaluation shows the feature passes.
- **Repeat error analysis** on fresh outputs regularly (monthly is common) and after every model or prompt change; new failure groups appear as usage changes.

## When to write checks

Practitioners disagree. Some write evaluations before building, as tests are written before code; others argue an LLM's failures cannot be predicted until real outputs exist, so checks written first miss what actually breaks. The AI skills do both: phase 5 writes an initial test set from the failure modes named in phase 1, and phase 6 grows it from error analysis.
