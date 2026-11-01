import type { SiteData } from "../scripts/gen-site-data";
import { type Domain, domains } from "./domains";
import siteData from "./site-data.json";

export function getDomains(): (Domain & { skills: number; hasEvals: boolean })[] {
	const bySlug = new Map(siteData.plugins.map((plugin) => [plugin.slug, plugin]));

	const joined = domains.map((domain) => {
		const plugin = bySlug.get(domain.slug);
		return {
			...domain,
			skills: plugin?.skills ?? 0,
			hasEvals: plugin?.hasEvals ?? false,
		};
	});

	const singular = joined.filter((domain) => domain.slug === "singular");
	const rest = joined
		.filter((domain) => domain.slug !== "singular")
		.sort((a, b) => a.name.localeCompare(b.name));

	return [...rest, ...singular];
}

/** Cells occupied by each bento size at six columns (spec §4.4); sums to 36 across all 20 domains. */
export const BENTO_CELLS: Record<Domain["bento"]["size"], number> = {
	wide: 6,
	half: 2,
	small: 1,
	meta: 2,
};

/** Domains in homepage bento order (`bento.order` ascending), not the alphabetical `getDomains()` order. */
export function getBentoDomains(): ReturnType<typeof getDomains> {
	return getDomains().sort((a, b) => a.bento.order - b.bento.order);
}

export function getTotals(): SiteData["totals"] {
	return siteData.totals as SiteData["totals"];
}

export function getDomainForSlug(slug: string[] | undefined): Domain | undefined {
	const first = slug?.[0];
	if (!first) {
		return undefined;
	}

	const normalized = first === "overview" ? "singular" : first;
	return domains.find((domain) => domain.slug === normalized);
}
