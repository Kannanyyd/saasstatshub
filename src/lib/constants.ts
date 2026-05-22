/**
 * Single source of truth for category slugs and display metadata.
 *
 * IMPORTANT: WordPress category slugs MUST exactly match the `slug` values below.
 * If the backend creates a category with a different slug (e.g. `e-commerce`
 * instead of `ecommerce`), the corresponding category page will 404.
 *
 * See `WEB1/saasstatshub-data-schema.md` §5.3 for the canonical mapping.
 */

export interface CategoryMeta {
  /** WP category slug. URL: /{slug}/ */
  slug: string;
  /** Display name as shown in WP admin and on the site */
  name: string;
  /** Short label for compact UI (nav, pills) */
  shortName?: string;
  /**
   * Emoji icon. **Decorative-only** as of Phase 1 visual uplift (Req 4.2).
   * Primary UI surfaces (header, footer, breadcrumb, browse-categories,
   * hero pills, etc.) render the Lucide icon resolved from `iconName`
   * instead. The emoji is retained for ACF backward compatibility and
   * for any future ornamental usage.
   */
  emoji: string;
  /**
   * Lucide icon name (kebab-case). MUST resolve through
   * `src/lib/icon-registry.ts:resolveIcon()` — unknown values fail the build.
   */
  iconName: string;
  /** Primary color */
  color: string;
  /** Gradient end color */
  colorEnd: string;
  /** Soft background tint */
  bg: string;
  /** Description shown on category hero */
  desc: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { slug: 'crm',                name: 'CRM',                shortName: 'CRM',         emoji: '👥', iconName: 'users',           color: '#3B82F6', colorEnd: '#A78BFA', bg: '#1E3A8A', desc: 'CRM statistics 2026 — Salesforce, HubSpot, Zoho, Pipedrive market share, adoption rates & revenue data' },
  { slug: 'marketing',          name: 'Marketing',          shortName: 'Marketing',   emoji: '📣', iconName: 'megaphone',       color: '#A78BFA', colorEnd: '#F472B6', bg: '#3730A3', desc: 'Digital marketing statistics 2026 — SEO, PPC, email marketing, social media, content marketing & automation data' },
  { slug: 'ecommerce',          name: 'E-commerce',         shortName: 'E-commerce',  emoji: '🛒', iconName: 'shopping-cart',   color: '#34D399', colorEnd: '#10B981', bg: '#064E3B', desc: 'E-commerce statistics 2026 — Shopify, WooCommerce, Amazon, Stripe revenue, market size & growth trends' },
  { slug: 'project-management', name: 'Project Management', shortName: 'Project Mgmt', emoji: '📋', iconName: 'clipboard-list', color: '#FBBF24', colorEnd: '#F59E0B', bg: '#78350F', desc: 'Project management statistics 2026 — Asana, Jira, Monday.com, Trello, ClickUp adoption & productivity data' },
  { slug: 'hr',                 name: 'HR & Payroll',       shortName: 'HR',          emoji: '🧑‍💼', iconName: 'user-cog',        color: '#F87171', colorEnd: '#EF4444', bg: '#7F1D1D', desc: 'HR & payroll statistics 2026 — employee engagement, talent acquisition, compensation, benefits & HR technology data' },
  { slug: 'analytics',          name: 'Analytics',          shortName: 'Analytics',   emoji: '📊', iconName: 'bar-chart-3',     color: '#22D3EE', colorEnd: '#06B6D4', bg: '#164E63', desc: 'Analytics & SaaS market statistics 2026 — cloud computing, big data, AI, business intelligence & data warehouse trends' },
  { slug: 'security',           name: 'Security',           shortName: 'Security',    emoji: '🔒', iconName: 'shield',          color: '#818CF8', colorEnd: '#6366F1', bg: '#312E81', desc: 'Cybersecurity statistics 2026 — ransomware, data privacy, cloud security, endpoint protection & cyber insurance data' },
  { slug: 'communication',      name: 'Communication',      shortName: 'Comms',       emoji: '💬', iconName: 'message-square',  color: '#2DD4BF', colorEnd: '#14B8A6', bg: '#134E4A', desc: 'Communication platform statistics 2026 — Zoom, Slack, Microsoft Teams, UCaaS, CPaaS & video conferencing data' },
];

/** Lookup map: name -> meta (WP returns name; we look up by name). */
export const CATEGORY_META_BY_NAME: Record<string, CategoryMeta> =
  Object.fromEntries(CATEGORIES.map((c) => [c.name, c]));

/** Lookup map: slug -> meta */
export const CATEGORY_META_BY_SLUG: Record<string, CategoryMeta> =
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

/** Default fallback meta (used when WP returns an unexpected category name). */
export const FALLBACK_META: CategoryMeta = {
  slug: 'uncategorized',
  name: 'Uncategorized',
  emoji: '📊',
  iconName: 'bar-chart-3',
  color: '#3B82F6',
  colorEnd: '#A78BFA',
  bg: '#1E3A8A',
  desc: '',
};

export function metaFor(name?: string, slug?: string): CategoryMeta {
  if (name && CATEGORY_META_BY_NAME[name]) return CATEGORY_META_BY_NAME[name];
  if (slug && CATEGORY_META_BY_SLUG[slug]) return CATEGORY_META_BY_SLUG[slug];
  return FALLBACK_META;
}
