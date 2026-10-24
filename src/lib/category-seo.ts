/**
 * Category-level SEO overrides.
 *
 * Default category-page metadata is generated from the CMS category
 * (title: "{name} Statistics", description: CMS category description).
 * A category can opt into a specific positioning by adding an entry here.
 * Overrides are intentionally per-category: do NOT replace the fallback
 * for all categories at once — each entry is a reviewable, isolated
 * experiment (see docs/superpowers/plans/2026-10-24-search-growth-first-batch.md,
 * task 2: only E-commerce gets an override in the first batch).
 */
export interface CategorySeo {
  /** Page title passed to BaseLayout (site name is appended by createPageTitle). */
  title: string;
  /** Visible H1 in the category hero. */
  h1: string;
  /** Meta description AND hero paragraph (kept identical so the meta matches visible content). */
  description: string;
}

export interface CategorySeoDefaults {
  name: string;
  description: string;
}

const CATEGORY_SEO_OVERRIDES: Readonly<Record<string, CategorySeo>> = {
  ecommerce: {
    title: 'E-commerce Research: Statistics, Platforms & Trends',
    h1: 'E-commerce Research: Statistics, Platforms & Trends',
    description:
      'Explore e-commerce statistics, platform comparisons, and research guides. Start with sourced U.S. online sales and mobile shopping data.',
  },
};

export function categorySeoFor(slug: string, defaults: CategorySeoDefaults): CategorySeo {
  const override = CATEGORY_SEO_OVERRIDES[slug];
  if (override) return override;
  return {
    title: `${defaults.name} Statistics`,
    h1: `${defaults.name} Statistics`,
    description: defaults.description || `Latest ${defaults.name} statistics, market data, and trends.`,
  };
}
