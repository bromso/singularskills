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

test("every domain has a unique bento order 1..19 and a size", () => {
	const orders = domains.map((d) => d.bento.order).sort((a, b) => a - b);
	expect(orders).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
});

test("bento sizes: 2 wide, 16 small, 1 meta (singular), 30 cells", () => {
	// 2×6 (wide) + 16×1 (small) + 1×2 (meta) = 30 cells across 5 full rows at six columns.
	// Half tiles went to small as domains joined (security for support, marketing for
	// analytics, research for ai), so rows stay full at six and at two columns.
	const by = (s: string) => domains.filter((d) => d.bento.size === s);
	expect(
		by("wide")
			.map((d) => d.slug)
			.sort(),
	).toEqual(["design", "development"]);
	expect(by("half")).toEqual([]);
	expect(by("small")).toHaveLength(16);
	expect(by("meta").map((d) => d.slug)).toEqual(["singular"]);
	expect(domains.reduce((n, d) => n + BENTO_CELLS[d.bento.size], 0)).toBe(30);
});

test("getBentoDomains is ordered design, development, research, marketing, security, …, singular", () => {
	const slugs = getBentoDomains().map((d) => d.slug);
	expect(slugs.slice(0, 5)).toEqual(["design", "development", "research", "marketing", "security"]);
	expect(slugs.at(-1)).toBe("singular");
	expect(slugs.slice(5, 18)).toEqual([...slugs.slice(5, 18)].sort());
});

test("every domain names a line-md animated icon", () => {
	for (const d of domains) expect(d.animatedIcon).toMatch(/^line-md:[a-z0-9-]+$/);
});

test("totals: 315 skills across 19 domains and 7 agents", () => {
	expect(getTotals().plugins).toBe(19);
	expect(getTotals().agents).toBe(7);
	expect(getTotals().skills).toBe(315);
});
