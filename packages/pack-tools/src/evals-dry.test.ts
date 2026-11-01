import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, "../../../scripts/run-evals.sh");

let root: string;

function writeCase(
	skill: string,
	body: string,
	opts: { graders?: number; scaffold?: boolean } = {},
) {
	const dir = path.join(root, skill);
	mkdirSync(path.join(dir, "graders"), { recursive: true });
	writeFileSync(path.join(dir, "prompt.md"), `---\nmax_turns: 25\nruns: 2\n---\n\n${body}\n`);
	for (let i = 0; i < (opts.graders ?? 0); i++) {
		writeFileSync(path.join(dir, "graders", `g${i}.md`), "---\ntype: llm\n---\n\nJudge.\n");
	}
	if (opts.scaffold) writeFileSync(path.join(dir, "case.yaml"), `name: ${skill}\n`);
}

function runDry(args: string[] = [], env: Record<string, string> = { EVALS_DIR: root }) {
	return spawnSync("bash", [script, ...args, "--dry"], {
		encoding: "utf8",
		env: { ...process.env, ...env },
	});
}

beforeEach(() => {
	root = mkdtempSync(path.join(tmpdir(), "run-evals-dry-"));
});

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

describe("run-evals.sh --dry", () => {
	it("passes on the repo's own evals/: 20 cases, exit 0", () => {
		const result = runDry([], {});
		expect(result.stderr).toBe("");
		expect(result.status).toBe(0);
		expect(result.stdout).toContain("20 case(s)");
		expect(result.stdout).toMatch(/^design-empathize\s+graders=\d+\s+scaffold$/m);
		expect(result.stdout).toMatch(/^development-plan\s+graders=\d+\s+-$/m);
		expect(result.stdout).toMatch(/^workflow\s+graders=\d+\s+scaffold$/m);
	});

	it("lists every case with its grader count and scaffold flag, and exits 0", () => {
		writeCase("security-security-policy", "We need written rules for laptops and passwords.", {
			graders: 3,
		});
		writeCase("design-empathize", "Look into what a good date picker needs.", {
			graders: 2,
			scaffold: true,
		});
		const result = runDry();
		expect(result.status).toBe(0);
		expect(result.stdout).toMatch(/^design-empathize\s+graders=2\s+scaffold$/m);
		expect(result.stdout).toMatch(/^security-security-policy\s+graders=3\s+-$/m);
		expect(result.stdout).toContain("2 case(s)");
	});

	it("exits 1 and names the file when a prompt names its skill as a word", () => {
		writeCase("security-security-policy", "We need written rules for laptops and passwords.");
		writeCase("development-plan", "Use development-plan to break the payments feature down.");
		const result = runDry();
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("development-plan/prompt.md");
		expect(result.stderr).not.toContain("security-security-policy/prompt.md");
	});

	it("matches the skill name case-insensitively", () => {
		writeCase("workflow", "Kick off the WORKFLOW for date-picker.");
		expect(runDry().status).toBe(1);
	});

	it("exits 1 when a prompt contains /<skill>", () => {
		writeCase("design-empathize", "Run /design-empathize on the date picker.");
		const result = runDry();
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("design-empathize/prompt.md");
	});

	it("does not flag a skill name that is only part of a longer word", () => {
		writeCase("workflow", "Start the design thinking process; see workflows.md.");
		writeCase("development-plan", "See development-planning.md for the payments feature.");
		expect(runDry().status).toBe(0);
	});

	it("limits the listing to the skills given as arguments", () => {
		writeCase("security-security-policy", "We need written rules for laptops and passwords.");
		writeCase("design-empathize", "Look into what a good date picker needs.");
		const result = runDry(["design-empathize"]);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain("design-empathize");
		expect(result.stdout).not.toContain("security-security-policy");
		expect(result.stdout).toContain("1 case(s)");
	});

	it("exits 1 for a skill argument with no case", () => {
		writeCase("design-empathize", "Look into what a good date picker needs.");
		const result = runDry(["design-nope"]);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("design-nope");
	});
});

// Per-run graders as serialised by `claude plugin eval` 2.1.283: no `type`; only the
// case-level `graders[]` carries it.
function runGrader(name: string, passed: boolean, scored: boolean) {
	return {
		name,
		passed,
		weight: 1,
		explanation: "",
		withOnly: false,
		scored,
		judgeVotes: [],
		evidence: [],
	};
}

function realShapeResult(extra: { scoreWithout?: number }) {
	return {
		costUsd: 1.5,
		partial: false,
		cases: [
			{
				name: "security-security-policy",
				graders: [
					{ name: "fired", type: "tool_used" },
					{ name: "artifact", type: "file_exists" },
					{ name: "quality", type: "llm" },
				],
				aggregates: { score: 0.9, delta: 0.5, ...extra },
				arms: {
					with: [
						{ graders: [runGrader("fired", true, false), runGrader("quality", true, true)] },
						{ graders: [runGrader("fired", false, false), runGrader("quality", true, true)] },
					],
					without: [
						{ graders: [runGrader("fired", false, false), runGrader("quality", false, true)] },
					],
				},
			},
		],
	};
}

function runReport(json: string | null, args: string[] = []) {
	const resultsDir = path.join(root, "results");
	mkdirSync(resultsDir, { recursive: true });
	writeCase("security-security-policy", "A plain request.");
	if (json !== null) writeFileSync(path.join(resultsDir, "singularskills.json"), json);
	return spawnSync("bash", [script, ...args, "--report"], {
		encoding: "utf8",
		env: { ...process.env, EVALS_DIR: root, EVALS_RESULTS_DIR: resultsDir },
	});
}

function row(stdout: string, name: string) {
	const line = stdout.split("\n").find((l) => l.startsWith(`${name} `));
	return line?.trim().split(/\s+/);
}

describe("run-evals.sh --report", () => {
	it("reads with/without/delta and counts fired runs by grader name", () => {
		const result = runReport(JSON.stringify(realShapeResult({ scoreWithout: 0.4 })));
		expect(result.status).toBe(0);
		expect(row(result.stdout, "security-security-policy")).toEqual([
			"security-security-policy",
			"0.9",
			"0.4",
			"0.5",
			"1/2",
		]);
		expect(result.stdout).toContain("cost $1.5");
	});

	it("falls back to score minus delta when scoreWithout is absent", () => {
		const result = runReport(JSON.stringify(realShapeResult({})));
		expect(row(result.stdout, "security-security-policy")?.[2]).toBe("0.4");
	});

	it("keeps only the cases named as arguments", () => {
		writeCase("design-empathize", "A plain request.");
		const result = runReport(JSON.stringify(realShapeResult({ scoreWithout: 0.4 })), [
			"design-empathize",
		]);
		expect(result.status).toBe(0);
		expect(row(result.stdout, "security-security-policy")).toBeUndefined();
	});

	it("prints (unreadable) for a malformed result file", () => {
		const result = runReport("{not json");
		expect(result.status).toBe(0);
		expect(row(result.stdout, "(unreadable)")).toBeDefined();
	});

	it("prints (no results) when nothing has run yet", () => {
		const result = runReport(null);
		expect(result.status).toBe(0);
		expect(row(result.stdout, "(no results)")).toBeDefined();
	});
});
