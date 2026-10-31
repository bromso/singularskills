import {
	Calculator,
	ChartColumn,
	ClipboardCheck,
	Code,
	Crown,
	Eye,
	GraduationCap,
	Kanban,
	LifeBuoy,
	LineChart,
	Megaphone,
	Palette,
	Receipt,
	Scale,
	Search,
	Shield,
	Sparkles,
	Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Domain = {
	slug: string;
	name: string;
	methodology: string;
	colour: string;
	icon: LucideIcon;
	/** Build-time-rendered Iconify `line-md` icon name (`lib/icons.ts`); plays its draw animation once on first hover/focus. */
	animatedIcon: string;
	blurb: string;
	docsPath: string;
	/** Homepage bento placement (`lib/site.ts#getBentoDomains`); order 1..16, size tiles at six columns per `BENTO_CELLS`. */
	bento: { order: number; size: "wide" | "half" | "small" | "meta" };
};

export const domains: Domain[] = [
	{
		slug: "accessibility",
		name: "Accessibility",
		methodology: "WCAG-EM",
		colour: "sand",
		icon: Eye,
		animatedIcon: "line-md:list-3",
		blurb: "WCAG 2.1 audit methodology — scope, evaluate, report, remediate, and retest.",
		docsPath: "/docs/accessibility",
		bento: { order: 6, size: "small" },
	},
	{
		slug: "accounting",
		name: "Accounting",
		methodology: "Accounting Cycle",
		colour: "coral",
		icon: Calculator,
		animatedIcon: "line-md:document-report",
		blurb:
			"Eight-phase accounting cycle — analyze, journal, ledger, trial balance, adjust, and close.",
		docsPath: "/docs/accounting",
		bento: { order: 7, size: "small" },
	},
	{
		slug: "analytics",
		name: "Analytics",
		methodology: "Decision Analytics Cycle",
		colour: "sky",
		icon: ChartColumn,
		animatedIcon: "line-md:filter",
		blurb:
			"Decision-led analytics — questions, metrics, data checks, analysis, dashboards, and readouts.",
		docsPath: "/docs/analytics",
		bento: { order: 8, size: "small" },
	},
	{
		slug: "bookkeeping",
		name: "Bookkeeping",
		methodology: "Bookkeeping Cycle",
		colour: "amber",
		icon: Receipt,
		animatedIcon: "line-md:clipboard-list",
		blurb: "Four-phase bookkeeping cycle — record, categorize, reconcile, and report.",
		docsPath: "/docs/bookkeeping",
		bento: { order: 9, size: "small" },
	},
	{
		slug: "branding",
		name: "Branding",
		methodology: "Brand Lifecycle",
		colour: "sage",
		icon: Sparkles,
		animatedIcon: "line-md:star",
		blurb:
			"Brand creation from discovery to guidelines — verbal identity, visual system, and assets.",
		docsPath: "/docs/branding",
		bento: { order: 10, size: "small" },
	},
	{
		slug: "coaching",
		name: "Coaching",
		methodology: "Domain Coaching",
		colour: "lilac",
		icon: GraduationCap,
		animatedIcon: "line-md:chat-round",
		blurb: "Expert feedback across UX, code, copy, accessibility, and strategy disciplines.",
		docsPath: "/docs/coaching",
		bento: { order: 11, size: "small" },
	},
	{
		slug: "compliance",
		name: "Compliance",
		methodology: "GRC Lifecycle",
		colour: "sky",
		icon: ClipboardCheck,
		animatedIcon: "line-md:clipboard-check",
		blurb:
			"Master compliance assessment across 30+ regulations — SOC 2, GDPR, HIPAA, PCI DSS, and more.",
		docsPath: "/docs/compliance",
		bento: { order: 12, size: "small" },
	},
	{
		slug: "design",
		name: "Design",
		methodology: "Design Thinking",
		colour: "sand",
		icon: Palette,
		animatedIcon: "line-md:paint-drop",
		blurb:
			"Five-phase design thinking process for component design, writing to Figma canvas via MCP.",
		docsPath: "/docs/design",
		bento: { order: 1, size: "wide" },
	},
	{
		slug: "development",
		name: "Development",
		methodology: "Dev Workflow",
		colour: "coral",
		icon: Code,
		animatedIcon: "line-md:document-code",
		blurb: "Plan, build, test, debug, review, and ship with structured development workflows.",
		docsPath: "/docs/development",
		bento: { order: 2, size: "wide" },
	},
	{
		slug: "finance",
		name: "Finance",
		methodology: "FP&A",
		colour: "amber",
		icon: LineChart,
		animatedIcon: "line-md:gauge",
		blurb: "Six-phase FP&A process — assess, plan, forecast, budget, model, and review.",
		docsPath: "/docs/finance",
		bento: { order: 13, size: "small" },
	},
	{
		slug: "leadership",
		name: "Leadership",
		methodology: "Leadership Dev",
		colour: "sage",
		icon: Crown,
		animatedIcon: "line-md:compass",
		blurb: "Build and lead teams — assess, vision, build, develop, sustain, plus day-to-day tools.",
		docsPath: "/docs/leadership",
		bento: { order: 14, size: "small" },
	},
	{
		slug: "legal",
		name: "Legal",
		methodology: "Legal Lifecycle",
		colour: "lilac",
		icon: Scale,
		animatedIcon: "line-md:briefcase-check",
		blurb: "Full legal operations — assess, draft, review, comply, and govern.",
		docsPath: "/docs/legal",
		bento: { order: 15, size: "small" },
	},
	{
		slug: "marketing",
		name: "Marketing",
		methodology: "RACE Framework",
		colour: "sky",
		icon: Megaphone,
		animatedIcon: "line-md:volume-high",
		blurb: "Full growth marketing lifecycle — strategy, reach, act, convert, and engage.",
		docsPath: "/docs/marketing",
		bento: { order: 4, size: "small" },
	},
	{
		slug: "singular",
		name: "Singular",
		methodology: "Meta skills",
		colour: "sand",
		icon: Wand2,
		animatedIcon: "line-md:cog",
		blurb: "Run any workflow phase by phase; find, create and improve skills; report on a project.",
		docsPath: "/docs/overview",
		bento: { order: 18, size: "meta" },
	},
	{
		slug: "project-management",
		name: "Project Management",
		methodology: "Scrum",
		colour: "coral",
		icon: Kanban,
		animatedIcon: "line-md:calendar",
		blurb: "Sprint-based project management — initiate, plan, sprint, review, and improve.",
		docsPath: "/docs/project-management",
		bento: { order: 16, size: "small" },
	},
	{
		slug: "research",
		name: "Research",
		methodology: "Double Diamond",
		colour: "amber",
		icon: Search,
		animatedIcon: "line-md:search",
		blurb: "Structured discovery and validation through divergent and convergent thinking.",
		docsPath: "/docs/research",
		bento: { order: 3, size: "half" },
	},
	{
		slug: "security",
		name: "Security",
		methodology: "NIST CSF 2.0",
		colour: "sage",
		icon: Shield,
		animatedIcon: "line-md:security",
		blurb:
			"Full cybersecurity lifecycle — govern, identify, protect, detect, respond, and recover.",
		docsPath: "/docs/security",
		bento: { order: 5, size: "small" },
	},
	{
		slug: "support",
		name: "Support",
		methodology: "Support Operations Cycle",
		colour: "amber",
		icon: LifeBuoy,
		animatedIcon: "line-md:chat-round-dots",
		blurb:
			"Customer support from first contact to account health — map, categorise, answer, escalate, and review.",
		docsPath: "/docs/support",
		bento: { order: 17, size: "small" },
	},
];

/** The domain whose docs live at `url` (`/docs/<slug>` or below; `/docs/overview` → singular). */
export function domainForDocsUrl(url: string | undefined): Domain | undefined {
	if (!url) return undefined;
	return domains.find((d) => url === d.docsPath || url.startsWith(`${d.docsPath}/`));
}
