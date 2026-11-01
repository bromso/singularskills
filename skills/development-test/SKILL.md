---
name: development-test
description: Write missing tests for existing code and report what was covered, what was added and which gaps remain. Use when code already works but has thin or no tests and the user wants coverage raised or checked. Not for test-first work while building a planned feature; see /development-build.
metadata:
  argument-hint: "[project] [--skip-checks]"
  workflow: development
  phase: 3
  artifact: 03-test.md
  stack-aware: true
---

# Test

Analyze and improve test coverage for "$ARGUMENTS". Write tests for untested code paths, edge cases, and critical functionality.

**Arguments.** `$ARGUMENTS` may contain the project name and optional flags. Take the first token as `<project>` and treat `--skip-checks` as a flag; never include flags in file paths. All paths below use `<project>`. If `--skip-checks` is present, skip the prerequisite check and, **before writing any artifact**, append one line to `.singularskills/log.jsonl`: `{"ts":"<ISO timestamp>","skill":"development-test","workflow":"development","phase":3,"project":"<project>","event":"skipped","artifact":"03-test.md","note":"<reason or \"none given\">"}`.

## Prerequisites

**Part of a workflow.** This skill is phase 3 (Test) of the Plan-Build-Test-Ship workflow (`development`); cross-domain workflows run it too. First check `.singularskills/log.jsonl` for an open run for this project: a `run-started` line with `"project":"<project>"` and no later `run-finished` line for the same `workflow` and `project`. If one exists, the conductor is running you: continue here. Otherwise, if the user asked to start, run, continue or resume a process or workflow rather than this one step, do not continue here: invoke the `workflow` skill with the workflow the user asked for, or `development` when they named none, followed by `<project>`; it runs this phase in order, asks before it writes and records the run. Otherwise continue here: a later phase runs on its own; this one has no gate, since it needs no earlier artifact.

**Stack.** Before you build, test, lint, run or generate code, read the `Stack` section of the project's `AGENTS.md`, or of `CLAUDE.md` when `AGENTS.md` has none. Use its commands exactly as written, its `layout` for where files go and its `rules` as requirements. If it names a `profile`, also read the file `<profile>.md` in the `stacks` folder of this skill's bundled references for the full commands, layout and rules; the project's own keys win where both speak. If there is no `Stack` section, run the `singular-detect` skill, state what you inferred in one line, and offer to write the section with `singular-init`. Never assume a package manager, test runner or formatter the project did not declare.

Before you start work, append this line to `.singularskills/log.jsonl` (create the folder and file if missing): `{"ts":"<ISO timestamp>","skill":"development-test","workflow":"development","phase":3,"project":"<project>","event":"started","artifact":"03-test.md","note":""}`.

None — this is a utility skill that can run anytime.

## Process

1. **Analyze existing code:**
   - Read the source code related to "<project>"
   - Identify all public functions, methods, and components
   - Map code paths: happy paths, error paths, edge cases

2. **Assess current test coverage:**
   - Read existing tests for "<project>"
   - Identify what's tested and what's not
   - Note tests that are shallow (only happy path) or brittle (testing implementation, not behavior)

3. **Write missing tests:**
   - Prioritize: critical paths first, then edge cases, then error handling
   - Each test should verify behavior, not implementation
   - Use descriptive test names that explain what's being verified
   - Follow the project's existing test patterns and framework

4. **Run the full test suite:**
   - Verify all new tests pass
   - Verify no existing tests broke
   - Note any flaky or slow tests discovered

5. **Write the artifact** to `.singularskills/development/<project>/03-test.md` with sections:
   - **Coverage Assessment** — what was already tested, what wasn't
   - **Tests Added** — list of new tests with what they verify
   - **Remaining Gaps** — what still needs testing (if any)
   - **Test Health** — any flaky, slow, or problematic tests found

## References

- `references/stacks/bun-react-ts.md` and `references/stacks/rust-gpui.md`: the shipped stack profiles

## Output

The test report written to `.singularskills/development/<project>/03-test.md`. Present a summary to the user highlighting:
- Number of tests added
- Key coverage gaps filled
- Any remaining concerns

**Record the run.** After you have written the artifact, append this line to `.singularskills/log.jsonl` (the `started` line of Prerequisites, with `"event":"finished"`): `{"ts":"<ISO timestamp>","skill":"development-test","workflow":"development","phase":3,"project":"<project>","event":"finished","artifact":"03-test.md","note":""}`.

Open the artifact with this frontmatter (`agent` is the agent you run in, or `unknown`; `gate` is `none`, as this phase has no gate):

```yaml
---
skill: development-test
workflow: development
phase: 3
project: <project>
started: <ISO timestamp>
finished: <ISO timestamp>
agent: <the agent you run in, or "unknown">
gate: none
---
```

End the artifact with `## Decisions` and `## Open questions`, in this shape:

```markdown
## Decisions
- <what was chosen> — <why> — <what was rejected>

## Open questions
- <what the next phase or a reviewer must settle>
```
