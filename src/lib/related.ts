/**
 * Phase 2.1 — Related Articles tile resolver.
 *
 * Pure helper that resolves the final list of Related Articles tiles for an
 * Article_Page, given the same-category pool from getArticleData() and the
 * cross-category pool from getRecentArticlesAcrossCategories().
 *
 * Implements requirements.md §1.3–1.11. SSG-friendly: no DOM, no I/O,
 * fully deterministic. Two consecutive runs against the same input
 * produce byte-identical output (Req 1.11).
 */

import type { ArticleCard } from './wp-api';

export interface ResolveRelatedArgs {
  /** Same-category candidates already populated by getArticleData().relatedArticles. */
  sameCategory: ArticleCard[];
  /** Cross-category candidates from getRecentArticlesAcrossCategories(). */
  crossCategoryPool: ArticleCard[];
  /** The current article id, used to exclude self from the cross-cat pool. */
  currentArticleId: string;
  /** Primary category slug of the current article, used to exclude same-cat-slug posts from cross-cat pool. */
  currentPrimaryCategorySlug: string;
}

/**
 * Returns the final list of tiles to render, in render order:
 *   - same-category entries first (preserving input order)
 *   - then cross-category entries (sorted by date desc, id asc tiebreaker)
 *
 * Returns [] when the resolved count is < 3 (caller renders nothing — Req 1.7).
 */
export function resolveRelatedTiles(args: ResolveRelatedArgs): ArticleCard[] {
  const {
    sameCategory,
    crossCategoryPool,
    currentArticleId,
    currentPrimaryCategorySlug,
  } = args;

  const sameCount = sameCategory.length;

  // Branch 1: same-cat already 3 or 4 → no cross-cat fill (Req 1.3)
  if (sameCount >= 3) {
    return sameCategory.slice(0, 4);
  }

  // Build the cross-cat candidate set (Req 1.10):
  //   - exclude current article
  //   - exclude any id present in same-cat
  //   - exclude any post whose primary category slug matches current
  const sameIds = new Set(sameCategory.map((a) => a.id));
  const crossCandidates = crossCategoryPool
    .filter((a) => a.id !== currentArticleId)
    .filter((a) => !sameIds.has(a.id))
    .filter((a) => a.category.slug !== currentPrimaryCategorySlug);

  // Sort: publish date desc, then id asc as deterministic tiebreaker (Req 1.11)
  const sortedCross = [...crossCandidates].sort((a, b) => {
    const ad = a.rawDate ? Date.parse(a.rawDate) : 0;
    const bd = b.rawDate ? Date.parse(b.rawDate) : 0;
    if (bd !== ad) return bd - ad;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  // Compute fill quota per Req 1.4–1.6
  let need: number;
  if (sameCount === 2) {
    need = Math.min(2, sortedCross.length); // total 3 or 4 (Req 1.4)
  } else if (sameCount === 1) {
    need = 2; // total 3 (Req 1.5)
  } else {
    need = 3; // sameCount === 0, total 3 (Req 1.6)
  }

  const crossFill = sortedCross.slice(0, need);
  const merged = [...sameCategory, ...crossFill];

  // Hide entirely if final count < 3 (Req 1.7)
  if (merged.length < 3) return [];
  return merged;
}
