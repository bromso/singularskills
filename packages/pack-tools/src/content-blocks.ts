import { ARGS_PARAGRAPH, logFields } from "./args.js";

/**
 * Disclaimer blockquotes per group (spec §5). Must match DISCLAIMER_TEXT in
 * @singularskills/skill-validator (enforced by a test).
 */
export const DISCLAIMER = {
	money:
		"> **Not financial or tax advice.** This artifact is generated analysis for review by a qualified accountant or financial professional before any filing, reporting or decision relies on it.",
	compliance:
		"> **Not legal or audit advice.** This artifact supports preparation for compliance work; certification, attestation and regulatory conclusions require a qualified auditor or counsel.",
	security:
		"> **Not a penetration test or audit.** This artifact is generated analysis; validate findings against the live system and have material controls reviewed by a qualified security professional.",
} as const;

export const DISCLAIMER_INSTRUCTION = "End the artifact with this paragraph, verbatim:";

/** Domain → disclaimer group. Must match DISCLAIMER_GROUPS in the validator. */
export const DISCLAIMER_PLUGINS: Record<string, keyof typeof DISCLAIMER> = {
	finance: "money",
	accounting: "money",
	bookkeeping: "money",
	compliance: "compliance",
	security: "security",
};

/** Spec §5. Must match COMPUTE_WITH_CODE_PARAGRAPH in the validator. */
export const COMPUTE_PARAGRAPH =
	"**Compute with code.** Perform every calculation (totals, balances, ratios, variances, projections) with a script — Bash, Python or a spreadsheet formula written to a file — and include the computation alongside the result. Never do arithmetic mentally.";

export const COMPUTE_PLUGINS = new Set([
	"finance",
	"accounting",
	"bookkeeping",
	"support",
	"analytics",
	"ai",
]);

const FENCE = /^\s*(```|~~~)/;
const FIRST_H2 = /^## /m;

/** `[start, end)` line indices of the `## Output` body (heading excluded), ignoring fenced code. */
function outputSection(lines: string[]): [number, number] | undefined {
	let inFence = false;
	let start = -1;
	for (let i = 0; i < lines.length; i++) {
		if (FENCE.test(lines[i])) inFence = !inFence;
		if (inFence || !lines[i].startsWith("## ")) continue;
		if (start >= 0) return [start, i];
		if (/^## Output\s*$/.test(lines[i])) start = i + 1;
	}
	return start >= 0 ? [start, lines.length] : undefined;
}

/**
 * Append the group's disclaimer instruction and blockquote as the last paragraph of
 * `## Output` (spec §5), after the section's last non-blank line — including after an
 * existing, different blockquote. Plugins outside DISCLAIMER_PLUGINS are unchanged;
 * a skill without `## Output` is returned unchanged with `skipped`. Idempotent.
 */
export function addDisclaimer(
	content: string,
	domain: string,
): { content: string; skipped?: "no-output-section" } {
	const group = DISCLAIMER_PLUGINS[domain];
	if (!group) return { content };
	const lines = content.split("\n");
	const section = outputSection(lines);
	if (!section) return { content, skipped: "no-output-section" };
	const [start, end] = section;
	let last = end - 1;
	while (last >= start && lines[last].trim() === "") last--;
	const quote = DISCLAIMER[group];
	if (
		lines[last] === quote &&
		lines[last - 1] === "" &&
		lines[last - 2] === DISCLAIMER_INSTRUCTION
	) {
		return { content };
	}
	lines.splice(last + 1, 0, "", DISCLAIMER_INSTRUCTION, "", quote);
	return { content: lines.join("\n") };
}

/**
 * Insert the "Compute with code" paragraph (spec §5) directly after the standard
 * Arguments paragraph, or before the first `## ` heading when there is none.
 * Domains outside COMPUTE_PLUGINS are unchanged. Idempotent.
 */
export function addCompute(content: string, domain: string, name?: string): string {
	if (!COMPUTE_PLUGINS.has(domain) || content.includes(COMPUTE_PARAGRAPH)) return content;
	const fields = logFields(content, name);
	for (const rule of ["first-token", "basename"] as const) {
		const args = ARGS_PARAGRAPH(domain, rule, fields);
		const at = content.indexOf(args);
		if (at < 0) continue;
		const split = at + args.length;
		return `${content.slice(0, split)}\n\n${COMPUTE_PARAGRAPH}${content.slice(split)}`;
	}
	const h2 = content.search(FIRST_H2);
	if (h2 < 0) return `${content.replace(/\n*$/, "")}\n\n${COMPUTE_PARAGRAPH}\n`;
	return `${content.slice(0, h2).replace(/\n*$/, "")}\n\n${COMPUTE_PARAGRAPH}\n\n${content.slice(h2)}`;
}
