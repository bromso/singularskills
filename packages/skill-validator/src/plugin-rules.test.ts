import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseSkill } from "./parse-skill.js";
import {
	COMPUTE_WITH_CODE_PARAGRAPH,
	COMPUTE_WITH_CODE_PLUGINS,
	DISCLAIMER_GROUPS,
	DISCLAIMER_INSTRUCTION,
	DISCLAIMER_TEXT,
	FIGMA_MARKER,
	FIGMA_STEP,
	type HandoffFields,
	type PackContext,
	RECALL_MARKER,
	STACK_STEP,
	STANDARD_ARGS_PARAGRAPH,
	buildPackContext,
	handoffParagraph,
	recallStep,
	standardArgsParagraph,
	validatePackSkill,
	validateSkillRefs,
} from "./plugin-rules.js";
import type { ValidationIssue } from "./rules.js";
import type { Workflow } from "./workflows.js";

const designWorkflow: Workflow = {
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
			skills: ["design-define-component", "design-define-token"],
		},
	],
};

const ctx: PackContext = {
	skillNames: [
		"design-define-component",
		"design-define-token",
		"design-empathize",
		"development-plan",
		"singular-init",
	],
	workflows: [designWorkflow],
	multiWriterFiles: new Map([
		["design/02-define.md", ["design-define-component", "design-define-token"]],
	]),
	referenceFiles: [
		"references/design/wcag-criteria.md",
		"references/memory/trail.md",
		"references/design/guides/one.md",
		"skills/development-plan/references/plan-template.md",
	],
};

/** The handoff paragraph every member fixture of design phase 1 must open Prerequisites with. */
const EMPATHIZE_HANDOFF = handoffParagraph({
	phase: 1,
	phaseTitle: "Empathize",
	workflowTitle: "Design Thinking",
	workflowName: "design",
	first: true,
});

/** Frontmatter for skill `name` with optional extra `metadata` lines. */
function fm(name: string, metadata = '  argument-hint: "[project]"\n'): string {
	return `---\nname: ${name}\ndescription: Plan x\nmetadata:\n${metadata}---\n`;
}

/** Validate `body` as skill `name` (default `development-plan`) at skills/<name>/SKILL.md. */
function runAs(name: string, body: string, front = fm(name)): ValidationIssue[] {
	return validatePackSkill(parseSkill(`${front}${body}`, `/r/skills/${name}/SKILL.md`), ctx);
}

const run = (body: string) => runAs("development-plan", body);

function rules(issues: ValidationIssue[]): string[] {
	return issues.map((i) => i.rule);
}

describe("buildPackContext", () => {
	const root = join(import.meta.dirname, "__pack_ctx_fixtures__");

	afterEach(() => rmSync(root, { recursive: true, force: true }));

	it("collects skills, workflows, multi-writer phase files and reference files", () => {
		const files: Record<string, string> = {
			"skills/design-empathize/SKILL.md": "x",
			"skills/design-define-component/SKILL.md": "x",
			"skills/design-define-token/SKILL.md": "x",
			"skills/design-define-token/references/token-guide.md": "x",
			"references/design/wcag-criteria.md": "x",
			"workflows/design.yml": [
				"name: design",
				"title: Design Thinking",
				"folder: design",
				"phases:",
				"  - phase: 1",
				"    title: Empathize",
				"    artifact: 01-empathize.md",
				"    requires: []",
				"    skills: [design-empathize]",
				"  - phase: 2",
				"    title: Define",
				"    artifact: 02-define.md",
				"    requires: [01-empathize.md]",
				"    skills: [design-define-component, design-define-token]",
				"",
			].join("\n"),
			"workflows/build.yml": [
				"name: build",
				"title: Build",
				"folder: build",
				"phases:",
				"  - phase: 1",
				"    title: Define it",
				"    folder: design",
				"    artifact: 02-define.md",
				"    requires: []",
				"    skills: [design-define-component]",
				"",
			].join("\n"),
		};
		for (const [file, content] of Object.entries(files)) {
			mkdirSync(join(root, file, ".."), { recursive: true });
			writeFileSync(join(root, file), content);
		}

		const built = buildPackContext(root);
		expect(built.skillNames).toEqual([
			"design-define-component",
			"design-define-token",
			"design-empathize",
		]);
		expect(built.workflows.map((wf) => wf.name)).toEqual(["build", "design"]);
		expect(built.multiWriterFiles).toEqual(
			new Map([["design/02-define.md", ["design-define-component", "design-define-token"]]]),
		);
		expect(built.referenceFiles).toEqual([
			"references/design/wcag-criteria.md",
			"skills/design-define-token/references/token-guide.md",
		]);
	});

	it("treats a missing workflows/ directory as no workflows", () => {
		mkdirSync(join(root, "skills/development-plan"), { recursive: true });
		writeFileSync(join(root, "skills/development-plan/SKILL.md"), "x");
		expect(buildPackContext(root).workflows).toEqual([]);
	});
});

describe("frontmatter-shape", () => {
	it("accepts name, description, allowed-tools and metadata with the known keys", () => {
		const front =
			'---\nname: design-empathize\ndescription: Plan x\nallowed-tools: Read\nmetadata:\n  argument-hint: "[project]"\n  disable-model-invocation: true\n  workflow: design\n  phase: 1\n  artifact: 01-empathize.md\n---\n';
		expect(
			runAs(
				"design-empathize",
				`# X\n\n## Prerequisites\n\n${EMPATHIZE_HANDOFF}\n\n${recallStep(false)}\n`,
				front,
			),
		).toEqual([]);
	});

	it("flags an unknown top-level key", () => {
		const front = "---\nname: development-plan\ndescription: Plan x\nmodel: haiku\n---\n";
		const issues = runAs("development-plan", "# X\n", front);
		expect(rules(issues)).toEqual(["frontmatter-shape"]);
		expect(issues[0].severity).toBe("error");
		expect(issues[0].message).toContain("model");
	});

	it("flags a top-level argument-hint (it belongs under metadata)", () => {
		const front =
			'---\nname: development-plan\ndescription: Plan x\nargument-hint: "[project]"\n---\n';
		expect(rules(runAs("development-plan", "# X\n", front))).toEqual(["frontmatter-shape"]);
	});

	it("flags an unknown metadata key", () => {
		const issues = runAs("development-plan", "# X\n", fm("development-plan", "  owner: me\n"));
		expect(rules(issues)).toEqual(["frontmatter-shape"]);
		expect(issues[0].message).toContain("owner");
	});
});

describe("standardArgsParagraph", () => {
	it("is the run-log paragraph with the workflow filled in", () => {
		expect(standardArgsParagraph("security", "first-token")).toBe(
			'**Arguments.** `$ARGUMENTS` may contain the project name and optional flags. Take the first token as `<project>` and treat `--skip-checks` as a flag; never include flags in file paths. All paths below use `<project>`. If `--skip-checks` is present, skip the prerequisite check and, **before writing any artifact**, append one line to `.singularskills/log.jsonl`: `{"ts":"<ISO timestamp>","skill":"<skill name>","workflow":"security","phase":<phase>,"project":"<project>","event":"skipped","artifact":"<artifact file>","note":"<reason or \\"none given\\">"}`.',
		);
		expect(standardArgsParagraph("security", "first-token")).toBe(
			STANDARD_ARGS_PARAGRAPH.replace("<workflow>", "security"),
		);
	});

	it("basename variant swaps only the slug sentence", () => {
		const text = standardArgsParagraph("coaching", "basename");
		expect(text).toContain(
			"Derive `<project>` from the argument by taking its basename without extension and treat `--skip-checks` as a flag",
		);
		expect(text).not.toContain("Take the first token");
		expect(text).toContain('"workflow":"coaching"');
	});
});

/** The paragraph as the utility `development-plan` must carry it: literal name, `null` phase. */
const UTILITY = { skill: "development-plan", phase: null };
const paragraph = (workflow: string) => standardArgsParagraph(workflow, "first-token", UTILITY);

describe("no-args-in-path", () => {
	it("flags $ARGUMENTS inside a .singularskills path", () => {
		expect(rules(run("Write `.singularskills/development/$ARGUMENTS/01-plan.md`."))).toEqual([
			"no-args-in-path",
		]);
	});

	it("accepts <project> paths and $ARGUMENTS in prose", () => {
		expect(
			run('Plan "$ARGUMENTS". Write `.singularskills/development/<project>/01-plan.md`.'),
		).toEqual([]);
	});
});

describe("artifact-root", () => {
	it("accepts the skill's own folder and the run log", () => {
		expect(
			run(
				"Write `.singularskills/development/<project>/01-plan.md`; log to `.singularskills/log.jsonl`.",
			),
		).toEqual([]);
	});

	it("accepts the artifact root itself, as the gate step names it", () => {
		expect(run("Run it from the folder that contains `.singularskills/`.")).toEqual([]);
		expect(rules(run("Write `.singularskills/other/x.md`."))).toEqual(["artifact-root"]);
	});

	it("accepts a phase member's workflow folder", () => {
		const front = fm(
			"design-empathize",
			'  argument-hint: "[project]"\n  workflow: design\n  phase: 1\n  artifact: 01-empathize.md\n',
		);
		expect(
			runAs(
				"design-empathize",
				`## Prerequisites\n\n${EMPATHIZE_HANDOFF}\n\n${recallStep(false)}\n\nWrite \`.singularskills/design/<project>/01-empathize.md\`.`,
				front,
			),
		).toEqual([]);
	});

	it("flags another domain's folder and .project/ paths", () => {
		expect(rules(run("Write `.singularskills/design/<project>/01-plan.md`."))).toEqual([
			"artifact-root",
		]);
		expect(rules(run("Read `.project/<project>/00-initiate.md`."))).toEqual(["artifact-root"]);
	});

	it("lets singular-* skills read anywhere under .singularskills/", () => {
		expect(
			runAs(
				"singular-init",
				"Read `.singularskills/design/<project>/01-define.md`, `.singularskills/config.md` and `.singularskills/reports/`.",
			),
		).toEqual([]);
	});

	it("allows the listed cross-domain reads only", () => {
		expect(
			runAs("coaching-copy", "Look for `.singularskills/branding/<brand>/03-verbal.md`."),
		).toEqual([]);
		expect(runAs("branding-voice", "Read `.singularskills/marketing/<project>/x.md`.")).toEqual([]);
		expect(
			rules(runAs("coaching-copy", "Write `.singularskills/security/<project>/x.md`.")),
		).toEqual(["artifact-root"]);
	});

	it("lets ai skills read research, support, analytics, development and compliance only", () => {
		const reads =
			"Read `.singularskills/research/<p>/`, `.singularskills/support/<p>/`, `.singularskills/analytics/<p>/`, `.singularskills/development/<p>/` and `.singularskills/compliance/<p>/`.";
		expect(rules(runAs("ai-red-team", reads))).not.toContain("artifact-root");
		expect(rules(runAs("ai-red-team", "Read `.singularskills/legal/<p>/x.md`."))).toContain(
			"artifact-root",
		);
	});

	it("lets analytics skills read research, marketing, finance and support only", () => {
		const reads =
			"Read `.singularskills/research/<p>/`, `.singularskills/marketing/<p>/`, `.singularskills/finance/<p>/` and `.singularskills/support/<p>/`.";
		expect(rules(runAs("analytics-investigate", reads))).not.toContain("artifact-root");
		expect(
			rules(runAs("analytics-investigate", "Read `.singularskills/legal/<p>/x.md`.")),
		).toContain("artifact-root");
	});

	it("lets support skills read research, marketing and branding only", () => {
		expect(
			rules(
				runAs(
					"support-reply",
					"Read `.singularskills/research/<project>/`, `.singularskills/marketing/<project>/` and `.singularskills/branding/<project>/03-verbal.md`.",
				),
			),
		).not.toContain("artifact-root");
		expect(rules(runAs("support-reply", "Read `.singularskills/legal/<project>/x.md`."))).toContain(
			"artifact-root",
		);
	});

	it("flags any legacy .metapowers/ path, even for singular-* skills", () => {
		const issues = run("Write `.metapowers/development/<project>/01-plan.md`.");
		expect(rules(issues)).toEqual(["artifact-root"]);
		expect(issues[0].message).toContain("legacy artifact root");
		expect(rules(runAs("singular-init", "Create .metapowers/config.md first."))).toEqual([
			"artifact-root",
		]);
	});
});

describe("skill-ref-exists", () => {
	it("accepts a reference to an existing flat skill", () => {
		expect(run("Run `/design-define-component <project>` first.")).toEqual([]);
	});

	it("flags a reference to a nonexistent skill, suggesting the closest match by prefix", () => {
		const issues = run("Run `/design-define <project>` first.");
		expect(rules(issues)).toEqual(["skill-ref-exists"]);
		expect(issues[0].message).toContain("/design-define");
		expect(issues[0].message).toContain("design-define-component");
	});

	it("omits the suggestion when no skill name starts with the reference", () => {
		const issues = run("Run `/design-zzz <project>` first.");
		expect(rules(issues)).toEqual(["skill-ref-exists"]);
		expect(issues[0].message).not.toContain("Did you mean");
	});

	it("ignores tokens without a known domain prefix and path segments", () => {
		expect(run("See /docs-foo, `/usr/bin` and `/design/` or `/file/` in the URL.")).toEqual([]);
	});

	it("flags a legacy /<domain>:<skill> reference", () => {
		const issues = run("Run `/design:empathize <project>` first.");
		expect(rules(issues)).toEqual(["skill-ref-exists"]);
		expect(issues[0].message).toContain("legacy skill reference");
		expect(issues[0].message).toContain("/design-empathize");
		expect(rules(run("See /metapowers:init."))).toEqual(["skill-ref-exists"]);
	});

	it("checks references in the description", () => {
		const front = (description: string) =>
			`---\nname: development-plan\ndescription: ${description}\nmetadata:\n  argument-hint: "[project]"\n---\n`;
		expect(
			runAs("development-plan", "Body.", front("Plan x. Not for x; see /design-empathize.")),
		).toEqual([]);
		expect(
			rules(runAs("development-plan", "Body.", front("Plan x. Not for x; see /design-nope."))),
		).toEqual(["skill-ref-exists"]);
	});

	it("is the only rule validateSkillRefs runs", () => {
		const doc = parseSkill(
			"# Guide\n\n1. `/design-nope <x>`\n2. Write `.metapowers/x/y.md`\n",
			"/r/references/design/guide.md",
		);
		expect(rules(validateSkillRefs(doc, ctx))).toEqual(["skill-ref-exists"]);
	});
});

describe("reference-resolvable", () => {
	it("accepts a reference in the skill's own references/ or its domain's canonical folder", () => {
		expect(run("Use `references/plan-template.md`.")).toEqual([]);
		expect(runAs("design-empathize", "Use `references/wcag-criteria.md#aa`.")).toEqual([]);
		expect(runAs("design-empathize", "Read `references/guides/`.")).toEqual([]);
	});

	it("flags a reference that resolves nowhere", () => {
		const issues = run("Use `references/wcag-criteria.md`.");
		expect(rules(issues)).toEqual(["reference-resolvable"]);
		expect(issues[0].message).toContain("skills/development-plan/references/wcag-criteria.md");
	});

	it("resolves a stacks/ or memory/ link to the shared folder, whatever the skill's domain", () => {
		const shared: PackContext = {
			...ctx,
			referenceFiles: [...ctx.referenceFiles, "references/stacks/bun-react-ts.md"],
		};
		const body = "Read `references/stacks/bun-react-ts.md` and `references/memory/missing.md`.";
		const parsed = parseSkill(
			`${fm("development-plan")}${body}`,
			"/r/skills/development-plan/SKILL.md",
		);
		const issues = validatePackSkill(parsed, shared);
		expect(rules(issues)).toEqual(["reference-resolvable"]);
		expect(issues[0].message).toContain("references/memory/missing.md");
		expect(issues[0].message).not.toContain("references/development/memory");
	});
});

describe("stack-step", () => {
	const stackFront = fm("development-build", '  argument-hint: "[project]"\n  stack-aware: true\n');
	const memberFront = fm(
		"design-define-component",
		'  argument-hint: "[project]"\n  workflow: design\n  phase: 2\n  artifact: 02-define.md\n  stack-aware: true\n',
	);
	const defineHandoff = handoffParagraph({
		phase: 2,
		phaseTitle: "Define",
		workflowTitle: "Design Thinking",
		workflowName: "design",
		first: false,
	});

	it("accepts a stack-aware utility whose Prerequisites open with the stack step", () => {
		expect(
			rules(
				runAs("development-build", `# Build\n\n## Prerequisites\n\n${STACK_STEP}\n`, stackFront),
			),
		).not.toContain("stack-step");
	});

	it("accepts a stack-aware member carrying the step right after its handoff", () => {
		const body = `# Define\n\n## Prerequisites\n\n${defineHandoff}\n\n${STACK_STEP}\n\nRun the gate.\n`;
		expect(rules(runAs("design-define-component", body, memberFront))).not.toContain("stack-step");
	});

	it("rejects a stack-aware skill without the step, or with it in the wrong place", () => {
		expect(
			rules(runAs("development-build", "# Build\n\n## Prerequisites\n\nNone.\n", stackFront)),
		).toContain("stack-step");
		const late = `# Define\n\n## Prerequisites\n\n${defineHandoff}\n\nRun the gate.\n\n${STACK_STEP}\n`;
		expect(rules(runAs("design-define-component", late, memberFront))).toContain("stack-step");
	});

	it("requires a stack-aware skill to link every profile under references/stacks/", () => {
		const withProfiles: PackContext = {
			...ctx,
			referenceFiles: [
				...ctx.referenceFiles,
				"references/stacks/README.md",
				"references/stacks/bun-react-ts.md",
				"references/stacks/rust-gpui.md",
			],
		};
		const linked = `# Build\n\n## Prerequisites\n\n${STACK_STEP}\n\n## References\n\n- \`references/stacks/bun-react-ts.md\` and \`references/stacks/rust-gpui.md\`\n`;
		const one = `# Build\n\n## Prerequisites\n\n${STACK_STEP}\n\n## References\n\n- \`references/stacks/bun-react-ts.md\`\n`;
		const parsedLinked = parseSkill(
			`${stackFront}${linked}`,
			"/r/skills/development-build/SKILL.md",
		);
		const parsedOne = parseSkill(`${stackFront}${one}`, "/r/skills/development-build/SKILL.md");
		expect(rules(validatePackSkill(parsedLinked, withProfiles))).not.toContain("stack-step");
		const issues = validatePackSkill(parsedOne, withProfiles);
		expect(rules(issues)).toContain("stack-step");
		expect(issues.find((i) => i.rule === "stack-step")?.message).toContain("rust-gpui.md");
	});

	it("rejects a skill that is not stack-aware but carries the marker", () => {
		expect(rules(run(`## Prerequisites\n\n${STACK_STEP}\n`))).toContain("stack-step");
	});

	it("frontmatter-shape accepts stack-aware: true and rejects a non-boolean", () => {
		expect(
			rules(runAs("development-build", `## Prerequisites\n\n${STACK_STEP}\n`, stackFront)),
		).not.toContain("frontmatter-shape");
		const yes = fm("development-build", '  argument-hint: "[project]"\n  stack-aware: yes\n');
		expect(rules(runAs("development-build", "# B\n", yes))).toContain("frontmatter-shape");
	});
});

describe("recall-step", () => {
	const empathizeFront = fm(
		"design-empathize",
		'  argument-hint: "[project]"\n  workflow: design\n  phase: 1\n  artifact: 01-empathize.md\n',
	);
	const defineFront = fm(
		"design-define-component",
		'  argument-hint: "[project]"\n  workflow: design\n  phase: 2\n  artifact: 02-define.md\n',
	);
	const defineHandoff = handoffParagraph({
		phase: 2,
		phaseTitle: "Define",
		workflowTitle: "Design Thinking",
		workflowName: "design",
		first: false,
	});

	it("renders single and shared variants, differing only in the section heading", () => {
		const single = "After the frontmatter and title, add a `## Recalled` section";
		const shared = "After your section's italic line, add a `### Recalled` subsection";
		expect(recallStep(false)).toContain(single);
		expect(recallStep(true)).toContain(shared);
		expect(recallStep(false).startsWith(RECALL_MARKER)).toBe(true);
		expect(recallStep(false)).not.toContain("past work");
		expect(recallStep(false)).toContain("keeping only results from this repository");
		expect(recallStep(false).replace(single, shared)).toBe(recallStep(true));
	});

	it("accepts a first-phase single member carrying the single variant after its handoff", () => {
		const body = `# E\n\n## Prerequisites\n\n${EMPATHIZE_HANDOFF}\n\n${recallStep(false)}\n`;
		expect(rules(runAs("design-empathize", body, empathizeFront))).not.toContain("recall-step");
	});

	it("rejects a first-phase member without it, or with the shared variant on a single-writer phase", () => {
		expect(
			rules(
				runAs(
					"design-empathize",
					`# E\n\n## Prerequisites\n\n${EMPATHIZE_HANDOFF}\n`,
					empathizeFront,
				),
			),
		).toContain("recall-step");
		const wrong = `# E\n\n## Prerequisites\n\n${EMPATHIZE_HANDOFF}\n\n${recallStep(true)}\n`;
		expect(rules(runAs("design-empathize", wrong, empathizeFront))).toContain("recall-step");
	});

	it("rejects a later-phase member or a utility carrying the marker", () => {
		const late = `# D\n\n## Prerequisites\n\n${defineHandoff}\n\n${recallStep(false)}\n`;
		expect(rules(runAs("design-define-component", late, defineFront))).toContain("recall-step");
		expect(rules(run(`## Prerequisites\n\n${recallStep(false)}\n`))).toContain("recall-step");
	});
});

describe("workflow-handoff", () => {
	const memberFront = fm(
		"design-define-component",
		'  argument-hint: "[project]"\n  workflow: design\n  phase: 2\n  artifact: 02-define.md\n',
	);
	const fields: HandoffFields = {
		phase: 2,
		phaseTitle: "Define",
		workflowTitle: "Design Thinking",
		workflowName: "design",
		first: false,
	};

	it("asks 'just this step or the whole workflow' only in the first-phase variant", () => {
		expect(EMPATHIZE_HANDOFF).toContain('"Just this step, or the whole Design Thinking workflow?"');
		expect(handoffParagraph(fields)).toContain("a later phase runs on its own, behind its gate");
		expect(handoffParagraph(fields)).not.toContain("Just this step");
	});

	it("rejects a first-phase member carrying the later-phase variant", () => {
		const front = fm(
			"design-empathize",
			'  argument-hint: "[project]"\n  workflow: design\n  phase: 1\n  artifact: 01-empathize.md\n',
		);
		const later = handoffParagraph({ ...fields, phase: 1, phaseTitle: "Empathize" });
		expect(
			rules(runAs("design-empathize", `# E\n\n## Prerequisites\n\n${later}\n`, front)),
		).toContain("workflow-handoff");
	});
	const member = (prerequisites: string) =>
		runAs(
			"design-define-component",
			`# Define\n\n## Prerequisites\n\n${prerequisites}\n\n## Process\n\n1. Go.\n`,
			memberFront,
		);

	it("renders the paragraph with the member's values", () => {
		const text = handoffParagraph(fields);
		expect(
			text.startsWith(
				"**Part of a workflow.** This skill is phase 2 (Define) of the Design Thinking workflow (`design`);",
			),
		).toBe(true);
		expect(text).toContain("or `design` when they named none");
		expect(text).not.toContain("<workflow name>");
	});

	it("accepts a member whose Prerequisites open with its own handoff paragraph", () => {
		expect(rules(member(handoffParagraph(fields)))).not.toContain("workflow-handoff");
	});

	it("rejects a member without the paragraph", () => {
		expect(rules(member("None."))).toContain("workflow-handoff");
	});

	it("rejects a member whose paragraph carries another phase's values", () => {
		expect(
			rules(member(handoffParagraph({ ...fields, phase: 1, phaseTitle: "Empathize" }))),
		).toContain("workflow-handoff");
	});

	it("rejects a member whose paragraph is not the first paragraph of Prerequisites", () => {
		expect(rules(member(`Run the gate first.\n\n${handoffParagraph(fields)}`))).toContain(
			"workflow-handoff",
		);
	});

	it("rejects a utility that contains the marker", () => {
		expect(rules(run(`## Prerequisites\n\n${handoffParagraph(fields)}\n`))).toContain(
			"workflow-handoff",
		);
	});

	it("leaves a member whose workflow or phase is unknown to the other rules", () => {
		const front = fm(
			"design-define-component",
			'  argument-hint: "[project]"\n  workflow: nope\n  phase: 2\n  artifact: 02-define.md\n',
		);
		expect(
			rules(runAs("design-define-component", "# Define\n\n## Prerequisites\n\nNone.\n", front)),
		).not.toContain("workflow-handoff");
	});
});

describe("skip-checks-standard", () => {
	it("flags --skip-checks without the standard paragraph", () => {
		expect(rules(run("If `--skip-checks` is present in $ARGUMENTS, skip this check."))).toEqual([
			"skip-checks-standard",
		]);
	});

	it("flags the paragraph for a different workflow", () => {
		expect(rules(run(paragraph("design")))).toContain("skip-checks-standard");
	});

	it("accepts the standard paragraph (first-token and basename variants)", () => {
		expect(run(`${paragraph("development")}\n\nor use \`--skip-checks\` to bypass.`)).toEqual([]);
		expect(run(standardArgsParagraph("development", "basename", UTILITY))).toEqual([]);
	});

	it("flags a paragraph whose skipped line keeps the placeholders", () => {
		expect(rules(run(standardArgsParagraph("development", "first-token")))).toContain(
			"skip-checks-standard",
		);
	});

	it("requires a phase member's literal phase and artifact", () => {
		const front = fm(
			"design-define-component",
			'  argument-hint: "[project]"\n  workflow: design\n  phase: 2\n  artifact: 02-define.md\n',
		);
		const literal = standardArgsParagraph("design", "first-token", {
			skill: "design-define-component",
			phase: 2,
			artifact: "02-define.md",
		});
		expect(literal).toContain(
			'"skill":"design-define-component","workflow":"design","phase":2,"project":"<project>","event":"skipped","artifact":"02-define.md"',
		);
		expect(rules(runAs("design-define-component", literal, front))).not.toContain(
			"skip-checks-standard",
		);
		const utility = standardArgsParagraph("design", "first-token", {
			skill: "design-define-component",
			phase: null,
		});
		expect(rules(runAs("design-define-component", utility, front))).toContain(
			"skip-checks-standard",
		);
	});

	it("ignores skills that never mention --skip-checks", () => {
		expect(run("No flags here.")).toEqual([]);
	});
});

describe("phase-file-append", () => {
	const front = (name: string) =>
		fm(
			name,
			'  argument-hint: "[project]"\n  workflow: design\n  phase: 2\n  artifact: 02-define.md\n',
		);
	const appendLine =
		"5. **Write the artifact** — append to `.singularskills/design/<project>/02-define.md` under a `## Alpha` section. Create the file with a `# Define — <project>` heading if it does not exist; if a `## Alpha` section already exists, replace only that section.";
	const partialAppendLine =
		"5. **Write the artifact** — append to `.singularskills/design/<project>/02-define.md` under a `## Delta` section:";
	const toLine =
		"5. **Write the artifact** to `.singularskills/design/<project>/02-define.md` with heading:";

	const check = (name: string, body: string) =>
		rules(runAs(name, `# X\n\n${body}\n`, front(name))).filter((r) => r === "phase-file-append");

	it("accepts the append wording on a multi-writer phase file", () => {
		expect(check("design-define-component", appendLine)).toEqual([]);
	});

	it("flags overwriting or partial append wording on a multi-writer phase file", () => {
		expect(check("design-define-token", toLine)).toEqual(["phase-file-append"]);
		expect(check("design-define-token", partialAppendLine)).toEqual(["phase-file-append"]);
	});

	it("accepts the template followed by a trailing sentence", () => {
		expect(check("design-define-component", `${appendLine} The section contains:`)).toEqual([]);
	});

	it("flags append wording that drops the create-the-file clause", () => {
		const noCreate =
			"5. **Write the artifact** — append to `.singularskills/design/<project>/02-define.md` under a `## Alpha` section; if a `## Alpha` section already exists, replace only that section.";
		expect(check("design-define-token", noCreate)).toEqual(["phase-file-append"]);
	});

	it("flags 'append to' that is not attached to the path", () => {
		const detached =
			"5. **Write the artifact** to `.singularskills/design/<project>/02-define.md` — append to it; replace only that section.";
		expect(check("design-define-token", detached)).toEqual(["phase-file-append"]);
	});

	it("ignores files of single-skill phases", () => {
		expect(
			check(
				"design-empathize",
				"5. **Write the artifact** to `.singularskills/design/<project>/01-empathize.md` with heading:",
			),
		).toEqual([]);
	});
});

function runRaw(content: string, filePath = "/r/skills/development-plan/SKILL.md") {
	return rules(validatePackSkill(parseSkill(content, filePath), ctx));
}

describe("name-matches-dir", () => {
	it("accepts a name equal to the skill directory", () => {
		expect(runRaw("---\nname: development-plan\ndescription: Plan x\n---\n# Plan\n")).toEqual([]);
	});

	it("rejects a mismatched or invalid name", () => {
		expect(runRaw("---\nname: plan\ndescription: Plan x\n---\n# Plan\n")).toEqual([
			"name-matches-dir",
		]);
		expect(runRaw("---\ndescription: Plan x\n---\n# Plan\n")).toEqual(["name-matches-dir"]);
		expect(
			runRaw("---\nname: Plan_X\ndescription: Plan x\n---\n# Plan\n", "/r/skills/Plan_X/SKILL.md"),
		).toEqual(["name-matches-dir"]);
		const long = "a".repeat(65);
		expect(
			runRaw(
				`---\nname: ${long}\ndescription: Plan x\n---\n# Plan\n`,
				`/r/skills/${long}/SKILL.md`,
			),
		).toEqual(["name-matches-dir"]);
	});
});

describe("argument-hint-present", () => {
	const front = (metadata: string) =>
		`---\nname: development-plan\ndescription: Plan x\n${metadata}---\n`;

	it("reads metadata.argument-hint for Arguments-paragraph skills only", () => {
		expect(runRaw(`${front("")}${paragraph("development")}\n`)).toEqual(["argument-hint-present"]);
		expect(
			runRaw(`${front("")}${standardArgsParagraph("development", "basename", UTILITY)}\n`),
		).toEqual(["argument-hint-present"]);
		expect(
			runRaw(`${front('metadata:\n  argument-hint: ""\n')}${paragraph("development")}\n`),
		).toEqual(["argument-hint-present"]);
		expect(
			runRaw(
				`${front('metadata:\n  argument-hint: "[project] [--skip-checks]"\n')}${paragraph("development")}\n`,
			),
		).toEqual([]);
		expect(runRaw(`${front("")}Plan "$ARGUMENTS" freely.\n`)).toEqual([]);
	});
});

describe("frontmatter-key-order", () => {
	it("warns on description before name", () => {
		const issues = validatePackSkill(
			parseSkill(
				"---\ndescription: Plan x\nname: development-plan\n---\n# Plan\n",
				"/r/skills/development-plan/SKILL.md",
			),
			ctx,
		);
		expect(issues).toEqual([
			expect.objectContaining({ rule: "frontmatter-key-order", severity: "warning" }),
		]);
	});

	it("accepts name, description, then the other keys", () => {
		expect(
			runRaw(
				'---\nname: development-plan\ndescription: Plan x\nallowed-tools: Read\nmetadata:\n  argument-hint: "[project]"\n---\n# Plan\n',
			),
		).toEqual([]);
	});

	it("warns when metadata comes before name and description", () => {
		expect(
			runRaw(
				'---\nmetadata:\n  argument-hint: "[project]"\nname: development-plan\ndescription: Plan x\n---\n# Plan\n',
			),
		).toEqual(["frontmatter-key-order"]);
	});
});

const MONEY_QUOTE =
	"> **Not financial or tax advice.** This artifact is generated analysis for review by a qualified accountant or financial professional before any filing, reporting or decision relies on it.";

describe("disclaimer constants", () => {
	it("match spec §5 verbatim", () => {
		expect(DISCLAIMER_INSTRUCTION).toBe("End the artifact with this paragraph, verbatim:");
		expect(DISCLAIMER_TEXT.money).toBe(MONEY_QUOTE);
		expect(DISCLAIMER_TEXT.compliance).toBe(
			"> **Not legal or audit advice.** This artifact supports preparation for compliance work; certification, attestation and regulatory conclusions require a qualified auditor or counsel.",
		);
		expect(DISCLAIMER_TEXT.security).toBe(
			"> **Not a penetration test or audit.** This artifact is generated analysis; validate findings against the live system and have material controls reviewed by a qualified security professional.",
		);
		expect(DISCLAIMER_GROUPS).toEqual({
			finance: "money",
			accounting: "money",
			bookkeeping: "money",
			compliance: "compliance",
			security: "security",
		});
	});
});

describe("disclaimer-present", () => {
	const output = (tail: string) =>
		`# X\n\n${COMPUTE_WITH_CODE_PARAGRAPH}\n\n## Output\n\nPresent:\n- Totals${tail}`;
	const good = `\n\n${DISCLAIMER_INSTRUCTION}\n\n${MONEY_QUOTE}\n`;

	it("accepts the instruction and the domain group's blockquote as the end of ## Output", () => {
		expect(runAs("finance-ratios", output(good))).toEqual([]);
		expect(
			runAs(
				"security-threat-model",
				`# X\n\n## Output\n\n- Findings\n\n${DISCLAIMER_INSTRUCTION}\n\n${DISCLAIMER_TEXT.security}\n\n`,
			),
		).toEqual([]);
	});

	it("accepts a disclaimer following another blockquote", () => {
		expect(
			runAs(
				"security-threat-model",
				`# X\n\n## Output\n\n> **Note:** other\n\n${DISCLAIMER_INSTRUCTION}\n\n${DISCLAIMER_TEXT.security}\n`,
			),
		).toEqual([]);
	});

	it("flags a missing disclaimer", () => {
		expect(rules(runAs("compliance-gdpr", "# X\n\n## Output\n\n- Gaps\n"))).toEqual([
			"disclaimer-present",
		]);
	});

	it("flags a skill with no ## Output section", () => {
		expect(rules(runAs("security-threat-model", "# X\n\nNo output.\n"))).toEqual([
			"disclaimer-present",
		]);
	});

	it("flags another group's blockquote", () => {
		expect(
			rules(
				runAs(
					"compliance-gdpr",
					`# X\n\n## Output\n\n- Gaps\n\n${DISCLAIMER_INSTRUCTION}\n\n${MONEY_QUOTE}\n`,
				),
			),
		).toEqual(["disclaimer-present"]);
	});

	it("flags the blockquote without the instruction sentence", () => {
		expect(rules(runAs("finance-ratios", output(`\n\n${MONEY_QUOTE}\n`)))).toEqual([
			"disclaimer-present",
		]);
	});

	it("flags content after the disclaimer", () => {
		expect(rules(runAs("finance-ratios", output(`${good}\n- Late bullet\n`)))).toEqual([
			"disclaimer-present",
		]);
	});

	it("flags a disclaimer placed outside ## Output", () => {
		expect(
			rules(
				runAs(
					"finance-ratios",
					`# X\n\n${COMPUTE_WITH_CODE_PARAGRAPH}\n\n${DISCLAIMER_INSTRUCTION}\n\n${MONEY_QUOTE}\n\n## Output\n\n- Totals\n`,
				),
			),
		).toEqual(["disclaimer-present"]);
	});

	it("ignores other domains", () => {
		expect(runAs("legal-contract-review", "# X\n\n## Output\n\n- Memo\n")).toEqual([]);
	});
});

describe("compute-with-code-present", () => {
	const tail = `\n\n## Output\n\n- Totals\n\n${DISCLAIMER_INSTRUCTION}\n\n${MONEY_QUOTE}\n`;

	it("matches spec §5 verbatim", () => {
		expect(COMPUTE_WITH_CODE_PARAGRAPH).toBe(
			"**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.",
		);
		expect([...COMPUTE_WITH_CODE_PLUGINS].sort()).toEqual([
			"accounting",
			"ai",
			"analytics",
			"bookkeeping",
			"finance",
			"support",
		]);
	});

	it("accepts a money skill with the paragraph", () => {
		expect(runAs("bookkeeping-record", `# X\n\n${COMPUTE_WITH_CODE_PARAGRAPH}${tail}`)).toEqual([]);
	});

	it("flags a money skill without the paragraph", () => {
		expect(rules(runAs("accounting-close", `# X${tail}`))).toEqual(["compute-with-code-present"]);
	});

	it("names every computing domain in its message", () => {
		const [issue] = runAs("support-reply", "# X\n\n## Output\n\n- Reply\n");
		for (const domain of COMPUTE_WITH_CODE_PLUGINS) expect(issue.message).toContain(domain);
	});

	it("flags an ai skill without the paragraph", () => {
		expect(rules(runAs("ai-prompt-review", "# X\n\n## Output\n\n- Review\n"))).toEqual([
			"compute-with-code-present",
		]);
	});

	it("flags an analytics skill without the paragraph", () => {
		expect(rules(runAs("analytics-query", "# X\n\n## Output\n\n- Query\n"))).toEqual([
			"compute-with-code-present",
		]);
	});

	it("flags a support skill without the paragraph", () => {
		expect(rules(runAs("support-reply", "# X\n\n## Output\n\n- Reply\n"))).toEqual([
			"compute-with-code-present",
		]);
	});

	it("ignores compliance and security", () => {
		expect(
			runAs(
				"compliance-gdpr",
				`# X\n\n## Output\n\n- Gaps\n\n${DISCLAIMER_INSTRUCTION}\n\n${DISCLAIMER_TEXT.compliance}\n`,
			),
		).toEqual([]);
	});
});

describe("figma-step", () => {
	const figmaFront = fm("design-system-overview", "  figma-aware: true\n");
	const bothFront = fm(
		"design-define-component",
		'  argument-hint: "[project]"\n  workflow: design\n  phase: 2\n  artifact: 02-define.md\n  stack-aware: true\n  figma-aware: true\n',
	);
	const defineHandoff = handoffParagraph({
		phase: 2,
		phaseTitle: "Define",
		workflowTitle: "Design Thinking",
		workflowName: "design",
		first: false,
	});

	it("accepts a figma-aware utility whose Prerequisites open with the figma step", () => {
		expect(
			rules(
				runAs(
					"design-system-overview",
					`# Overview\n\n## Prerequisites\n\n${FIGMA_STEP}\n`,
					figmaFront,
				),
			),
		).not.toContain("figma-step");
	});

	it("accepts a figma-aware stack-aware member with handoff, stack, figma in that order", () => {
		const body = `# Define\n\n## Prerequisites\n\n${defineHandoff}\n\n${STACK_STEP}\n\n${FIGMA_STEP}\n\nRun the gate.\n`;
		expect(rules(runAs("design-define-component", body, bothFront))).not.toContain("figma-step");
	});

	it("rejects a figma-aware skill without the step, before the stack step, or after the gate", () => {
		expect(
			rules(
				runAs("design-system-overview", "# Overview\n\n## Prerequisites\n\nNone.\n", figmaFront),
			),
		).toContain("figma-step");
		const early = `# Define\n\n## Prerequisites\n\n${defineHandoff}\n\n${FIGMA_STEP}\n\n${STACK_STEP}\n\nRun the gate.\n`;
		expect(rules(runAs("design-define-component", early, bothFront))).toContain("figma-step");
		const late = `# Define\n\n## Prerequisites\n\n${defineHandoff}\n\n${STACK_STEP}\n\nRun the gate.\n\n${FIGMA_STEP}\n`;
		expect(rules(runAs("design-define-component", late, bothFront))).toContain("figma-step");
	});

	it("rejects a skill that is not figma-aware but carries the marker", () => {
		expect(rules(run(`## Prerequisites\n\n${FIGMA_MARKER} Steps.\n`))).toContain("figma-step");
	});

	it("frontmatter-shape accepts figma-aware: true and rejects a non-boolean", () => {
		expect(
			rules(runAs("design-system-overview", `## Prerequisites\n\n${FIGMA_STEP}\n`, figmaFront)),
		).not.toContain("frontmatter-shape");
		expect(
			rules(
				runAs(
					"design-system-overview",
					`## Prerequisites\n\n${FIGMA_STEP}\n`,
					fm("design-system-overview", "  figma-aware: yes\n"),
				),
			),
		).toContain("frontmatter-shape");
	});
});

describe("no-server-tool-names", () => {
	it("rejects the removed Figma server's tool names and names the first offender", () => {
		const issues = run("## Process\n\n1. Call `figma_get_variables` with the file key.\n");
		expect(rules(issues)).toContain("no-server-tool-names");
		expect(issues.find((i) => i.rule === "no-server-tool-names")?.message).toContain(
			"figma_get_variables",
		);
		expect(rules(run("## Process\n\n1. Call `figjam_create_stickies`.\n"))).toContain(
			"no-server-tool-names",
		);
	});

	it("accepts the official server's names, the capability reference and the word Figma", () => {
		const body =
			"## Process\n\n1. *Figma (write-design):* `use_figma` or `generate_figma_design`, per `references/figma-capabilities.md`, in Figma.\n";
		expect(rules(run(body))).not.toContain("no-server-tool-names");
	});
});

describe("figma-step link", () => {
	const figmaFront = fm("design-empathize", "  figma-aware: true\n");
	const body = `# Empathize\n\n## Prerequisites\n\n${FIGMA_STEP}\n`;

	it("resolves the step's capability link to the design folder's canonical file", () => {
		const withContract: PackContext = {
			...ctx,
			referenceFiles: [...ctx.referenceFiles, "references/design/figma-capabilities.md"],
		};
		const parsed = parseSkill(`${figmaFront}${body}`, "/r/skills/design-empathize/SKILL.md");
		expect(rules(validatePackSkill(parsed, withContract))).not.toContain("reference-resolvable");
	});

	it("flags the step when the capability contract is neither canonical nor bundled", () => {
		const issues = runAs("design-empathize", body, figmaFront);
		expect(rules(issues)).toContain("reference-resolvable");
		expect(issues.find((i) => i.rule === "reference-resolvable")?.message).toContain(
			"figma-capabilities.md",
		);
	});
});
