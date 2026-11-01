import { BentoTile } from "@/components/home/BentoTile";
import ChromaSpotlight from "@/components/motion/ChromaSpotlight";
import { getBentoDomains } from "@/lib/site";

/**
 * The homepage domain bento: every domain in `bento.order`, sized by story (`BENTO_CELLS`:
 * 36 cells, six full rows at six columns; at two columns every row fills too, in the same order).
 * One `ChromaSpotlight` drives all twenty tiles; with no spotlight (reduced motion, coarse
 * pointers, no JS) the tiles keep their still rest state.
 */
export function ChromaBento() {
	return (
		<ChromaSpotlight className="mt-12">
			<ul className="grid auto-rows-[minmax(9rem,auto)] grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[minmax(11rem,auto)] lg:grid-cols-6">
				{getBentoDomains().map((domain) => (
					<BentoTile key={domain.slug} domain={domain} />
				))}
			</ul>
		</ChromaSpotlight>
	);
}
