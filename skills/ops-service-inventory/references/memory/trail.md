# The artifact trail

The contract between this pack's artifacts and anything that reads them back: a person, the `singular-status` and `singular-report` skills, the first phase of every workflow (its **Recall** step), or a memory system such as `singularrag`. Nothing here is new; it names what the pack already writes, so a reader can rely on it.

## Where

| What | Path |
| --- | --- |
| A phase's artifact (single-writer or shared) | `.singularskills/<folder>/<project>/NN-<phase>.md` |
| A folder artifact (several files, one per item) | `.singularskills/<folder>/<project>/NN-<phase>/<item>.md` |
| A utility artifact (a non-phase skill's file in a project folder) | `.singularskills/<folder>/<project>/<name>.md` (no `NN-` prefix; `phase: null`, `gate: none`) |
| A workspace report (not tied to a project) | `.singularskills/<name>.md`, such as `detect.md` from `singular-detect` |
| The run log | `.singularskills/log.jsonl` |
| Reports | `.singularskills/reports/` |

`<folder>` is the workflow's folder (`design`, `marketing`, …) or, in a cross-domain workflow, the phase's own folder; `<project>` is the lowercase, hyphenated project name; `NN` is the phase number, zero-padded.

## Frontmatter

Every artifact opens with a YAML block:

```yaml
---
skill: design-empathize        # the writing skill, or the phase title for a shared artifact
workflow: design
phase: 1
project: date-picker
started: 2026-10-26T09:12:00Z
finished: 2026-10-26T09:20:31Z
agent: claude-code             # the agent the skill ran in, or "unknown"
gate: passed | skipped | none  # the worst value among a shared artifact's sections
---
```

A memory system that strips frontmatter (as `singularrag` does today) still has the path, which carries the folder, project and phase, and the headings below.

## Visible structure

- `# <Title>`: the artifact's title.
- `## Recalled` (optional, first-phase artifacts only): up to ten lines naming what the skill found about the project before it asked anything, each with its source (a path or a tool), or the single line `Nothing recalled: …`.
- `## Tools` (optional, Figma-aware skills): a `- file:` line (the Design file), a `- board:` or `- deck:` line where a skill uses one, one line per bound capability (`- read-tokens: get_variable_defs (figma)`), a `- created:` line for node ids the skill made; or the single line `No Figma server: steps marked Figma ran without one.`
- The body sections the skill defines.
- `## Decisions`: `- <what was chosen> — <why> — <what was rejected>` lines.
- `## Open questions`: `- <what the next phase or a reviewer must settle>` lines.

A **shared artifact** (a phase with several member skills writing one file) has the frontmatter once and one `## <Skill title>` section per member; each section opens with an italic line, `*<skill name> · <ISO timestamp> · gate: <passed|skipped|none>*`, may hold a `### Recalled` section, and closes with its own `### Decisions` and `### Open questions`.

## The run log

One JSON object per line, append-only: `{ "ts", "skill", "workflow", "phase", "project", "event", "artifact", "note" }`.

| Event | Written by | Meaning |
| --- | --- | --- |
| `run-started` | the conductor | A run began; `note` names the first unapproved phase. |
| `started` / `finished` | the member skill | It began and finished writing its artifact or section. |
| `refused` | the member skill | Its gate refused; `note` holds what the gate printed. |
| `skipped` | the member skill | The user bypassed its gate with `--skip-checks`; `note` holds the reason. |
| `phase-approved` | the conductor | A person approved the phase; **this is what completes a phase**, not the file existing. |
| `run-finished` | the conductor | The run ended: `complete`, `stopped before approving phase <n>`, `refused at phase <n>: …` or `superseded by a new run`. |

An open run is a `run-started` with no later `run-finished` for the same `workflow` and `project`.

## What to index, and what a recall answer looks like

- Index every `*.md` under `.singularskills/` and the run log. The trail holds no secrets by design, and the log is where bypasses (`skipped`) and refusals live, which a reviewer wants to see.
- For a project name, a good answer lists its artifacts in phase order with each one's **Decisions** lines and **Open questions**, the latest `phase-approved` phase, and any `skipped` or `refused` lines.
- Keep the path: `<folder>/<project>/NN-<phase>.md` is how a reader locates the source.

## For memory systems

What this pack asks of `singularrag` (or any indexer) to see the whole trail:

1. Index dot-directories, or at least `.singularskills/`, and do not let `.gitignore` rules for build output hide it.
2. Keep the frontmatter keys (`skill`, `workflow`, `phase`, `project`, `gate`) as section metadata instead of stripping them, so a query can filter by project.
3. Ingest `log.jsonl` as events, one row per line, so "what was skipped" and "what was approved when" are answerable.
4. Expose a recall-shaped answer: for a project name, the artifacts in phase order with their Decisions lines.
