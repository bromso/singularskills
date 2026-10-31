import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { parseFrontmatter } from "./frontmatter";

const CONTENT = join(__dirname, "..", "content", "docs");

function pages(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return pages(path);
		return entry.name.endsWith(".mdx") ? [path] : [];
	});
}

test("an unquoted ': ' inside a value is rejected, as the Next build rejects it", () => {
	expect(() =>
		parseFrontmatter("---\ntitle: X\ndescription: Write the memo: why\n---\n"),
	).toThrow();
	expect(parseFrontmatter('---\ntitle: X\ndescription: "Write the memo: why"\n---\n')).toEqual({
		title: "X",
		description: "Write the memo: why",
	});
});

test("every docs page's frontmatter parses as YAML", () => {
	const all = pages(CONTENT);
	expect(all.length).toBeGreaterThan(200);
	for (const path of all) {
		const src = readFileSync(path, "utf8");
		expect(() => parseFrontmatter(src), path).not.toThrow();
	}
});
