import rules from '../data/url-consolidations.json';

export interface UrlConsolidation {
  sourceCategory: string;
  sourceSlug: string;
  destinationCategory: string;
  destinationSlug: string;
  reason: string;
}

export const URL_CONSOLIDATIONS = rules as UrlConsolidation[];
export const CONSOLIDATED_SLUGS = new Set(
  URL_CONSOLIDATIONS.map((rule) => rule.sourceSlug),
);

export function isConsolidatedSlug(slug: string): boolean {
  return CONSOLIDATED_SLUGS.has(slug);
}

export function activePosts<T extends { slug?: string }>(posts: T[]): T[] {
  return posts.filter((post) => !post.slug || !isConsolidatedSlug(post.slug));
}
