import { argsSlugRule, logFields, replaceArgsParagraph } from "./args.js";
import { DISCLAIMER_INSTRUCTION } from "./content-blocks.js";
import { metadataEntries, parseFrontmatter } from "./frontmatter.js";
import { gatedSkills } from "./gates.js";
import { skillTitle } from "./phase-files.js";
import type { SkillFile } from "./skills.js";
import type { Phase, Workflow } from "./workflows.js";

/**
 * The four blocks of a SKILL.md that derive from the workflow files (spec §6.4–6.5, handoff
 * spec §4), regenerated in place by `pack-tools fix-skill-text`: the Arguments paragraph's
 * `skipped` line, the handoff paragraph that opens `## Prerequisites`, the gate-and-start step
 * after it, and the `**Record the run.**` block at the end of `## Output`. Re-runnable: running
 * it again changes nothing.
 */

/** The gate step: the first paragraph of `## Prerequisites` for every member of a gated phase. */
export const GATE_STEP =
	"Run this skill's gate before writing: `sh <this skill's folder>/scripts/gate.sh <project> <project root>`, where `<project root>` is the folder that contains `.singularskills/` (use `.` when you are already there). If it exits non-zero, stop and tell the user what it printed, unless `--skip-checks` was given (see Arguments).";

/** The gate step the one-shot migration wrote; replaced wherever it is still found. */
const LEGACY_GATE_STEP =
	"Run `scripts/gate.sh <project>` from this skill's folder. If it exits non-zero, stop and tell the user what it printed (unless `--skip-checks`, see Arguments).";

/** First words of the Output block; the block runs to the end of its closing `markdown` fence. */
export const OUTPUT_MARKER = "**Record the run.**";

/** A member of a domain workflow's phase: the workflow, the phase and the member's name. */
export type Member = { workflow: Workflow; phase: Phase; name: string };

/** Domain workflows only (no phase names a `folder`): skill name → its workflow and phase. */
export function memberships(workflows: Workflow[]): Map<string, Member> {
	const map = new Map<string, Member>();
	for (const workflow of workflows) {
		if (workflow.phases.some((phase) => phase.folder !== undefined)) continue;
		for (const phase of workflow.phases) {
			for (const name of phase.skills) map.set(name, { workflow, phase, name });
		}
	}
	return map;
}

const isFence = (line: string) => /^\s*(```|~~~)/.test(line);

/** Index of the `## <title>` line outside fenced code, or -1. */
function headingIndex(lines: string[], title: string): number {
	let inFence = false;
	for (let i = 0; i < lines.length; i++) {
		if (isFence(lines[i])) inFence = !inFence;
		if (!inFence && lines[i] === `## ${title}`) return i;
	}
	return -1;
}

/** End (exclusive) of the section whose heading is at `start`: the next `## ` outside fences. */
function sectionEnd(lines: string[], start: number): number {
	let inFence = false;
	for (let i = start + 1; i < lines.length; i++) {
		if (isFence(lines[i])) inFence = !inFence;
		if (!inFence && lines[i].startsWith("## ")) return i;
	}
	return lines.length;
}

/** The Arguments paragraph with the skill's literal log fields (see `logFields`). */
export function fixArgs(content: string, domain: string, name: string): string {
	if (argsSlugRule(content) === undefined) return content;
	return replaceArgsParagraph(content, domain, logFields(content, name));
}

/** One run-log line of `member` for `event`, as the Arguments paragraph's `skipped` line. */
function logLine(member: Member, event: string, note: string): string {
	const { workflow, phase, name } = member;
	return `\`{"ts":"<ISO timestamp>","skill":"${name}","workflow":"${workflow.folder}","phase":${phase.phase},"project":"<project>","event":"${event}","artifact":"${phase.artifact}","note":"${note}"}\``;
}

/** Opening of the ungated member's first Prerequisites paragraph. */
const START_STEP = "Before you start work, append this line to `.singularskills/log.jsonl`";

/**
 * The first paragraph of `## Prerequisites` for a phase member, in the order a literal agent
 * follows: run the gate, on a refusal append `refused` and stop (under `--skip-checks` the
 * Arguments paragraph's `skipped` line comes first), then append `started` before the work. An
 * ungated member only appends `started`.
 */
export function startParagraph(member: Member, gated: boolean): string {
	const started = logLine(member, "started", "");
	if (!gated) {
		return `${START_STEP} (create the folder and file if missing): ${started}.`;
	}
	const refused = logLine(member, "refused", "<what the gate printed>");
	return `${GATE_STEP} On a refusal, before you stop, append this line to \`.singularskills/log.jsonl\` (create the folder and file if missing): ${refused}. Once the gate has passed, or under \`--skip-checks\` once you have appended the \`skipped\` line, append this line before you start work: ${started}.`;
}

/** A line this fixer owns as the first paragraph of `## Prerequisites`. */
const isStartStep = (line: string) =>
	line.startsWith(GATE_STEP) || line === LEGACY_GATE_STEP || line.startsWith(START_STEP);

/**
 * `startParagraph` as the first paragraph of `## Prerequisites` for a phase member with an
 * artifact (a new section before the first H2 when there is none), replacing an earlier gate or
 * start step; any such step is removed from other skills, leaving `None.` in a section it
 * empties.
 */
export function fixStartStep(content: string, member: Member | undefined, gated: boolean): string {
	const lines = content.split("\n");
	const at = headingIndex(lines, "Prerequisites");
	const paragraph = member?.phase.artifact ? startParagraph(member, gated) : undefined;
	if (paragraph === undefined) {
		if (at < 0) return content;
		const end = sectionEnd(lines, at);
		const body = lines.slice(at + 1, end);
		const kept = body.filter((line) => !isStartStep(line));
		if (kept.length === body.length) return content;
		const collapsed = kept.filter((line, i) => !(line === "" && kept[i - 1] === ""));
		const empty = collapsed.every((line) => line.trim() === "");
		const section = empty ? ["", "None.", ""] : collapsed;
		lines.splice(at + 1, end - at - 1, ...section);
		return lines.join("\n");
	}
	if (at >= 0) {
		// A section that said only "None." now holds the step instead.
		const end = sectionEnd(lines, at);
		const rest = lines
			.slice(at + 1, end)
			.filter((line) => line.trim() !== "" && !isStartStep(line));
		if (rest.length === 1 && rest[0] === "None.") {
			lines.splice(at + 1, end - at - 1, "", paragraph, "");
			return lines.join("\n");
		}
		// Generated lead paragraphs (handoff, stack; see `fixLead`) open the section; the step
		// follows the last of them.
		let afterLead = at;
		for (;;) {
			const next = lines.findIndex((line, i) => i > afterLead && line.trim() !== "");
			if (next < 0 || !isLead(lines[next])) break;
			afterLead = next;
		}
		const first = lines.findIndex((line, i) => i > afterLead && line.trim() !== "");
		if (first >= 0 && isStartStep(lines[first])) {
			lines[first] = paragraph;
			return lines.join("\n");
		}
		lines.splice(afterLead + 1, 0, "", paragraph);
		return lines.join("\n");
	}
	const firstH2 = lines.findIndex((line) => line.startsWith("## "));
	const insertAt = firstH2 < 0 ? lines.length : firstH2;
	lines.splice(insertAt, 0, "## Prerequisites", "", paragraph, "");
	return lines.join("\n");
}

/** First words of the handoff paragraph: the first paragraph of `## Prerequisites` of every member. */
export const HANDOFF_MARKER = "**Part of a workflow.**";

/**
 * The handoff paragraph (handoff spec §4): a member invoked outside an open run, or for a whole
 * process, hands off to the `workflow` conductor. Only the phase number and title and the
 * workflow title and name vary per member.
 */
export function handoffParagraph(member: Member): string {
	const { workflow, phase } = member;
	const common = `${HANDOFF_MARKER} This skill is phase ${phase.phase} (${phase.title}) of the ${workflow.title} workflow (\`${workflow.name}\`); cross-domain workflows run it too. First check \`.singularskills/log.jsonl\` for an open run for this project: a \`run-started\` line with \`"project":"<project>"\` and no later \`run-finished\` line for the same \`workflow\` and \`project\`. If one exists, the conductor is running you: continue here. Otherwise, if the user asked to start, run, continue or resume a process or workflow rather than this one step, do not continue here: invoke the \`workflow\` skill with the workflow the user asked for, or \`${workflow.name}\` when they named none, followed by \`<project>\`; it runs this phase in order, asks before it writes and records the run.`;
	// The first phase of a workflow is where a trail starts: ask whether the person wants the
	// whole workflow. A later phase runs on its own, guarded by its gate.
	const first = phase === workflow.phases[0];
	// A later phase that requires nothing has no gate (gen-gates writes none), so say so.
	const ungated = !first && phase.requires.length === 0;
	const tail = first
		? ` Otherwise, unless the user named this skill, ask one question, since this is the first phase of its workflow: "Just this step, or the whole ${workflow.title} workflow?" End your turn and wait; on the whole workflow, hand off the same way; on just this step, continue here.`
		: ungated
			? " Otherwise continue here: a later phase runs on its own; this one has no gate, since it needs no earlier artifact."
			: " Otherwise continue here: a later phase runs on its own, behind its gate.";
	return common + tail;
}

const isHandoff = (line: string) => line.startsWith(HANDOFF_MARKER);

/** First words of the stack step (stack spec §6), carried by skills with `metadata.stack-aware: true`. */
export const STACK_MARKER = "**Stack.**";

/** The stack step, verbatim for every stack-aware skill; mirrored by the validator. */
export const STACK_STEP = `${STACK_MARKER} Before you build, test, lint, run or generate code, read the \`Stack\` section of the project's \`AGENTS.md\`, or of \`CLAUDE.md\` when \`AGENTS.md\` has none. Use its commands exactly as written, its \`layout\` for where files go and its \`rules\` as requirements. If it names a \`profile\`, also read the file \`<profile>.md\` in the \`stacks\` folder of this skill's bundled references for the full commands, layout and rules; the project's own keys win where both speak. If there is no \`Stack\` section, run the \`singular-detect\` skill, state what you inferred in one line, and offer to write the section with \`singular-init\`. Never assume a package manager, test runner or formatter the project did not declare.`;

const isStack = (line: string) => line.startsWith(STACK_MARKER);

/** First words of the Figma step (design-capability spec §6), carried by skills with `metadata.figma-aware: true`. */
export const FIGMA_MARKER = "**Figma.**";

/** The Figma step, verbatim for every Figma-aware skill; mirrored by the validator. */
export const FIGMA_STEP = `${FIGMA_MARKER} Steps marked *Figma* use a Figma MCP server you connect to this agent yourself; this pack ships none and makes no network calls. Before you ask the user anything or run the first such step, list the tools available to you and bind each capability the step names to one tool, as \`references/figma-capabilities.md\`, bundled with this skill, describes: the official Figma server's tool named there, else any tool whose description plainly does the same thing. With a capability bound, take the file key and node id from a Figma link in the request or the conversation, else from the \`file:\` line of the \`## Tools\` section of the latest earlier artifact of this project that has one; when a bound capability needs one and there is none, ask for the link once, with any other question you ask. With nothing bound, never ask for a link. Record the result in a \`## Tools\` section after any \`## Recalled\` section: a \`- file:\` line (the Design file; a board or a deck goes on a \`- board:\` or \`- deck:\` line), one line per bound capability (\`- read-tokens: get_variable_defs (figma)\`), and a \`- created:\` line for node ids you created; or the single line \`No Figma server: steps marked Figma ran without one.\`; a skill with no artifact says the same in its summary. For an unbound capability do what the step's *Without Figma* line says, using first any values the user gave in the request or in files it names: never ask the user to connect a server, never invent values a tool would have returned, and never report a step as run when it was not.`;

const isFigma = (line: string) => line.startsWith(FIGMA_MARKER);

/** First words of the recall step (memory spec §7.2), carried by every first-phase member. */
export const RECALL_MARKER = "**Recall.**";

/**
 * The recall step: a first-phase member looks for what the repository already holds about the
 * project (a memory tool when one is available, the trail always) before it asks the user. The
 * only variation: a shared-phase member opens its own section with `### Recalled`.
 */
export function recallStep(shared: boolean): string {
	const open = shared
		? "After your section's italic line, add a `### Recalled` subsection"
		: "After the frontmatter and title, add a `## Recalled` section";
	return `${RECALL_MARKER} Before you ask the user anything, look for what this repository already holds about \`<project>\`: if a tool is available whose description says it searches or maps this repository (a memory or repo-map server such as \`repo_map\` or \`entities\`), query it for \`<project>\` and this phase's subject and read what it returns, keeping only results from this repository; in every case also list \`.singularskills/*/<project>/\` and read the **Decisions** and **Open questions** of any artifact there, and the lines of \`.singularskills/log.jsonl\` whose \`project\` is \`<project>\`. ${open} of at most ten lines naming what you found and where (path or tool), or the single line \`Nothing recalled: no earlier artifacts, log lines or memory results for <project>.\` Ask the user only what this did not answer. The trail's shape is described in \`references/memory/trail.md\`, bundled with this skill.`;
}

const isRecall = (line: string) => line.startsWith(RECALL_MARKER);

/** Whether `member` writes a shared artifact (the Output block's rule). */
const sharedPhase = (member: Member) =>
	member.phase.skills.length > 1 && !member.phase.artifact?.endsWith("/");

/** The generated paragraphs that may open `## Prerequisites`, in their fixed order. */
const LEAD_ORDER: ((line: string) => boolean)[] = [isHandoff, isRecall, isStack, isFigma];
const isLead = (line: string) => LEAD_ORDER.some((test) => test(line));

/** Whether the skill's frontmatter says `metadata.<key>: true`. */
function metadataFlag(content: string, key: string): boolean {
	const match = /^---\n([\s\S]*?)\n---(?=\n|$)/.exec(content);
	if (!match) return false;
	return metadataEntries(parseFrontmatter(match[1])).some(
		([k, value]) => k === key && value.trim() === "true",
	);
}

/** Whether the skill's frontmatter says `metadata.stack-aware: true`. */
export const stackAware = (content: string): boolean => metadataFlag(content, "stack-aware");

/** Whether the skill's frontmatter says `metadata.figma-aware: true`. */
export const figmaAware = (content: string): boolean => metadataFlag(content, "figma-aware");

/**
 * One generated lead paragraph (`text`, recognised by `is`) placed in `## Prerequisites` after
 * every lead paragraph that comes before it in `LEAD_ORDER`, replacing an earlier copy wherever
 * it sat; a section that said only `None.` loses it. With `present` false, the paragraph is
 * removed, leaving `None.` in a section it empties.
 */
function fixLead(
	content: string,
	present: boolean,
	is: (line: string) => boolean,
	text: string,
): string {
	const lines = content.split("\n");
	const at = headingIndex(lines, "Prerequisites");
	if (!present) {
		if (at < 0) return content;
		const end = sectionEnd(lines, at);
		const body = lines.slice(at + 1, end);
		const kept = body.filter((line) => !is(line));
		if (kept.length === body.length) return content;
		const collapsed = kept.filter((line, i) => !(line === "" && kept[i - 1] === ""));
		const empty = collapsed.every((line) => line.trim() === "");
		lines.splice(at + 1, end - at - 1, ...(empty ? ["", "None.", ""] : collapsed));
		return lines.join("\n");
	}
	if (at < 0) {
		const firstH2 = lines.findIndex((line) => line.startsWith("## "));
		lines.splice(firstH2 < 0 ? lines.length : firstH2, 0, "## Prerequisites", "", text, "");
		return lines.join("\n");
	}
	const end = sectionEnd(lines, at);
	const body = lines
		.slice(at + 1, end)
		.filter((line) => !is(line) && line.trim() !== "None.")
		.filter((line, i, all) => !(line === "" && (i === 0 || all[i - 1] === "")));
	while (body.length > 0 && body[body.length - 1] === "") body.pop();
	// Earlier lead paragraphs stay ahead of this one; each lead paragraph is one line.
	const rank = LEAD_ORDER.findIndex((test) => test(text));
	const before = LEAD_ORDER.slice(0, rank);
	let insertAt = 0;
	while (insertAt < body.length && before.some((test) => test(body[insertAt]))) {
		insertAt += 1;
		if (body[insertAt] === "") insertAt += 1;
	}
	if (insertAt >= body.length) body.push(...(body.length ? [""] : []), text);
	else body.splice(insertAt, 0, text, "");
	lines.splice(at + 1, end - at - 1, "", ...body, "");
	return lines.join("\n");
}

/** `STACK_STEP` as a lead paragraph of `## Prerequisites` when `present` (the skill is stack-aware). */
export function fixStackStep(content: string, present: boolean): string {
	return fixLead(content, present, isStack, STACK_STEP);
}

/** `FIGMA_STEP` as a lead paragraph of `## Prerequisites` when `present` (the skill is Figma-aware). */
export function fixFigmaStep(content: string, present: boolean): string {
	return fixLead(content, present, isFigma, FIGMA_STEP);
}

/** `recallStep` as a lead paragraph of `## Prerequisites` for a first-phase member; removed elsewhere. */
export function fixRecallStep(content: string, member: Member | undefined): string {
	const first = member !== undefined && member.phase === member.workflow.phases[0];
	return fixLead(content, first, isRecall, member ? recallStep(sharedPhase(member)) : "");
}

/**
 * `handoffParagraph` as the first paragraph of `## Prerequisites` of every member (a new section
 * before the first H2 when there is none), replacing any earlier handoff wherever it sits; a
 * section that said only `None.` loses it. Without a member, any handoff is removed, leaving
 * `None.` in a section it empties.
 */
export function fixHandoff(content: string, member: Member | undefined): string {
	return fixLead(content, member !== undefined, isHandoff, member ? handoffParagraph(member) : "");
}

/** Markers around the conductor's generated workflows block (handoff spec §6). */
export const WORKFLOWS_BLOCK_START = "<!-- workflows:start -->";
export const WORKFLOWS_BLOCK_END = "<!-- workflows:end -->";

const cell = (values: string[]) => values.map((v) => `\`${v}\``).join(", ");

/**
 * The conductor's workflows block: for every workflow, sorted by name, a heading and one table
 * row per phase (number, title, artifact, own folder, requires, member skills), so the conductor
 * can run when it cannot read the workflow files.
 */
export function workflowsBlock(workflows: Workflow[]): string[] {
	const lines = [
		WORKFLOWS_BLOCK_START,
		"The workflows, from `workflows/*.yml` (regenerated by `pack-tools fix-skill-text`); each heading names the bundled copy of its file:",
	];
	for (const wf of [...workflows].sort((a, b) => a.name.localeCompare(b.name))) {
		lines.push(
			"",
			`### ${wf.name} — ${wf.title} (folder \`${wf.folder}\`, file \`references/workflows/${wf.name}.yml\`)`,
			"",
			"| Phase | Title | Artifact | Folder | Requires | Skills |",
			"| --- | --- | --- | --- | --- | --- |",
		);
		for (const p of wf.phases) {
			const artifact = p.artifact ? `\`${p.artifact}\`` : "";
			lines.push(
				`| ${p.phase} | ${p.title} | ${artifact} | ${p.folder ?? ""} | ${cell(p.requires)} | ${cell(p.skills)} |`,
			);
		}
	}
	lines.push(WORKFLOWS_BLOCK_END);
	return lines;
}

/** `workflowsBlock` in place of whatever sits between the markers; unchanged without a start marker. */
export function fixWorkflowsBlock(content: string, workflows: Workflow[]): string {
	const lines = content.split("\n");
	const start = lines.indexOf(WORKFLOWS_BLOCK_START);
	if (start < 0) return content;
	const end = lines.indexOf(WORKFLOWS_BLOCK_END, start);
	if (end < 0) throw new Error("unterminated workflows block");
	lines.splice(start, end - start + 1, ...workflowsBlock(workflows));
	return lines.join("\n");
}

/**
 * The `**Record the run.**` block (spec §6.5) of a phase member: its `finished` line, the
 * artifact frontmatter and the closing sections; for a shared artifact (a phase with two or
 * more members writing one file), also who writes the frontmatter and the italic line each
 * member's `## <section>` opens with.
 */
export function outputBlock(member: Member, section = "<Skill title>"): string[] {
	const { workflow, phase, name } = member;
	const gated = phase.requires.length > 0;
	const shared = phase.skills.length > 1 && !phase.artifact?.endsWith("/");
	const gateValue = gated ? "<passed|skipped>" : "none";
	const gateNote = gated
		? "`gate` is `passed` when the gate ran clean and `skipped` under `--skip-checks`"
		: "`gate` is `none`, as this phase has no gate";
	const log = [
		`${OUTPUT_MARKER} After you have written ${shared ? "your section" : "the artifact"}, append this line to \`.singularskills/log.jsonl\` (the \`started\` line of Prerequisites, with \`"event":"finished"\`): ${logLine(member, "finished", "")}.`,
	];
	const frontmatter = [
		"```yaml",
		"---",
		`skill: ${shared ? phase.title : name}`,
		`workflow: ${workflow.name}`,
		`phase: ${phase.phase}`,
		"project: <project>",
		"started: <ISO timestamp>",
		"finished: <ISO timestamp>",
		'agent: <the agent you run in, or "unknown">',
		`gate: ${gateValue}`,
		"---",
		"```",
	];
	const worst = gated
		? " and to set `gate` to the worst value among the sections (`skipped` over `passed`)"
		: "";
	const intro = shared
		? `This artifact is shared by every skill of phase ${phase.phase} (${phase.title}). The frontmatter is written once, by whoever creates the file: if you create it, open it with the block below (\`skill\` is the phase title, \`started\` the time of that first write; ${gateNote}); if it already exists, leave the block alone except to update \`finished\`${worst}.`
		: `Open the artifact with this frontmatter (\`agent\` is the agent you run in, or \`unknown\`; ${gateNote}):`;
	const sectionLine = shared
		? [
				`Open your \`## ${section}\` section with one italic line, \`*<skill name> · <ISO timestamp> · gate: ${gateValue}*\` (your skill name is \`${name}\`).`,
				"",
			]
		: [];
	// In a shared artifact the closing sections sit one level under the member's own section,
	// so "replace only that section" stays unambiguous.
	const level = shared ? "###" : "##";
	const closing = shared
		? `End your section with \`### Decisions\` and \`### Open questions\` (one level under your \`## ${section}\` heading, so the section stays one block), in this shape:`
		: "End the artifact with `## Decisions` and `## Open questions`, in this shape:";
	return [
		...log,
		"",
		intro,
		"",
		...frontmatter,
		"",
		...sectionLine,
		closing,
		"",
		"```markdown",
		`${level} Decisions`,
		"- <what was chosen> — <why> — <what was rejected>",
		"",
		`${level} Open questions`,
		"- <what the next phase or a reviewer must settle>",
		"```",
	];
}

/** `[start, end)` of the existing Output block, or `undefined`. */
function blockRange(lines: string[]): [number, number] | undefined {
	const start = lines.findIndex((line) => line.startsWith(OUTPUT_MARKER));
	if (start < 0) return undefined;
	const open = lines.findIndex((line, i) => i > start && line === "```markdown");
	const close = open < 0 ? -1 : lines.findIndex((line, i) => i > open && line === "```");
	if (close < 0) throw new Error(`unterminated ${OUTPUT_MARKER} block`);
	return [start, close + 1];
}

/**
 * The Output block of `member` in place of the existing one, or appended to `## Output` (a new
 * section at the end when there is none) before a disclaimer instruction so the disclaimer
 * stays the artifact's last paragraph. Without a member, any block is removed.
 */
export function fixOutputBlock(content: string, member: Member | undefined): string {
	const lines = content.split("\n");
	const range = blockRange(lines);
	if (!member?.phase.artifact) {
		if (!range) return content;
		const [start, end] = range;
		const removeTo = lines[end] === "" ? end + 1 : end;
		lines.splice(start, removeTo - start);
		return lines.join("\n");
	}
	// The section the skill appends under (see phase-files' APPEND_TEMPLATE), else its title.
	const section = /under an? `## ([^`]+)` section/.exec(content)?.[1] ?? skillTitle(content);
	const block = outputBlock(member, section || undefined);
	if (range) {
		const [start, end] = range;
		lines.splice(start, end - start, ...block);
		return lines.join("\n");
	}
	const start = headingIndex(lines, "Output");
	if (start < 0) return `${content.replace(/\n*$/, "")}\n\n## Output\n\n${block.join("\n")}\n`;
	const end = sectionEnd(lines, start);
	const disclaimer = lines.findIndex(
		(line, i) => i > start && i < end && line === DISCLAIMER_INSTRUCTION,
	);
	if (disclaimer >= 0) {
		lines.splice(disclaimer, 0, ...block, "");
		return lines.join("\n");
	}
	let last = end - 1;
	while (last > start && lines[last].trim() === "") last--;
	lines.splice(last + 1, 0, "", ...block);
	return lines.join("\n");
}

/**
 * `pack-tools fix-skill-text`: regenerates the Arguments paragraph, the gate step and the
 * Output block of every skill from `workflows`. Idempotent.
 */
export function fixSkillText(workflows: Workflow[]): (skill: SkillFile) => string {
	const members = memberships(workflows);
	const gated = gatedSkills(workflows);
	return (skill) => {
		let out = fixArgs(skill.content, skill.domain, skill.name);
		out = fixStartStep(out, members.get(skill.name), gated.has(skill.name));
		out = fixHandoff(out, members.get(skill.name));
		out = fixRecallStep(out, members.get(skill.name));
		out = fixStackStep(out, stackAware(out));
		out = fixFigmaStep(out, figmaAware(out));
		if (skill.name === "workflow") out = fixWorkflowsBlock(out, workflows);
		return fixOutputBlock(out, members.get(skill.name));
	};
}
