import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	type Workflow as ValidatorWorkflow,
	loadWorkflows as validatorLoadWorkflows,
} from "@singularskills/skill-validator";
import { describe, expect, expectTypeOf, test } from "vitest";
import type { SkillFile } from "./skills.js";
import { listSkills } from "./skills.js";
import { type Workflow, checkWorkflows, loadWorkflows } from "./workflows.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const workflowsDir = path.join(repoRoot, "workflows");

/** A skill whose frontmatter carries `metadata` (omitted when `metadata` is undefined). */
function skill(name: string, metadata?: { workflow: string; phase: number }): SkillFile {
	const meta = metadata
		? `metadata:\n  workflow: ${metadata.workflow}\n  phase: ${metadata.phase}\n`
		: "";
	return {
		name,
		domain: name.split("-")[0],
		path: `skills/${name}/SKILL.md`,
		content: `---\nname: ${name}\ndescription: Do it.\n${meta}---\n\n# ${name}\n`,
	};
}

/** A two-phase design workflow; `requires` for phase 2 is overridable. */
function design(requires = ["01-empathize.md"]): Workflow {
	return {
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
				requires,
				skills: ["design-define-component"],
			},
		],
	};
}

const designSkills = () => [
	skill("design-empathize", { workflow: "design", phase: 1 }),
	skill("design-define-component", { workflow: "design", phase: 2 }),
];

describe("loadWorkflows", () => {
	test("loadWorkflows parses design.yml with five phases in order", () => {
		const wf = loadWorkflows(workflowsDir).find((w) => w.name === "design");
		expect(wf?.phases.map((p) => p.artifact)).toEqual([
			"01-empathize.md",
			"02-define.md",
			"03-ideate.md",
			"04-prototype.md",
			"05-test.md",
		]);
		expect(wf?.phases[3].requires).toEqual(["02-define.md", "03-ideate.md"]);
	});

	test("loads all 22 workflow files, compliance phase 1 naming its folder", () => {
		const workflows = loadWorkflows(workflowsDir);
		expect(workflows).toHaveLength(22);
		const compliance = workflows.find((w) => w.name === "compliance");
		expect(compliance?.phases.find((p) => p.phase === 1)?.artifact).toBe("01-assess/");
	});

	test("an approval-only phase loads with its artifact undefined", () => {
		const feature = loadWorkflows(workflowsDir).find((w) => w.name === "build-feature");
		const ship = feature?.phases.find((p) => p.skills.includes("development-ship"));
		expect(ship).toBeDefined();
		expect(ship?.artifact).toBeUndefined();
	});

	test("every workflow is internally consistent (requires and phase numbers)", () => {
		const violations = checkWorkflows(loadWorkflows(workflowsDir), []).filter(
			(v) => !v.includes("names unknown skill"),
		);
		expect(violations).toEqual([]);
	});
});

describe("checkWorkflows", () => {
	test("is clean for a consistent workflow and its members", () => {
		expect(checkWorkflows([design()], designSkills())).toEqual([]);
	});

	test("checkWorkflows flags a requires that nothing produces", () => {
		expect(checkWorkflows([design(["09-x.md"])], designSkills())).toEqual([
			"design: phase 2 requires 09-x.md which no earlier phase produces",
		]);
	});

	test("flags a requires produced only by the same or a later phase", () => {
		expect(checkWorkflows([design(["02-define.md"])], designSkills())).toEqual([
			"design: phase 2 requires 02-define.md which no earlier phase produces",
		]);
	});

	test("flags an empty-string artifact", () => {
		const wf = design();
		wf.phases[1] = { ...wf.phases[1], artifact: "" };
		expect(checkWorkflows([wf], designSkills())).toEqual(["design: phase 2 has an empty artifact"]);
	});

	test("flags a member that is not a skill in the pack", () => {
		expect(checkWorkflows([design()], [designSkills()[0]])).toEqual([
			"design: phase 2 names unknown skill design-define-component",
		]);
	});

	test("checkWorkflows flags a member whose metadata names another workflow", () => {
		const skills = [
			skill("design-empathize", { workflow: "research", phase: 1 }),
			designSkills()[1],
		];
		const research: Workflow = { ...design(), name: "research", folder: "research" };
		research.phases = [{ ...research.phases[0], skills: ["research-discover"] }];
		const all = [...skills, skill("research-discover", { workflow: "research", phase: 1 })];
		expect(checkWorkflows([design(), research], all)).toEqual([
			"design-empathize: listed in design phase 1 but metadata says research phase 1",
		]);
	});

	test("flags a member with no workflow metadata", () => {
		const skills = [skill("design-empathize"), designSkills()[1]];
		expect(checkWorkflows([design()], skills)).toEqual([
			"design-empathize: listed in design phase 1 but metadata says nothing",
		]);
	});

	test("flags metadata naming a workflow with no file", () => {
		const skills = [...designSkills(), skill("design-ideate", { workflow: "ideas", phase: 1 })];
		expect(checkWorkflows([design()], skills)).toEqual([
			"design-ideate: metadata.workflow ideas has no workflow file",
		]);
	});

	test("flags metadata naming a phase the workflow does not have", () => {
		const skills = [...designSkills(), skill("design-ideate", { workflow: "design", phase: 7 })];
		expect(checkWorkflows([design()], skills)).toEqual([
			"design-ideate: metadata.phase 7 is not a phase of design",
		]);
	});

	test("does not check metadata for steps of a cross-domain workflow (phases with a folder)", () => {
		const feature: Workflow = {
			name: "build-feature",
			title: "Build a Feature",
			folder: "build-feature",
			phases: [
				{
					phase: 1,
					title: "Research user needs",
					folder: "design",
					artifact: "01-empathize.md",
					requires: [],
					skills: ["design-empathize"],
				},
				{
					phase: 2,
					title: "Understand the problem space",
					folder: "design",
					artifact: "02-define.md",
					requires: [],
					skills: ["design-define-component"],
				},
				{
					phase: 3,
					title: "Merge",
					folder: "development",
					requires: [],
					skills: ["development-ship"],
				},
			],
		};
		const skills = [...designSkills(), skill("development-ship")];
		expect(checkWorkflows([design(), feature], skills)).toEqual([]);
	});
});

describe("cross-domain requires", () => {
	type Step = [title: string, folder: string, artifact: string, skills: string[]];

	/** A cross-domain workflow whose phases are `steps`, numbered from 1. */
	function crossDomain(name: string, steps: Step[]): Workflow {
		return {
			name,
			title: name,
			folder: name,
			phases: steps.map(([title, folder, artifact, skills], i) => ({
				phase: i + 1,
				title,
				folder,
				artifact,
				requires: [],
				skills,
			})),
		};
	}

	const accessibility: Workflow = {
		name: "accessibility",
		title: "WCAG-EM",
		folder: "accessibility",
		phases: [
			["Scope", "01-scope.md", [], "accessibility-scope"],
			["Evaluate", "02-evaluate.md", ["01-scope.md"], "accessibility-evaluate"],
			["Report", "03-report.md", ["02-evaluate.md"], "accessibility-report"],
			["Remediate", "04-remediate.md", ["03-report.md"], "accessibility-remediate"],
		].map(([title, artifact, requires, member], i) => ({
			phase: i + 1,
			title: title as string,
			artifact: artifact as string,
			requires: requires as string[],
			skills: [member as string],
		})),
	};
	const STRATEGY = [
		"marketing-customer-research",
		"marketing-competitor-profiling",
		"marketing-product-marketing-context",
		"marketing-competitor-alternatives",
		"marketing-pricing-strategy",
	];
	const marketing: Workflow = {
		name: "marketing",
		title: "RACE Framework",
		folder: "marketing",
		phases: [
			{ phase: 0, title: "Strategy", artifact: "00-strategy.md", requires: [], skills: STRATEGY },
			{
				phase: 1,
				title: "Reach",
				artifact: "01-reach.md",
				requires: ["00-strategy.md"],
				skills: ["marketing-launch-strategy"],
			},
		],
	};
	const domainSkills = [
		...accessibility.phases.map((p) =>
			skill(p.skills[0], { workflow: "accessibility", phase: p.phase }),
		),
		...STRATEGY.map((name) => skill(name, { workflow: "marketing", phase: 0 })),
		skill("marketing-launch-strategy", { workflow: "marketing", phase: 1 }),
	];
	const scope: Step = ["Scope", "accessibility", "01-scope.md", ["accessibility-scope"]];
	const evaluate: Step = [
		"Evaluate",
		"accessibility",
		"02-evaluate.md",
		["accessibility-evaluate"],
	];
	const report: Step = ["Report", "accessibility", "03-report.md", ["accessibility-report"]];
	const remediate: Step = [
		"Remediate",
		"accessibility",
		"04-remediate.md",
		["accessibility-remediate"],
	];
	const strategy: Step = ["Strategy", "marketing", "00-strategy.md", STRATEGY];
	const launch: Step = ["Go to market", "marketing", "01-reach.md", ["marketing-launch-strategy"]];

	test("launch-product before the fix: remediate and launch-strategy have unproduced requires", () => {
		const before = crossDomain("launch-product", [scope, evaluate, remediate, launch]);
		expect(checkWorkflows([accessibility, marketing, before], domainSkills)).toEqual([
			"launch-product: phase 3 member accessibility-remediate requires 03-report.md which no earlier accessibility phase produces",
			"launch-product: phase 4 member marketing-launch-strategy requires 00-strategy.md which no earlier marketing phase produces",
		]);
	});

	test("launch-product after the fix: a report phase and a strategy phase come first", () => {
		const after = crossDomain("launch-product", [
			scope,
			evaluate,
			report,
			remediate,
			strategy,
			launch,
		]);
		expect(checkWorkflows([accessibility, marketing, after], domainSkills)).toEqual([]);
	});

	test("rebrand before and after the strategy phase", () => {
		const before = crossDomain("rebrand", [launch]);
		expect(checkWorkflows([accessibility, marketing, before], domainSkills)).toEqual([
			"rebrand: phase 1 member marketing-launch-strategy requires 00-strategy.md which no earlier marketing phase produces",
		]);
		const after = crossDomain("rebrand", [strategy, launch]);
		expect(checkWorkflows([accessibility, marketing, after], domainSkills)).toEqual([]);
	});

	test("the producing phase must share the member's folder", () => {
		const elsewhere = crossDomain("rebrand", [
			["Strategy", "branding", "00-strategy.md", []],
			launch,
		]);
		expect(checkWorkflows([accessibility, marketing, elsewhere], domainSkills)).toEqual([
			"rebrand: phase 2 member marketing-launch-strategy requires 00-strategy.md which no earlier marketing phase produces",
		]);
	});
});

test("every workflow file in the repo is clean against the pack", () => {
	expect(
		checkWorkflows(loadWorkflows(workflowsDir), listSkills(path.join(repoRoot, "skills"))),
	).toEqual([]);
});

describe("skill-validator's workflow loader", () => {
	const fixtures = path.join(
		path.dirname(fileURLToPath(import.meta.url)),
		"__fixtures__/workflows",
	);

	test("parses the shared fixture exactly as pack-tools does", () => {
		const ours = loadWorkflows(fixtures);
		expect(ours.map((wf) => wf.name)).toEqual(["cross", "domain"]);
		expect(validatorLoadWorkflows(fixtures)).toEqual(ours);
	});

	test("has the same Workflow type", () => {
		expectTypeOf<ValidatorWorkflow>().toEqualTypeOf<Workflow>();
	});
});
