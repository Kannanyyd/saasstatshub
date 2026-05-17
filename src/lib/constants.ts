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
  /** Emoji icon */
  emoji: string;
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
  { slug: 'crm',                name: 'CRM',                shortName: 'CRM',         emoji: '👥', color: '#2563EB', colorEnd: '#7C3AED', bg: '#DBEAFE', desc: 'Customer relationship management stats' },
  { slug: 'marketing',          name: 'Marketing',          shortName: 'Marketing',   emoji: '📣', color: '#7C3AED', colorEnd: '#EC4899', bg: '#EDE9FE', desc: 'Digital marketing platform data' },
  { slug: 'ecommerce',          name: 'E-commerce',         shortName: 'E-commerce',  emoji: '🛒', color: '#059669', colorEnd: '#10B981', bg: '#D1FAE5', desc: 'Online retail & marketplace insights' },
  { slug: 'project-management', name: 'Project Management', shortName: 'Project Mgmt', emoji: '📋', color: '#D97706', colorEnd: '#F59E0B', bg: '#FEF3C7', desc: 'PM tool adoption & productivity' },
  { slug: 'hr',                 name: 'HR & Payroll',       shortName: 'HR',          emoji: '🧑‍💼', color: '#DC2626', colorEnd: '#F87171', bg: '#FEE2E2', desc: 'Human resources & workforce data' },
  { slug: 'analytics',          name: 'Analytics',          shortName: 'Analytics',   emoji: '📊', color: '#0891B2', colorEnd: '#06B6D4', bg: '#CFFAFE', desc: 'Business intelligence & data tools' },
  { slug: 'security',           name: 'Security',           shortName: 'Security',    emoji: '🔒', color: '#4338CA', colorEnd: '#6366F1', bg: '#E0E7FF', desc: 'Cybersecurity & compliance' },
  { slug: 'communication',      name: 'Communication',      shortName: 'Comms',       emoji: '💬', color: '#0D9488', colorEnd: '#14B8A6', bg: '#CCFBF1', desc: 'Messaging & collaboration platforms' },
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
  color: '#2563EB',
  colorEnd: '#7C3AED',
  bg: '#DBEAFE',
  desc: '',
};

export function metaFor(name?: string, slug?: string): CategoryMeta {
  if (name && CATEGORY_META_BY_NAME[name]) return CATEGORY_META_BY_NAME[name];
  if (slug && CATEGORY_META_BY_SLUG[slug]) return CATEGORY_META_BY_SLUG[slug];
  return FALLBACK_META;
}
