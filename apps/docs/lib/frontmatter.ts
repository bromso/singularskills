import { parse } from "yaml";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Parse a page's YAML frontmatter strictly, the way the MDX loader in the Next build does,
 * so a value like `description: a: b` fails here (in `bun run check`) rather than only in
 * the build. Returns `{}` for a page without frontmatter.
 */
export function parseFrontmatter(src: string): Record<string, unknown> {
	const match = FRONTMATTER.exec(src);
	if (!match) return {};
	return (parse(match[1]) ?? {}) as Record<string, unknown>;
}
