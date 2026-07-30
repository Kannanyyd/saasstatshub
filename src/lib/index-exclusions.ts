import manifest from '../data/index-exclusions.json';

export interface IndexExclusion {
  category: string;
  slug: string;
}

export const INDEX_EXCLUSIONS = manifest.pages as IndexExclusion[];
export const INDEX_EXCLUSION_PATHS = new Set(
  INDEX_EXCLUSIONS.map(({ category, slug }) => `/${category}/${slug}/`),
);

export function isIndexExcluded(category: string, slug: string): boolean {
  return INDEX_EXCLUSION_PATHS.has(`/${category}/${slug}/`);
}
