/**
 * WordPress Headless CMS GraphQL Client
 * Fetches data from WPGraphQL endpoint at build time (SSG)
 */

import { mergeSiteConfig, defaultSiteConfig, type SiteConfig } from './site-config';

const WP_API_URL = import.meta.env.WP_API_URL || 'https://cms.saasstatshub.com/index.php?graphql';

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }> }>;
}

async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(WP_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`WP GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    console.error('GraphQL Errors:', JSON.stringify(json.errors, null, 2));
    throw new Error(`GraphQL Error: ${json.errors[0].message}`);
  }

  return json.data;
}

// ===== Type Definitions =====

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  description: string;
}

export interface ArticleCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  image: string;
  imageAlt: string;
  category: { name: string; slug: string };
  readTime: number;
  /** Whether the post is "stuck" to top of lists. Drives sort order. */
  isSticky?: boolean;
  /** ISO date string, used for stable sort within sticky/non-sticky groups. */
  rawDate?: string;
}

export interface QuickOverviewItem {
  statLabel: string;
  statValue: string;
}

export interface KeyTakeaway {
  takeawayText: string;
}

export interface SourceItem {
  name: string;
  title: string;
  date?: string;
  url?: string;
}

export interface ArticleDetail {
  id: string;
  title: string;
  slug: string;
  date: string;
  modified: string;
  excerpt: string;
  content: string;
  image: string;
  imageAlt: string;
  category: { name: string; slug: string };
  tags: Array<{ name: string; slug: string }>;
  lastUpdated: string;
  readTime: number;
  dataSource: string;
  focusKeywords: string;
  quickOverview: QuickOverviewItem[];
  keyTakeaways: KeyTakeaway[];
  sources: SourceItem[];
  relatedArticles: ArticleCard[];
}

export interface HomePageData {
  categories: Category[];
  latestArticles: ArticleCard[];
}

export interface CategoryPageData {
  category: Category;
  articles: ArticleCard[];
  hasNextPage: boolean;
  endCursor: string;
}

// ===== Data Transformers =====
// Transform raw WPGraphQL response into clean frontend types

/**
 * Resolve a post's "primary category" — the one that determines its URL.
 *
 * Priority:
 *   1. ACF taxonomy field `articleMeta.primaryCategory` (editor explicitly chose)
 *   2. First entry of `categories` (WP-default, ordered by term ID)
 *   3. Fallback to "uncategorized"
 *
 * Note: ACF taxonomy fields surface as a connection
 * (`primaryCategory.nodes[]`) in newer wpgraphql-acf, not a single object.
 */
function resolvePrimaryCategory(raw: any): { name: string; slug: string } {
  const acfNodes = raw?.articleMeta?.primaryCategory?.nodes;
  if (Array.isArray(acfNodes) && acfNodes.length > 0 && acfNodes[0]?.slug) {
    return {
      name: acfNodes[0].name || acfNodes[0].slug,
      slug: acfNodes[0].slug,
    };
  }
  const firstCat = raw?.categories?.nodes?.[0];
  if (firstCat?.slug) {
    return { name: firstCat.name, slug: firstCat.slug };
  }
  return { name: 'Uncategorized', slug: 'uncategorized' };
}

function transformArticleCard(raw: any): ArticleCard {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt?.replace(/<[^>]*>/g, '').trim() || '',
    date: raw.date ? new Date(raw.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
    rawDate: raw.date,
    image: raw.featuredImage?.node?.sourceUrl || '',
    imageAlt: raw.featuredImage?.node?.altText || raw.title,
    category: resolvePrimaryCategory(raw),
    readTime: raw.articleMeta?.readTime || 8,
    isSticky: raw.isSticky === true,
  };
}

function transformCategory(raw: any): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    count: raw.count || 0,
    description: raw.description || '',
  };
}

// ===== GraphQL Queries =====

const HOME_PAGE_QUERY = `
query HomePageData {
  categories(first: 8, where: { orderby: COUNT, order: DESC }) {
    nodes {
      id
      name
      slug
      count
      description
    }
  }
  posts(first: 15, where: { status: PUBLISH }) {
    nodes {
      id
      title
      slug
      isSticky
      excerpt
      date
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
      articleMeta {
        readTime
        primaryCategory {
          nodes {
            ... on Category {
              name
              slug
            }
          }
        }
      }
    }
  }
}
`;

const CATEGORY_PAGE_QUERY = `
query CategoryPageData($slug: ID!) {
  category(id: $slug, idType: SLUG) {
    id
    name
    slug
    description
    count
    posts(first: 12) {
      nodes {
        id
        title
        slug
        isSticky
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        articleMeta {
          readTime
          primaryCategory {
            nodes {
              ... on Category {
                name
                slug
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`;

const ARTICLE_PAGE_QUERY = `
query ArticlePageData($slug: ID!) {
  post(id: $slug, idType: SLUG) {
    id
    title
    slug
    date
    modified
    excerpt
    content
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    categories {
      nodes {
        name
        slug
        posts(first: 4, where: { status: PUBLISH }) {
          nodes {
            id
            title
            slug
            featuredImage {
              node {
                sourceUrl
              }
            }
          }
        }
      }
    }
    tags {
      nodes {
        name
        slug
      }
    }
    articleMeta {
      lastUpdated
      readTime
      dataSource
      focusKeywords
      primaryCategory {
        nodes {
          ... on Category {
            name
            slug
          }
        }
      }
    }
    quickOverviewItems {
      quickOverviewItems {
        statLabel
        statValue
      }
    }
    keyTakeaways {
      keyTakeaways {
        takeawayText
      }
    }
    sources {
      sources {
        name
        title
        date
        url
      }
    }
  }
}
`;

const ALL_SLUGS_QUERY = `
query AllPostSlugs($first: Int!, $after: String) {
  posts(first: $first, after: $after, where: { status: PUBLISH }) {
    nodes {
      slug
      categories {
        nodes {
          slug
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

const ALL_CATEGORIES_QUERY = `
query AllCategorySlugs {
  categories(first: 50) {
    nodes {
      slug
    }
  }
}
`;

const SITEMAP_QUERY = `
query SiteMapData {
  posts(first: 500, where: { status: PUBLISH }) {
    nodes {
      slug
      modified
      categories {
        nodes {
          slug
        }
      }
    }
  }
  categories(first: 20) {
    nodes {
      slug
    }
  }
}
`;

// ===== Public API =====

/**
 * Sort posts: sticky first, then most recent date.
 * Stable: relative order of same-bucket items preserved.
 */
export function sortBySticky<T extends { isSticky?: boolean; rawDate?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const stickyDiff = (b.isSticky ? 1 : 0) - (a.isSticky ? 1 : 0);
    if (stickyDiff !== 0) return stickyDiff;
    const ad = a.rawDate ? Date.parse(a.rawDate) : 0;
    const bd = b.rawDate ? Date.parse(b.rawDate) : 0;
    return bd - ad;
  });
}

export async function getHomePageData(): Promise<HomePageData> {
  const data = await fetchGraphQL<any>(HOME_PAGE_QUERY);
  return {
    categories: data.categories.nodes.map(transformCategory),
    latestArticles: sortBySticky(data.posts.nodes.map(transformArticleCard)),
  };
}

export async function getCategoryPageData(slug: string): Promise<CategoryPageData> {
  const data = await fetchGraphQL<any>(CATEGORY_PAGE_QUERY, { slug });
  const cat = data.category;
  return {
    category: transformCategory(cat),
    articles: sortBySticky(cat.posts.nodes.map(transformArticleCard)),
    hasNextPage: cat.posts.pageInfo.hasNextPage,
    endCursor: cat.posts.pageInfo.endCursor,
  };
}

export async function getArticleData(slug: string): Promise<ArticleDetail> {
  const data = await fetchGraphQL<any>(ARTICLE_PAGE_QUERY, { slug });
  const post = data.post;

  // Collect related articles from same category
  const relatedArticles: ArticleCard[] = [];
  if (post.categories?.nodes) {
    for (const cat of post.categories.nodes) {
      if (cat.posts?.nodes) {
        for (const related of cat.posts.nodes) {
          if (related.id !== post.id && !relatedArticles.find(r => r.id === related.id)) {
            relatedArticles.push({
              id: related.id,
              title: related.title,
              slug: related.slug,
              excerpt: '',
              date: '',
              image: related.featuredImage?.node?.sourceUrl || '',
              imageAlt: related.title,
              category: { name: cat.name, slug: cat.slug },
              readTime: 8,
            });
          }
        }
      }
    }
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    excerpt: post.excerpt?.replace(/<[^>]*>/g, '').trim() || '',
    content: post.content || '',
    image: post.featuredImage?.node?.sourceUrl || '',
    imageAlt: post.featuredImage?.node?.altText || post.title,
    category: resolvePrimaryCategory(post),
    tags: post.tags?.nodes?.map((t: any) => ({ name: t.name, slug: t.slug })) || [],
    lastUpdated: post.articleMeta?.lastUpdated || '',
    readTime: post.articleMeta?.readTime || 8,
    dataSource: post.articleMeta?.dataSource || '',
    focusKeywords: post.articleMeta?.focusKeywords || '',
    quickOverview: post.quickOverviewItems?.quickOverviewItems?.map((item: any) => ({
      statLabel: item.statLabel,
      statValue: item.statValue,
    })) || [],
    keyTakeaways: post.keyTakeaways?.keyTakeaways?.map((item: any) => ({
      takeawayText: item.takeawayText,
    })) || [],
    sources: post.sources?.sources?.map((s: any) => ({
      name: s.name,
      title: s.title,
      date: s.date,
      url: s.url,
    })) || [],
    relatedArticles: relatedArticles.slice(0, 4),
  };
}

export async function getAllArticleSlugs(): Promise<Array<{ slug: string; categorySlug: string }>> {
  const all: Array<{ slug: string; categorySlug: string }> = [];
  let cursor: string | null = null;
  // Hard cap to avoid infinite loop on misconfigured backends.
  const HARD_CAP = 50;
  for (let i = 0; i < HARD_CAP; i++) {
    const variables: Record<string, unknown> = { first: 100 };
    if (cursor) variables.after = cursor;
    const data = await fetchGraphQL<any>(ALL_SLUGS_QUERY, variables);
    const page = data.posts;
    if (!page) break;
    for (const post of page.nodes) {
      all.push({
        slug: post.slug,
        categorySlug: post.categories?.nodes?.[0]?.slug || 'uncategorized',
      });
    }
    if (!page.pageInfo?.hasNextPage) break;
    cursor = page.pageInfo.endCursor || null;
    if (!cursor) break;
  }
  return all;
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const data = await fetchGraphQL<any>(ALL_CATEGORIES_QUERY);
  return data.categories.nodes.map((cat: any) => cat.slug);
}

export async function getSitemapData(): Promise<{
  posts: Array<{ slug: string; modified: string; categorySlug: string }>;
  categories: string[];
}> {
  const data = await fetchGraphQL<any>(SITEMAP_QUERY);
  return {
    posts: data.posts.nodes.map((post: any) => ({
      slug: post.slug,
      modified: post.modified,
      categorySlug: post.categories?.nodes?.[0]?.slug || 'uncategorized',
    })),
    categories: data.categories.nodes.map((cat: any) => cat.slug),
  };
}

// ============================================================
// Site config (homepage CMS, footer, etc.)
// ============================================================

/**
 * Query the ACF Options Page that drives homepage layout.
 *
 * The expected ACF field group is `siteConfig` with a `homepageSections`
 * Flexible Content field. See WEB1/saasstatshub-homepage-cms-spec.md.
 *
 * If the backend hasn't set this up yet (or returns null), we fall back
 * to defaultSiteConfig so the site renders identically to before.
 */
const SITE_CONFIG_QUERY = `
query SiteConfig {
  siteConfig {
    homepageSections {
      __typename
      ... on SiteConfigHomepageSectionsHeroLayout {
        sectionId
        enabled
        headlineLine1
        headlineHighlight
        headlineLine2
        trustBadge
        searchPlaceholder
        taglinePhrases {
          phrase
        }
        pillCount
      }
      ... on SiteConfigHomepageSectionsHotStatsLayout {
        sectionId
        enabled
        eyebrow
        heading
        maxCards
        cards {
          cardId
          icon
          number
          label
          source
          gradient
          enabled
        }
      }
      ... on SiteConfigHomepageSectionsLatestArticlesLayout {
        sectionId
        enabled
        eyebrow
        heading
        mode
        count
        viewAllHref
        pinnedPosts {
          nodes {
            ... on Post {
              slug
            }
          }
        }
        category {
          nodes {
            ... on Category {
              slug
            }
          }
        }
      }
      ... on SiteConfigHomepageSectionsBrowseCategoriesLayout {
        sectionId
        enabled
        eyebrow
        heading
        subheading
        visibleCategories {
          nodes {
            ... on Category {
              slug
            }
          }
        }
      }
      ... on SiteConfigHomepageSectionsNewsletterCtaLayout {
        sectionId
        enabled
        pillText
        heading
        description
        emailPlaceholder
        buttonLabel
        socialProof
      }
    }
  }
}
`;

/** Loose shape of the raw GraphQL ACF response. */
interface RawAcfHomeSection {
  __typename: string;
  sectionId?: string;
  enabled?: boolean;
  // hero
  headlineLine1?: string;
  headlineHighlight?: string;
  headlineLine2?: string;
  trustBadge?: string;
  searchPlaceholder?: string;
  taglinePhrases?: Array<{ phrase: string }>;
  pillCount?: number;
  // shared
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  // hot-stats
  maxCards?: number;
  cards?: Array<{
    cardId: string;
    icon: string;
    number: string;
    label: string;
    source: string;
    gradient?: string;
    enabled?: boolean;
  }>;
  // latest-articles
  mode?: 'auto-latest' | 'manual-pinned' | 'category';
  count?: number;
  viewAllHref?: string;
  pinnedPosts?: { nodes?: Array<{ slug: string } | null> } | null;
  category?: { nodes?: Array<{ slug: string } | null> } | null;
  // browse-categories
  visibleCategories?: { nodes?: Array<{ slug: string } | null> } | null;
  // newsletter-cta
  pillText?: string;
  description?: string;
  emailPlaceholder?: string;
  buttonLabel?: string;
  socialProof?: string;
}

/** Map ACF __typename suffix to our internal section `type`. */
function acfTypeToSectionType(typename: string): string | null {
  if (typename.endsWith('HeroLayout')) return 'hero';
  if (typename.endsWith('HotStatsLayout')) return 'hot-stats';
  if (typename.endsWith('LatestArticlesLayout')) return 'latest-articles';
  if (typename.endsWith('BrowseCategoriesLayout')) return 'browse-categories';
  if (typename.endsWith('NewsletterCtaLayout')) return 'newsletter-cta';
  return null;
}

function transformSiteConfig(raw: any): SiteConfig {
  const wpSections = raw?.siteConfig?.homepageSections;
  if (!Array.isArray(wpSections) || wpSections.length === 0) {
    return defaultSiteConfig;
  }

  const sections: any[] = [];
  for (const s of wpSections as RawAcfHomeSection[]) {
    const type = acfTypeToSectionType(s.__typename);
    if (!type) continue;

    const base = {
      id: s.sectionId || type,
      type,
      enabled: s.enabled !== false,
      eyebrow: s.eyebrow,
      heading: s.heading,
      subheading: s.subheading,
    };

    switch (type) {
      case 'hero':
        sections.push({
          ...base,
          headlineLine1: s.headlineLine1,
          headlineHighlight: s.headlineHighlight,
          headlineLine2: s.headlineLine2,
          trustBadge: s.trustBadge,
          searchPlaceholder: s.searchPlaceholder,
          taglinePhrases: (s.taglinePhrases || []).map((p) => p.phrase).filter(Boolean),
          pillCount: s.pillCount,
        });
        break;
      case 'hot-stats':
        sections.push({
          ...base,
          maxCards: s.maxCards,
          cards: (s.cards || []).map((c) => ({
            id: c.cardId,
            icon: c.icon,
            number: c.number,
            label: c.label,
            source: c.source,
            gradient: c.gradient,
            enabled: c.enabled !== false,
          })),
        });
        break;
      case 'latest-articles':
        sections.push({
          ...base,
          mode: s.mode || 'auto-latest',
          count: s.count,
          viewAllHref: s.viewAllHref,
          pinnedSlugs: (s.pinnedPosts?.nodes || []).filter(Boolean).map((p: any) => p.slug),
          categorySlug: s.category?.nodes?.[0]?.slug,
        });
        break;
      case 'browse-categories':
        sections.push({
          ...base,
          visibleSlugs: (s.visibleCategories?.nodes || []).filter(Boolean).map((c: any) => c.slug),
        });
        break;
      case 'newsletter-cta':
        sections.push({
          ...base,
          pillText: s.pillText,
          description: s.description,
          emailPlaceholder: s.emailPlaceholder,
          buttonLabel: s.buttonLabel,
          socialProof: s.socialProof,
        });
        break;
    }
  }

  return mergeSiteConfig({
    homepageSections: sections,
    footerTagline: raw?.siteConfig?.footerTagline,
  });
}

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const data = await fetchGraphQL<any>(SITE_CONFIG_QUERY);
    return transformSiteConfig(data);
  } catch {
    // Backend hasn't wired up the ACF Options Page yet, or query failed.
    return defaultSiteConfig;
  }
}

// ============================================================
// Article picker: resolve a list of slugs to ArticleCard data
// ============================================================

const POSTS_BY_SLUGS_QUERY = `
query PostsBySlugs($slugs: [String]!) {
  posts(first: 30, where: { status: PUBLISH, nameIn: $slugs }) {
    nodes {
      id
      title
      slug
      excerpt
      date
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
      articleMeta {
        readTime
      }
    }
  }
}
`;

/**
 * Fetch a list of posts by slug, preserving the order of the input array.
 * Used by `LatestArticlesSection` mode === 'manual-pinned'.
 */
export async function getPostsBySlugs(slugs: string[]): Promise<ArticleCard[]> {
  if (slugs.length === 0) return [];
  try {
    const data = await fetchGraphQL<any>(POSTS_BY_SLUGS_QUERY, { slugs });
    const bySlug = new Map<string, ArticleCard>();
    for (const node of data.posts.nodes) {
      bySlug.set(node.slug, transformArticleCard(node));
    }
    // Preserve editor-defined order; drop slugs that didn't resolve.
    return slugs.map((s) => bySlug.get(s)).filter((x): x is ArticleCard => !!x);
  } catch {
    return [];
  }
}
