import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, "../../../scripts/smoke-install.sh");

// Async on purpose: a blocking spawnSync of several minutes starves the vitest worker's RPC.
function run(args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		const child = spawn("bash", [script, ...args], { stdio: ["ignore", "pipe", "pipe"] });
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.on("error", reject);
		child.on("close", (status) => resolve({ status, stdout, stderr }));
	});
}

// Runs the real `skills` installer (downloaded through npx), so it needs network access.
// Set SKIP_NETWORK_TESTS=1 to opt out.
describe.skipIf(process.env.SKIP_NETWORK_TESTS === "1")("smoke-install.sh", () => {
	it("installs the pack for Codex from the local checkout and the gate fixture passes", async () => {
		const result = await run(["--local", "--agent", "codex"]);
		expect(result.status, result.stderr).toBe(0);
		expect(result.stdout).toContain("codex: 327 skills, gate ok");
	}, 300_000);
});
