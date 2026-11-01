import { expect, test } from "vitest";
import { domains } from "./domains";
import { BENTO_CELLS, getBentoDomains, getDomainForSlug, getDomains, getTotals } from "./site";
import siteData from "./site-data.json";

test("every plugin in site-data has a domain entry and vice versa", () => {
	const dataSlugs = siteData.plugins.map((p) => p.slug).sort();
	const domainSlugs = domains.map((d) => d.slug).sort();
	expect(domainSlugs).toEqual(dataSlugs);
});

test("getDomainForSlug maps overview to singular and unknown to undefined", () => {
	expect(getDomainForSlug(["overview", "status"])?.slug).toBe("singular");
	expect(getDomainForSlug(["design"])?.slug).toBe("design");
	expect(getDomainForSlug(["guides"])).toBeUndefined();
	expect(getDomainForSlug(undefined)).toBeUndefined();
});

test("getDomains puts singular last and carries counts", () => {
	const result = getDomains();

	expect(result[result.length - 1].slug).toBe("singular");
	expect(result[result.length - 1].docsPath).toBe("/docs/overview");

	const expectedOrder = [
		...domains.filter((d) => d.slug !== "singular").sort((a, b) => a.name.localeCompare(b.name)),
		domains.find((d) => d.slug === "singular"),
	].map((d) => d?.slug);
	expect(result.map((d) => d.slug)).toEqual(expectedOrder);

	for (const domain of result) {
		const plugin = siteData.plugins.find((p) => p.slug === domain.slug);
		expect(plugin).toBeDefined();
		expect(domain.skills).toBe(plugin?.skills);
		expect(domain.hasEvals).toBe(plugin?.hasEvals);
	}
});

test("getTotals returns the totals from site-data.json", () => {
	expect(getTotals()).toEqual(siteData.totals);
});

test("every domain has a unique bento order 1..21 and a size", () => {
	const orders = domains.map((d) => d.bento.order).sort((a, b) => a - b);
	expect(orders).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
});

test("bento sizes: 2 wide, 4 half, 14 small, 1 meta (singular), 36 cells", () => {
	// 2×6 (wide) + 4×2 (half) + 14×1 (small) + 1×2 (meta) = 36 cells: six full rows at six
	// columns, every row full at two. Ops made 21 tiles, so project-management went from half
	// to small; a search over every layout found this one with no same-colour neighbours.
	const by = (s: string) => domains.filter((d) => d.bento.size === s);
	expect(
		by("wide")
			.map((d) => d.slug)
			.sort(),
	).toEqual(["design", "development"]);
	expect(
		by("half")
			.map((d) => d.slug)
			.sort(),
	).toEqual(["accessibility", "marketing", "research", "security"]);
	expect(by("small")).toHaveLength(14);
	expect(by("meta").map((d) => d.slug)).toEqual(["singular"]);
	expect(domains.reduce((n, d) => n + BENTO_CELLS[d.bento.size], 0)).toBe(36);
});

test("getBentoDomains is ordered design, development, research, marketing, security, …, singular", () => {
	const slugs = getBentoDomains().map((d) => d.slug);
	expect(slugs.slice(0, 5)).toEqual(["design", "development", "research", "marketing", "security"]);
	expect(slugs.at(-1)).toBe("singular");
	expect(slugs.slice(5, 20)).toEqual([...slugs.slice(5, 20)].sort());
});

test("every domain names a line-md animated icon", () => {
	for (const d of domains) expect(d.animatedIcon).toMatch(/^line-md:[a-z0-9-]+$/);
});

test("totals: 338 skills across 21 domains and 7 agents", () => {
	expect(getTotals().plugins).toBe(21);
	expect(getTotals().agents).toBe(7);
	expect(getTotals().skills).toBe(338);
});
