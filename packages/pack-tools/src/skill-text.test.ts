import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	FIGMA_STEP as validatorFigmaStep,
	handoffParagraph as validatorHandoff,
	recallStep as validatorRecall,
	STACK_STEP as validatorStackStep,
} from "@singularskills/skill-validator";
import { describe, expect, test } from "vitest";
import { ARGS_PARAGRAPH } from "./args.js";
import { DISCLAIMER_INSTRUCTION } from "./content-blocks.js";
import {
	FIGMA_MARKER,
	FIGMA_STEP,
	GATE_STEP,
	HANDOFF_MARKER,
	RECALL_MARKER,
	STACK_MARKER,
	STACK_STEP,
	figmaAware,
	fixSkillText,
	fixWorkflowsBlock,
	handoffParagraph,
	memberships,
	recallStep,
	stackAware,
	workflowsBlock,
} from "./skill-text.js";
import { type SkillFile, listSkills } from "./skills.js";
import { type Phase, type Workflow, loadWorkflows } from "./workflows.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const design: Workflow = {
	name: "design",
	title: "Design Thinking",
	folder: "design",
	phases: [
		{
			phase: 1,
			title: "Empathize",
			artifact: "01-empathize.md",
			requires: [],
			skills: ["design-empathize"],
		},
		{
			phase: 2,
			title: "Define",
			artifact: "02-define.md",
			requires: ["01-empathize.md"],
			skills: ["design-define-component"],
		},
	],
};
const strategy: Phase = {
	phase: 0,
	title: "Strategy",
	artifact: "00-strategy.md",
	requires: [],
	skills: ["marketing-customer-research", "marketing-pricing-strategy"],
};
const act: Phase = {
	phase: 2,
	title: "Act",
	artifact: "02-act.md",
	requires: ["00-strategy.md"],
	skills: ["marketing-copywriting", "marketing-page-cro"],
};
const marketing: Workflow = {
	name: "marketing",
	title: "RACE Framework",
	folder: "marketing",
	phases: [strategy, act],
};
const workflows = [design, marketing];

const LEGACY_GATE =
	"Run `scripts/gate.sh <project>` from this skill's folder. If it exits non-zero, stop and tell the user what it printed (unless `--skip-checks`, see Arguments).";

function frontmatter(name: string, metadata: string): string {
	return `---\nname: ${name}\ndescription: Do it.\nmetadata:\n  argument-hint: "[project] [--skip-checks]"\n${metadata}---\n`;
}

function skill(name: string, metadata: string, body: string): SkillFile {
	const domain = name.slice(0, name.indexOf("-"));
	return {
		name,
		domain,
		path: `/r/skills/${name}/SKILL.md`,
		content: frontmatter(name, metadata) + body,
	};
}

const args = (domain: string) => ARGS_PARAGRAPH(domain, "first-token");

const defineBody = `
# Define Component

${args("design")}

## Prerequisites

${LEGACY_GATE}

Read \`.singularskills/design/<project>/01-empathize.md\`.

## Process

1. **Write the artifact** to \`.singularskills/design/<project>/02-define.md\`

## Output

The component contract.
`;
const define = skill(
	"design-define-component",
	"  workflow: design\n  phase: 2\n  artifact: 02-define.md\n",
	defineBody,
);

const sharedBody = (title: string) => `
# ${title}

${args("marketing")}

## Prerequisites

None.

## Process

1. **Write the artifact** — append to \`.singularskills/marketing/<project>/0x.md\` under a \`## ${title}\` section.

## Output

Appended.
`;
const copywriting = skill(
	"marketing-copywriting",
	"  workflow: marketing\n  phase: 2\n  artifact: 02-act.md\n",
	sharedBody("Copywriting"),
);
const research = skill(
	"marketing-customer-research",
	"  workflow: marketing\n  phase: 0\n  artifact: 00-strategy.md\n",
	sharedBody("Customer Research"),
);
const utility = skill(
	"development-debug",
	"",
	`\n# Debug\n\n${args("development")}\n\n## Output\n\nA fix.\n`,
);

const fix = fixSkillText(workflows);

describe("fix-skill-text: the Arguments paragraph", () => {
	test("a phase member's skipped line carries its name, folder, phase and artifact", () => {
		expect(fix(define)).toContain(
			'`{"ts":"<ISO timestamp>","skill":"design-define-component","workflow":"design","phase":2,"project":"<project>","event":"skipped","artifact":"02-define.md","note":"<reason or \\"none given\\">"}`',
		);
	});

	test("a utility's skipped line has a null phase and keeps the artifact placeholder", () => {
		expect(fix(utility)).toContain(
			'"skill":"development-debug","workflow":"development","phase":null,"project":"<project>","event":"skipped","artifact":"<artifact file>"',
		);
	});
});

const DEFINE_LINE = (event: string, note = "") =>
	`\`{"ts":"<ISO timestamp>","skill":"design-define-component","workflow":"design","phase":2,"project":"<project>","event":"${event}","artifact":"02-define.md","note":"${note}"}\``;

/** The first paragraph of `## Prerequisites` after the handoff paragraph that opens every member's section. */
const firstPrerequisite = (content: string) =>
	/^## Prerequisites\n\n(?:\*\*(?:Part of a workflow|Recall|Stack)\.\*\*[^\n]*\n\n)*(.*)$/m.exec(
		content,
	)?.[1];

describe("fix-skill-text: the gate-and-start step", () => {
	test("a gated member's Prerequisites open with the gate, then refused, then started", () => {
		const out = fix(define);
		expect(out).not.toContain(LEGACY_GATE);
		const first = firstPrerequisite(out) ?? "";
		expect(first.startsWith(GATE_STEP)).toBe(true);
		expect(GATE_STEP).toContain(
			"`sh <this skill's folder>/scripts/gate.sh <project> <project root>`",
		);
		expect(GATE_STEP).toContain("the folder that contains `.singularskills/`");
		const gate = first.indexOf("gate.sh");
		const refused = first.indexOf(DEFINE_LINE("refused", "<what the gate printed>"));
		const skipped = first.indexOf("once you have appended the `skipped` line");
		const started = first.indexOf(DEFINE_LINE("started"));
		expect(gate).toBeGreaterThanOrEqual(0);
		expect(refused).toBeGreaterThan(gate);
		expect(skipped).toBeGreaterThan(refused);
		expect(started).toBeGreaterThan(skipped);
		expect(out).toContain(`${first}\n\nRead \``);
	});

	test("adds the step to a gated member without one, and only once", () => {
		const out = fix(copywriting);
		expect(firstPrerequisite(out)?.startsWith(GATE_STEP)).toBe(true);
		expect(out).not.toContain("None.");
		expect(out.split(GATE_STEP)).toHaveLength(2);
	});

	test("an ungated member's Prerequisites open with one started sentence and no gate", () => {
		const out = fix(research);
		expect(out).not.toContain("gate.sh");
		expect(firstPrerequisite(out)).toBe(
			'Before you start work, append this line to `.singularskills/log.jsonl` (create the folder and file if missing): `{"ts":"<ISO timestamp>","skill":"marketing-customer-research","workflow":"marketing","phase":0,"project":"<project>","event":"started","artifact":"00-strategy.md","note":""}`.',
		);
		expect(out).not.toContain('"event":"refused"');
	});

	test("replaces a gate step on a member whose phase is no longer gated", () => {
		const out = fix({ ...research, content: research.content.replace("None.", LEGACY_GATE) });
		expect(out).not.toContain("gate.sh");
		expect(firstPrerequisite(out)).toMatch(/^Before you start work, append this line/);
		expect(out).toMatch(/started","artifact":"00-strategy\.md","note":""\}`\.\n\n## Process/);
	});

	test("utilities get no step and lose one they had", () => {
		expect(fix(utility)).not.toContain("gate.sh");
		expect(fix(utility)).not.toContain('"event":"started"');
		const stale = utility.content.replace(
			"## Output",
			`## Prerequisites\n\n${firstPrerequisite(fix(define))}\n\n## Output`,
		);
		const out = fix({ ...utility, content: stale });
		expect(out).not.toContain("gate.sh");
		expect(out).toContain("## Prerequisites\n\nNone.\n\n## Output");
	});
});

const empathize = skill(
	"design-empathize",
	"  workflow: design\n  phase: 1\n  artifact: 01-empathize.md\n",
	`\n# Empathize\n\n${args("design")}\n\n## Prerequisites\n\nNone — this is the first phase.\n\n## Process\n\n1. Write it.\n\n## Output\n\nThe brief.\n`,
);

const HANDOFF_COMMON = (phase: number, title: string) =>
	`**Part of a workflow.** This skill is phase ${phase} (${title}) of the Design Thinking workflow (\`design\`); cross-domain workflows run it too. First check \`.singularskills/log.jsonl\` for an open run for this project: a \`run-started\` line with \`"project":"<project>"\` and no later \`run-finished\` line for the same \`workflow\` and \`project\`. If one exists, the conductor is running you: continue here. Otherwise, if the user asked to start, run, continue or resume a process or workflow rather than this one step, do not continue here: invoke the \`workflow\` skill with the workflow the user asked for, or \`design\` when they named none, followed by \`<project>\`; it runs this phase in order, asks before it writes and records the run.`;
const DESIGN_EMPATHIZE_HANDOFF = `${HANDOFF_COMMON(1, "Empathize")} Otherwise, unless the user named this skill, ask one question, since this is the first phase of its workflow: "Just this step, or the whole Design Thinking workflow?" End your turn and wait; on the whole workflow, hand off the same way; on just this step, continue here.`;
const DESIGN_DEFINE_HANDOFF = `${HANDOFF_COMMON(2, "Define")} Otherwise continue here: a later phase runs on its own, behind its gate.`;

/** The paragraphs of `## Prerequisites`, in order. */
const prerequisites = (content: string) =>
	/^## Prerequisites\n\n([\s\S]*?)\n\n## /m
		.exec(content)?.[1]
		.split("\n\n")
		.filter((p) => p.trim() !== "") ?? [];

describe("fix-skill-text: the handoff paragraph", () => {
	const designMember = { workflow: design, phase: design.phases[0], name: "design-empathize" };
	const defineMember = {
		workflow: design,
		phase: design.phases[1],
		name: "design-define-component",
	};

	test("renders design-empathize's first-phase paragraph exactly", () => {
		expect(handoffParagraph(designMember)).toBe(DESIGN_EMPATHIZE_HANDOFF);
	});

	test("renders design-define-component's later-phase paragraph exactly", () => {
		expect(handoffParagraph(defineMember)).toBe(DESIGN_DEFINE_HANDOFF);
		expect(DESIGN_DEFINE_HANDOFF).not.toContain("Just this step");
	});

	test("checks the open run before intent, so the conductor's own run never loops", () => {
		const text = handoffParagraph(designMember);
		const openRun = text.indexOf("If one exists, the conductor is running you: continue here.");
		const intent = text.indexOf("if the user asked to start, run, continue or resume");
		expect(openRun).toBeGreaterThan(0);
		expect(intent).toBeGreaterThan(openRun);
	});

	test("names the project only, never the member's workflow, in the open-run check", () => {
		const text = handoffParagraph(designMember);
		expect(text).toContain(
			'a `run-started` line with `"project":"<project>"` and no later `run-finished` line',
		);
		expect(text).not.toContain('"workflow":"design"');
	});

	test("puts the paragraph first in Prerequisites, before the gate step", () => {
		const [first, second] = prerequisites(fix(define));
		expect(first).toMatch(/^\*\*Part of a workflow\.\*\* This skill is phase 2 \(Define\)/);
		expect(second?.startsWith(GATE_STEP)).toBe(true);
	});

	test("replaces a 'None.' section and creates a missing section", () => {
		const out = fix(copywriting);
		expect(out).not.toContain("None.");
		expect(prerequisites(out)[0]).toMatch(
			/^\*\*Part of a workflow\.\*\* This skill is phase 2 \(Act\)/,
		);
		const noSection = {
			...empathize,
			content: empathize.content.replace(
				/## Prerequisites\n\nNone — this is the first phase\.\n\n/,
				"",
			),
		};
		expect(fix(noSection)).toMatch(
			/^## Prerequisites\n\n\*\*Part of a workflow\.\*\* This skill is phase 1 \(Empathize\)/m,
		);
	});

	test("regenerates the spike wording and is idempotent", () => {
		const spike =
			"**Part of a workflow.** This skill is phase 1 (Empathize) of the Design Thinking workflow. Unless the user invoked this skill by name, check the log.";
		const withSpike = {
			...empathize,
			content: empathize.content.replace("None — this is the first phase.", spike),
		};
		const once = fix(withSpike);
		expect(once).not.toContain("Unless the user invoked this skill by name");
		expect(once.split(HANDOFF_MARKER)).toHaveLength(2);
		expect(prerequisites(once)[0]).toBe(DESIGN_EMPATHIZE_HANDOFF);
		expect(fix({ ...withSpike, content: once })).toBe(once);
	});

	test("removes the paragraph from a skill with no membership", () => {
		const stale = utility.content.replace(
			"## Output",
			`## Prerequisites\n\n${DESIGN_EMPATHIZE_HANDOFF}\n\n## Output`,
		);
		const out = fix({ ...utility, content: stale });
		expect(out).not.toContain(HANDOFF_MARKER);
		expect(out).toContain("## Prerequisites\n\nNone.\n\n## Output");
	});

	test("matches the validator's handoffParagraph for every member of the real pack", () => {
		const real = loadWorkflows(path.join(repoRoot, "workflows"));
		const members = memberships(real);
		expect(members.size).toBe(245);
		for (const m of members.values()) {
			expect(handoffParagraph(m), m.name).toBe(
				validatorHandoff({
					phase: m.phase.phase,
					phaseTitle: m.phase.title,
					workflowTitle: m.workflow.title,
					workflowName: m.workflow.name,
					first: m.phase === m.workflow.phases[0],
				}),
			);
		}
	});

	test("a gated member keeps the handoff, gate and started order", () => {
		const [first, second] = prerequisites(fix(define));
		expect(first).toBe(handoffParagraph(defineMember));
		expect(second).toContain(DEFINE_LINE("started"));
	});
});

const STACK_TEXT =
	"**Stack.** Before you build, test, lint, run or generate code, read the `Stack` section of the project's `AGENTS.md`, or of `CLAUDE.md` when `AGENTS.md` has none. Use its commands exactly as written, its `layout` for where files go and its `rules` as requirements. If it names a `profile`, also read the file `<profile>.md` in the `stacks` folder of this skill's bundled references for the full commands, layout and rules; the project's own keys win where both speak. If there is no `Stack` section, run the `singular-detect` skill, state what you inferred in one line, and offer to write the section with `singular-init`. Never assume a package manager, test runner or formatter the project did not declare.";

describe("fix-skill-text: the stack step", () => {
	const stackUtility = skill(
		"coaching-code",
		"  stack-aware: true\n",
		"\n# Code Coaching\n\nCoach.\n\n## Prerequisites\n\nNone.\n\n## Process\n\n1. Go.\n\n## Output\n\nNotes.\n",
	);
	const stackMember = {
		...define,
		content: define.content.replace(
			"  artifact: 02-define.md\n",
			"  artifact: 02-define.md\n  stack-aware: true\n",
		),
	};

	test("the text is the spec's, verbatim, and matches the validator's", () => {
		expect(STACK_STEP).toBe(STACK_TEXT);
		expect(STACK_STEP.startsWith(STACK_MARKER)).toBe(true);
		expect(STACK_STEP).toBe(validatorStackStep);
	});

	test("reads metadata.stack-aware", () => {
		expect(stackAware(stackUtility.content)).toBe(true);
		expect(stackAware(utility.content)).toBe(false);
	});

	test("a stack-aware utility opens Prerequisites with the stack step and loses 'None.'", () => {
		const out = fix(stackUtility);
		expect(prerequisites(out)[0]).toBe(STACK_STEP);
		expect(out).not.toContain("None.");
		expect(fix({ ...stackUtility, content: out })).toBe(out);
	});

	test("a stack-aware member orders handoff, stack, gate-and-started", () => {
		const [first, second, third] = prerequisites(fix(stackMember));
		expect(first?.startsWith(HANDOFF_MARKER)).toBe(true);
		expect(second).toBe(STACK_STEP);
		expect(third?.startsWith(GATE_STEP)).toBe(true);
		expect(fix({ ...stackMember, content: fix(stackMember) })).toBe(fix(stackMember));
	});

	test("a skill that is not stack-aware loses a stale stack step", () => {
		const stale = utility.content.replace(
			"## Output",
			`## Prerequisites\n\n${STACK_STEP}\n\n## Output`,
		);
		const out = fix({ ...utility, content: stale });
		expect(out).not.toContain(STACK_MARKER);
		expect(out).toContain("## Prerequisites\n\nNone.\n\n## Output");
	});
});

const FIGMA_TEXT =
	"**Figma.** Steps marked *Figma* use a Figma MCP server you connect to this agent yourself; this pack ships none and makes no network calls. Before you ask the user anything or run the first such step, list the tools available to you and bind each capability the step names to one tool, as `references/figma-capabilities.md`, bundled with this skill, describes: the official Figma server's tool named there, else any tool whose description plainly does the same thing. With a capability bound, take the file key and node id from a Figma link in the request or the conversation, else from the `file:` line of the `## Tools` section of the latest earlier artifact of this project that has one; when a bound capability needs one and there is none, ask for the link once, with any other question you ask. With nothing bound, never ask for a link. Record the result in a `## Tools` section after any `## Recalled` section: a `- file:` line (the Design file; a board or a deck goes on a `- board:` or `- deck:` line), one line per bound capability (`- read-tokens: get_variable_defs (figma)`), and a `- created:` line for node ids you created; or the single line `No Figma server: steps marked Figma ran without one.`; a skill with no artifact says the same in its summary. For an unbound capability do what the step's *Without Figma* line says, using first any values the user gave in the request or in files it names: never ask the user to connect a server, never invent values a tool would have returned, and never report a step as run when it was not.";

describe("fix-skill-text: the figma step", () => {
	const figmaUtility = skill(
		"design-system-overview",
		"  figma-aware: true\n",
		"\n# System Overview\n\nOverview.\n\n## Prerequisites\n\nNone.\n\n## Process\n\n1. Go.\n\n## Output\n\nNotes.\n",
	);
	const figmaStackMember = {
		...define,
		content: define.content.replace(
			"  artifact: 02-define.md\n",
			"  artifact: 02-define.md\n  stack-aware: true\n  figma-aware: true\n",
		),
	};
	const figmaFirst = {
		...empathize,
		content: empathize.content.replace(
			"  artifact: 01-empathize.md\n",
			"  artifact: 01-empathize.md\n  figma-aware: true\n",
		),
	};

	test("the text is the spec's, verbatim, and matches the validator's", () => {
		expect(FIGMA_STEP).toBe(FIGMA_TEXT);
		expect(FIGMA_STEP.startsWith(FIGMA_MARKER)).toBe(true);
		expect(FIGMA_STEP).toBe(validatorFigmaStep);
	});

	test("reads metadata.figma-aware", () => {
		expect(figmaAware(figmaUtility.content)).toBe(true);
		expect(figmaAware(utility.content)).toBe(false);
	});

	test("a figma-aware utility opens Prerequisites with the figma step and loses 'None.'", () => {
		const out = fix(figmaUtility);
		expect(prerequisites(out)[0]).toBe(FIGMA_STEP);
		expect(out).not.toContain("None.");
		expect(fix({ ...figmaUtility, content: out })).toBe(out);
	});

	test("a figma-aware stack-aware member orders handoff, stack, figma, gate-and-started", () => {
		const out = fix(figmaStackMember);
		const [first, second, third, fourth] = prerequisites(out);
		expect(first?.startsWith(HANDOFF_MARKER)).toBe(true);
		expect(second).toBe(STACK_STEP);
		expect(third).toBe(FIGMA_STEP);
		expect(fourth?.startsWith(GATE_STEP)).toBe(true);
		expect(fix({ ...figmaStackMember, content: out })).toBe(out);
	});

	test("a first-phase figma-aware member orders handoff, recall, figma, started", () => {
		const out = fix(figmaFirst);
		const [first, second, third, fourth] = prerequisites(out);
		expect(first?.startsWith(HANDOFF_MARKER)).toBe(true);
		expect(second?.startsWith(RECALL_MARKER)).toBe(true);
		expect(third).toBe(FIGMA_STEP);
		expect(fourth?.startsWith("Before you start work")).toBe(true);
		expect(fix({ ...figmaFirst, content: out })).toBe(out);
	});

	test("a skill that is not figma-aware loses a stale figma step", () => {
		const stale = utility.content.replace(
			"## Output",
			`## Prerequisites\n\n${FIGMA_STEP}\n\n## Output`,
		);
		const out = fix({ ...utility, content: stale });
		expect(out).not.toContain(FIGMA_MARKER);
		expect(out).toContain("## Prerequisites\n\nNone.\n\n## Output");
	});
});

const RECALL_COMMON =
	"**Recall.** Before you ask the user anything, look for what this repository already holds about `<project>`: if a tool is available whose description says it searches or maps this repository (a memory or repo-map server such as `repo_map` or `entities`), query it for `<project>` and this phase's subject and read what it returns, keeping only results from this repository; in every case also list `.singularskills/*/<project>/` and read the **Decisions** and **Open questions** of any artifact there, and the lines of `.singularskills/log.jsonl` whose `project` is `<project>`.";
const RECALL_TAIL =
	" of at most ten lines naming what you found and where (path or tool), or the single line `Nothing recalled: no earlier artifacts, log lines or memory results for <project>.` Ask the user only what this did not answer. The trail's shape is described in `references/memory/trail.md`, bundled with this skill.";
const RECALL_SINGLE = `${RECALL_COMMON} After the frontmatter and title, add a \`## Recalled\` section${RECALL_TAIL}`;
const RECALL_SHARED = `${RECALL_COMMON} After your section's italic line, add a \`### Recalled\` subsection${RECALL_TAIL}`;

describe("fix-skill-text: the recall step", () => {
	const plan = skill(
		"development-plan",
		"  workflow: development\n  phase: 1\n  artifact: 01-plan.md\n  stack-aware: true\n",
		"\n# Plan\n\n## Prerequisites\n\nNone.\n\n## Process\n\n1. Go.\n\n## Output\n\nThe plan.\n",
	);
	const development: Workflow = {
		name: "development",
		title: "Plan-Build-Test-Ship",
		folder: "development",
		phases: [
			{
				phase: 1,
				title: "Plan",
				artifact: "01-plan.md",
				requires: [],
				skills: ["development-plan"],
			},
			{
				phase: 2,
				title: "Build",
				artifact: "02-build.md",
				requires: ["01-plan.md"],
				skills: ["development-build"],
			},
		],
	};
	const fixAll = fixSkillText([...workflows, development]);

	test("renders the single-writer and shared variants exactly, matching the validator", () => {
		expect(recallStep(false)).toBe(RECALL_SINGLE);
		expect(recallStep(true)).toBe(RECALL_SHARED);
		expect(recallStep(false)).toBe(validatorRecall(false));
		expect(recallStep(true)).toBe(validatorRecall(true));
		expect(recallStep(false).startsWith(RECALL_MARKER)).toBe(true);
	});

	test("a single-writer first phase gets the single variant after its handoff", () => {
		const [first, second, third] = prerequisites(fixAll(empathize));
		expect(first?.startsWith(HANDOFF_MARKER)).toBe(true);
		expect(second).toBe(RECALL_SINGLE);
		expect(third).toMatch(/^Before you start work, append this line/);
	});

	test("a shared first phase gets the shared variant", () => {
		expect(prerequisites(fixAll(research))[1]).toBe(RECALL_SHARED);
	});

	test("a later phase gets none and loses a stale one", () => {
		const stale = {
			...define,
			content: define.content.replace(
				"## Prerequisites\n\n",
				`## Prerequisites\n\n${RECALL_SINGLE}\n\n`,
			),
		};
		expect(fixAll(stale)).not.toContain(RECALL_MARKER);
		expect(fixAll(define)).not.toContain(RECALL_MARKER);
	});

	test("a first-phase stack-aware member orders handoff, recall, stack, started, and is idempotent", () => {
		const out = fixAll(plan);
		const [a, b, c, d] = prerequisites(out);
		expect(a?.startsWith(HANDOFF_MARKER)).toBe(true);
		expect(b).toBe(RECALL_SINGLE);
		expect(c).toBe(STACK_STEP);
		expect(d).toMatch(/^Before you start work, append this line/);
		expect(fixAll({ ...plan, content: out })).toBe(out);
	});

	test("matches the validator's recallStep for every first-phase member of the real pack", () => {
		const real = loadWorkflows(path.join(repoRoot, "workflows"));
		let count = 0;
		for (const m of memberships(real).values()) {
			if (m.phase !== m.workflow.phases[0]) continue;
			count += 1;
			const shared = m.phase.skills.length > 1 && !m.phase.artifact?.endsWith("/");
			expect(recallStep(shared), m.name).toBe(validatorRecall(shared));
		}
		expect(count).toBe(37);
	});
});

describe("fix-skill-text: the conductor's workflows block", () => {
	const real = loadWorkflows(path.join(repoRoot, "workflows"));
	const before =
		"## Files\n\nprose\n\n<!-- workflows:start -->\nold\n<!-- workflows:end -->\n\n## Run-log lines you write\n\nkeep\n";

	test("renders the design workflow's rows", () => {
		const block = workflowsBlock(real).join("\n");
		expect(block).toContain(
			"### design — Design Thinking (folder `design`, file `references/workflows/design.yml`)",
		);
		expect(block).toContain(
			"| 2 | Define | `02-define.md` |  | `01-empathize.md` | `design-define-component` |",
		);
	});

	test("renders a cross-domain phase's folder and an approval-only phase's empty artifact", () => {
		const block = workflowsBlock(real).join("\n");
		expect(block).toMatch(
			/\| 1 \| [^|]+ \| `01-discover.md` \| research \| {2}\| `research-discover` \|/,
		);
		expect(block).toMatch(/\| \d+ \| [^|]+ \| {2}\| [^|]* \| [^|]* \| `development-ship` \|/);
	});

	test("replaces the block between the markers and leaves the rest untouched", () => {
		const out = fixWorkflowsBlock(before, real);
		expect(out.startsWith("## Files\n\nprose\n\n<!-- workflows:start -->\n")).toBe(true);
		expect(out.endsWith("<!-- workflows:end -->\n\n## Run-log lines you write\n\nkeep\n")).toBe(
			true,
		);
		expect(out).not.toContain("\nold\n");
		expect(fixWorkflowsBlock(out, real)).toBe(out);
		expect(fixWorkflowsBlock("no markers here\n", real)).toBe("no markers here\n");
	});

	test("is applied to the workflow skill only", () => {
		const fixReal = fixSkillText(real);
		const conductor = { name: "workflow", domain: "singular", path: "", content: before };
		expect(fixReal(conductor)).toContain("### design — Design Thinking");
		const member = { name: "design-empathize", domain: "design", path: "", content: before };
		expect(fixReal(member)).toContain("<!-- workflows:start -->\nold\n<!-- workflows:end -->");
	});
});

describe("fix-skill-text: the Output block", () => {
	test("a single-writer member logs finished only, then gets frontmatter and closing sections", () => {
		const output = fix(define).slice(fix(define).indexOf("## Output"));
		expect(output).toContain(DEFINE_LINE("finished"));
		expect(output).not.toContain('"event":"started"');
		expect(output).not.toContain('"event":"refused"');
		expect(output).toContain("skill: design-define-component\nworkflow: design\nphase: 2\n");
		expect(output).toContain("gate: <passed|skipped>\n");
		expect(output).toContain("End the artifact with `## Decisions` and `## Open questions`");
		expect(output).not.toContain("or your section of a shared artifact");
		expect(output).toContain("## Decisions\n- <what was chosen> — <why> — <what was rejected>");
		expect(fix(define).trimEnd().endsWith("```")).toBe(true);
	});

	test("a gated shared member: frontmatter once, worst gate value, italic line with passed|skipped", () => {
		const out = fix(copywriting);
		expect(out).toMatch(/frontmatter is written once, by whoever creates the file/);
		expect(out).toContain("worst value among the sections");
		expect(out).toContain(
			"Open your `## Copywriting` section with one italic line, `*<skill name> · <ISO timestamp> · gate: <passed|skipped>*`",
		);
		expect(out).toContain("skill: Act\n");
		expect(out).toContain("### Decisions\n- <what was chosen>");
		expect(out).not.toMatch(/^## Decisions/m);
		expect(out).toContain('"event":"refused"');
	});

	test("an ungated shared member says gate: none everywhere and has no worst-value clause or refused line", () => {
		const out = fix(research);
		expect(out).toContain("gate: none\n---");
		expect(out).toContain("`*<skill name> · <ISO timestamp> · gate: none*`");
		expect(out).not.toContain("worst value");
		expect(out).not.toContain("<passed|skipped>");
		expect(out).not.toContain('"event":"refused"');
		expect(out).toContain('"event":"started"');
	});

	test("a utility gets no block, and loses one it had", () => {
		expect(fix(utility)).not.toContain("**Record the run.**");
		const withBlock = fix(define).slice(fix(define).indexOf("\n# Define"));
		const out = fix({ ...utility, content: frontmatter("development-debug", "") + withBlock });
		expect(out).not.toContain("**Record the run.**");
		expect(out).not.toContain("## Decisions");
	});

	test("goes before a disclaimer instruction, which stays last", () => {
		const content = `${define.content.trimEnd()}\n\n${DISCLAIMER_INSTRUCTION}\n\n> **Not legal.**\n`;
		const out = fix({ ...define, content });
		expect(out.trimEnd().endsWith("> **Not legal.**")).toBe(true);
		expect(out.indexOf("## Decisions")).toBeLessThan(out.indexOf(DISCLAIMER_INSTRUCTION));
	});

	test("replaces an outdated block in place", () => {
		const once = fix(define);
		const stale = once.replace(
			"End the artifact with `## Decisions`",
			"End the artifact (or your section of a shared artifact) with `## Decisions`",
		);
		expect(fix({ ...define, content: stale })).toBe(once);
	});
});

test("fix-skill-text is idempotent", () => {
	for (const s of [define, copywriting, research, utility]) {
		const once = fix(s);
		expect(fix({ ...s, content: once })).toBe(once);
	}
});

test("the real pack is in sync with its workflows", () => {
	const real = fixSkillText(loadWorkflows(path.join(repoRoot, "workflows")));
	const drift = listSkills(path.join(repoRoot, "skills"))
		.filter((s) => real(s) !== s.content)
		.map((s) => s.name);
	expect(drift).toEqual([]);
});
