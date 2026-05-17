/**
 * Homepage CMS configuration types + defaults.
 *
 * Goal: let editors (via WP ACF Options Page) control:
 *   - Hero copy (headline, tagline, typewriter phrases, CTAs)
 *   - Hot Stats cards (count, content, order, on/off per card)
 *   - Section ordering (drag-and-drop sections on homepage)
 *   - Latest Articles selection (auto by date OR manually pinned)
 *   - Browse-by-Category visibility & order
 *   - Newsletter CTA copy
 *
 * The frontend reads these via `getSiteConfig()` (see wp-api.ts).
 * If the backend returns nothing (or fails), we fall back to `defaultSiteConfig`
 * so the site always renders something sensible.
 *
 * Mapping to WP/ACF: see WEB1/saasstatshub-homepage-cms-spec.md
 */

// ============================================================
// Section types
// ============================================================

export type HomeSectionType =
  | 'hero'
  | 'hot-stats'
  | 'latest-articles'
  | 'browse-categories'
  | 'newsletter-cta';

/** Common fields each section can carry. */
export interface BaseSection {
  /** Unique key for React key / DOM id */
  id: string;
  /** Discriminator */
  type: HomeSectionType;
  /** Whether this section is rendered. Editors can toggle off without deleting. */
  enabled: boolean;
  /** Optional eyebrow/section title overrides */
  eyebrow?: string;
  heading?: string;
  subheading?: string;
}

export interface HeroSection extends BaseSection {
  type: 'hero';
  /** First line of H1 (e.g. "The #1 Source for") */
  headlineLine1: string;
  /** Gradient highlight text (e.g. "SaaS Statistics") */
  headlineHighlight: string;
  /** Last line (e.g. "& Market Data") */
  headlineLine2: string;
  /** Tagline above search box (typewriter rotates these) */
  taglinePhrases: string[];
  /** Top badge text (e.g. "TRUSTED BY 50,000+ ANALYSTS") */
  trustBadge: string;
  /** Search placeholder */
  searchPlaceholder: string;
  /** How many category pills to show beneath the search bar (0..8) */
  pillCount: number;
}

export interface HotStat {
  id: string;
  /**
   * Emoji icon. **Decorative-only legacy field** as of Phase 1.
   * When `iconName` is set, the Lucide icon is rendered and `icon` is ignored.
   * Retained for ACF backward compatibility (Req 4.10, 4.11, 4.12).
   */
  icon: string;
  /**
   * Lucide icon name (kebab-case). When set, the Hot Stat card renders this
   * icon instead of the emoji `icon`. Resolved via `src/lib/icon-registry.ts`.
   * Unknown values fail the build (Req 4.14).
   */
  iconName?: string;
  number: string;          // raw label, e.g. "$232B" / "14.2%" / "30,000+"
  label: string;           // descriptor
  source: string;          // source name, e.g. "Gartner"
  /** CSS gradient string. If empty, falls back to a palette by index. */
  gradient?: string;
  enabled: boolean;
  /**
   * Decorative trend direction (Req 2.4). Used when `sparklineData` is absent
   * to drive the deterministic decorative curve fallback. Also drives line
   * color when no real series is available.
   */
  trend?: 'up' | 'down' | 'flat';
  /**
   * Numeric series for the card's sparkline (Req 2.10/2.11).
   * If absent, the renderer falls back to a hardcoded series in
   * `src/data/sparkline-defaults.ts` keyed by `id`, then to a decorative
   * curve from `trend`. 8–16 finite numbers per Req 2.3.
   */
  sparklineData?: number[];
}

export interface HotStatsSection extends BaseSection {
  type: 'hot-stats';
  /** Cap on rendered cards (after filter by enabled). 4 or 8 are sensible. */
  maxCards: number;
  cards: HotStat[];
}

export type LatestArticlesMode = 'auto-latest' | 'manual-pinned' | 'category';

export interface LatestArticlesSection extends BaseSection {
  type: 'latest-articles';
  /** auto-latest: just take latest by date.
   *  manual-pinned: respect explicit slug list (`pinnedSlugs`).
   *  category: pull from a single category. */
  mode: LatestArticlesMode;
  /** How many cards to show on homepage (3 / 6 / 9 typical) */
  count: number;
  /** Used when mode === 'manual-pinned' */
  pinnedSlugs?: string[];
  /** Used when mode === 'category' */
  categorySlug?: string;
  /** "View all" link target */
  viewAllHref?: string;
}

export interface BrowseCategoriesSection extends BaseSection {
  type: 'browse-categories';
  /** Slugs to render, in order. Empty = render all known. */
  visibleSlugs?: string[];
}

export interface NewsletterCtaSection extends BaseSection {
  type: 'newsletter-cta';
  pillText: string;        // "📧 Free Weekly Digest"
  description: string;
  emailPlaceholder: string;
  buttonLabel: string;
  socialProof: string;     // "Join 12,000+ SaaS professionals"
}

export type HomeSection =
  | HeroSection
  | HotStatsSection
  | LatestArticlesSection
  | BrowseCategoriesSection
  | NewsletterCtaSection;

export interface SiteConfig {
  /** Ordered list of homepage sections. Editors drag-reorder this. */
  homepageSections: HomeSection[];
  /** Site-wide footer fields (future) */
  footerTagline?: string;
}

// ============================================================
// Default fallback config (used when WP returns nothing)
// Keep the defaults visually identical to what the homepage rendered
// before this refactor, so removing WP doesn't change anything.
// ============================================================

const DEFAULT_GRADIENTS = [
  'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)',
  'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
  'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%)',
  'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)',
  'linear-gradient(135deg, #0E7490 0%, #0891B2 50%, #06B6D4 100%)',
  'linear-gradient(135deg, #BE185D 0%, #DB2777 50%, #F472B6 100%)',
  'linear-gradient(135deg, #3730A3 0%, #4338CA 50%, #6366F1 100%)',
  'linear-gradient(135deg, #0F766E 0%, #0D9488 50%, #14B8A6 100%)',
];

export function gradientFor(index: number): string {
  return DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
}

export const defaultSiteConfig: SiteConfig = {
  homepageSections: [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      headlineLine1: 'The #1 Source for',
      headlineHighlight: 'SaaS Statistics',
      headlineLine2: '& Market Data',
      trustBadge: 'Trusted by 50,000+ analysts',
      searchPlaceholder: 'Search SaaS statistics, trends, data...',
      taglinePhrases: [
        'Always cited. Always current.',
        'Power your decisions with data.',
        '$232B market. 30,000+ companies. 1 source.',
      ],
      pillCount: 6,
    },
    {
      id: 'hot-stats',
      type: 'hot-stats',
      enabled: true,
      maxCards: 8,
      cards: [
        { id: 's1', icon: '📊', iconName: 'trending-up', trend: 'up', number: '$232B',   label: 'Global SaaS Market (2026)', source: 'Gartner',    enabled: true },
        { id: 's2', icon: '📈', iconName: 'bar-chart-3', trend: 'up', number: '14.2%',   label: 'CAGR 2024–2030',             source: 'Statista',   enabled: true },
        { id: 's3', icon: '🏢', iconName: 'building-2',  trend: 'up', number: '30,000+', label: 'SaaS Companies Worldwide',   source: 'Crunchbase', enabled: true },
        { id: 's4', icon: '🚀', iconName: 'rocket',      trend: 'up', number: '78%',     label: 'Enterprise Adoption Rate',   source: 'McKinsey',   enabled: true },
        { id: 's5', icon: '☁️', iconName: 'cloud',       trend: 'up', number: '94%',     label: 'Cloud Adoption (Enterprise)',source: 'Flexera',    enabled: true },
        { id: 's6', icon: '📱', iconName: 'smartphone',  trend: 'up', number: '68%',     label: 'Mobile SaaS Usage',          source: 'Okta',       enabled: true },
        { id: 's7', icon: '🔐', iconName: 'lock',        trend: 'up', number: '$188B',   label: 'Cybersecurity Spend',        source: 'Gartner',    enabled: true },
        { id: 's8', icon: '🤖', iconName: 'bot',         trend: 'up', number: '12,400',  label: 'AI-powered SaaS Tools',      source: 'G2',         enabled: true },
      ],
    },
    {
      id: 'latest-articles',
      type: 'latest-articles',
      enabled: true,
      eyebrow: 'Latest',
      heading: 'Fresh Insights & Data',
      mode: 'auto-latest',
      count: 6,
      viewAllHref: '/categories/analytics/',
    },
    {
      id: 'browse-categories',
      type: 'browse-categories',
      enabled: true,
      eyebrow: 'Explore',
      heading: 'Browse by Category',
      subheading: 'Deep-dive into the SaaS sectors that matter to you',
    },
    {
      id: 'newsletter-cta',
      type: 'newsletter-cta',
      enabled: true,
      pillText: '📧 Free Weekly Digest',
      heading: 'Stay Ahead of the Curve',
      description: 'Get the latest SaaS statistics & insights delivered to your inbox every week. No spam, unsubscribe anytime.',
      emailPlaceholder: 'you@company.com',
      buttonLabel: 'Subscribe',
      socialProof: 'Join 12,000+ SaaS professionals',
    },
  ],
};

// ============================================================
// Merge helper: deep-merge WP partial config onto defaults
// ============================================================

/**
 * Merge a partial config from WP onto the defaults.
 * Section identity is by `type`. If WP returns sections, that ordering wins;
 * any section types missing from WP are dropped (editor's intent).
 * Per-field, undefined/null values fall through to defaults.
 */
export function mergeSiteConfig(partial?: Partial<SiteConfig> | null): SiteConfig {
  if (!partial || !partial.homepageSections || partial.homepageSections.length === 0) {
    return defaultSiteConfig;
  }

  const defaultsByType = new Map<HomeSectionType, HomeSection>();
  for (const s of defaultSiteConfig.homepageSections) {
    defaultsByType.set(s.type, s);
  }

  const merged: HomeSection[] = partial.homepageSections.map((wpSection) => {
    const fallback = defaultsByType.get(wpSection.type);
    if (!fallback) return wpSection as HomeSection;
    // Shallow merge: WP fields win when defined; undefined falls through.
    return { ...fallback, ...stripUndefined(wpSection) } as HomeSection;
  });

  return {
    ...defaultSiteConfig,
    ...partial,
    homepageSections: merged,
  };
}

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out as Partial<T>;
}
