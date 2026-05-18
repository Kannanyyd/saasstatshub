# Implementation Plan: Phase 2.1 SEO Quick Wins

## Overview

This plan implements the three Phase 2.1 work streams defined in [design.md](./design.md): Related Articles module, Breadcrumb visual consistency with Lucide category icon, and Schema.org Dataset JSON-LD injection. 16 tasks across 8 execution waves. All tasks are frontend-only, zero backend changes.

## Tasks

- [x] 1. Capture Pre-Phase 2.1 Baseline
  - [x] 1.1 Run `npm run build` and confirm exit 0
  - [x] 1.2 Run `node baseline/extract-head.mjs` → save as `baseline/pre-phase21-article.head.html`
  - [x] 1.3 Run `node baseline/measure-js-payload.mjs` → record in `baseline/pre-phase21-js-payload.json`
  - [x] 1.4 Run `node baseline/verify-animations.mjs` → confirm 31/31 pass
  - [x] 1.5 Run `node baseline/verify-a11y.mjs` → confirm 16/16 pass
  - [x] 1.6 Run `node baseline/verify-bundle.mjs` → confirm 7/7 pass
  - [x] 1.7 Run `npm run test:phase1` → confirm 51/51 pass
  - [x] 1.8 Record Pagefind index page count in baseline JSON
  - [x] 1.9 Store all artifacts under `baseline/pre-phase21-*` prefix
- [x] 2. Implement `src/lib/related.ts` — resolveRelatedTiles helper
  - [x] 2.1 Create file with `ResolveRelatedArgs` interface and `resolveRelatedTiles()` function
  - [x] 2.2 Implement 5-branch fill logic (same ≥ 3, same = 2, same = 1, same = 0 + pool ≥ 3, same = 0 + pool < 3)
  - [x] 2.3 Implement cross-category filtering (exclude current id, same-cat ids, same primary slug)
  - [x] 2.4 Implement deterministic sort (date desc, id asc tiebreaker)
  - [x] 2.5 Return [] when merged count < 3
- [x] 3. Implement `src/lib/related.test.mjs` — unit tests for related tiles
  - [x] 3.1 Create file with ≥ 8 tests covering all fill branches
  - [x] 3.2 Cover dedup/exclusion, tiebreaker, order preservation
  - [x] 3.3 Wire into `package.json` `test:phase1` script
  - [x] 3.4 Run `npm run test:phase1` → new tests pass alongside existing 51
- [x] 4. Implement `src/lib/dataset-schema.ts` — buildDatasetSchema helper
  - [x] 4.1 Create file with `DatasetSchemaProps`, `DatasetSchema` interfaces and `buildDatasetSchema()` function
  - [x] 4.2 Implement required fields (@context, @type, name, description, creator, license, distribution)
  - [x] 4.3 Implement conditional keywords (split, trim, drop empties, omit when empty)
  - [x] 4.4 Implement conditional temporalCoverage (pass-through, omit when empty)
  - [x] 4.5 Implement conditional variableMeasured (map quickOverview → PropertyValue[], omit when empty)
  - [x] 4.6 Implement description fallback to title when cleanExcerpt is empty
- [x] 5. Implement `src/lib/dataset-schema.test.mjs` — unit tests for Dataset schema
  - [x] 5.1 Create file with ≥ 10 tests covering required fields, conditional omission, determinism
  - [x] 5.2 Wire into `package.json` `test:phase1` script
  - [x] 5.3 Run `npm run test:phase1` → new tests pass alongside existing suite
- [x] 6. Add `getRecentArticlesAcrossCategories()` export to `src/lib/wp-api.ts`
  - [x] 6.1 Add module-level memoization variable `_crossCatPromise`
  - [x] 6.2 Implement function: reuse HOME_PAGE_QUERY, transform via transformArticleCard, sort via sortBySticky
  - [x] 6.3 On fetch failure: console.warn + return [] (graceful degradation)
  - [x] 6.4 Export the function
  - [x] 6.5 Verify git diff shows zero changes to any query string literal
- [x] 7. Edit `src/components/Breadcrumb.astro` — add optional iconName prop
  - [x] 7.1 Update Crumb interface to add `iconName?: string`
  - [x] 7.2 When iconName set: render Icon with aria-hidden="true", w-4 h-4, text-text-secondary, shrink-0, gap-1.5
  - [x] 7.3 When iconName not set: render label as before (no icon, no extra wrapper)
  - [x] 7.4 Verify existing homepage/category-page breadcrumbs render unchanged
  - [x] 7.5 Verify `npm run build` exits 0
- [x] 8. Create `src/components/RelatedArticles.astro`
  - [x] 8.1 Accept `tiles: ArticleCard[]` prop
  - [x] 8.2 Early-return when tiles.length < 3
  - [x] 8.3 Render section with class="related-articles" and aria-labelledby
  - [x] 8.4 Render h2 with id="related-articles-heading" and text "Related Articles"
  - [x] 8.5 Render responsive grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 or lg:grid-cols-4)
  - [x] 8.6 Render each tile via existing ArticleCard component with unchanged props
  - [x] 8.7 Verify no client-side JS emitted
- [x] 9. Edit `src/layouts/ArticleLayout.astro` — wire all Phase 2.1 features
  - [x] 9.1 Import RelatedArticles, metaFor, buildDatasetSchema, ArticleCard type
  - [x] 9.2 Add new optional props: focusKeywords, lastUpdated, relatedTiles
  - [x] 9.3 Build datasetSchema object via buildDatasetSchema()
  - [x] 9.4 Resolve categoryMeta via metaFor(category, categorySlug) for breadcrumb icon
  - [x] 9.5 Emit Dataset JSON-LD as 3rd script block after Article and BreadcrumbList
  - [x] 9.6 Pass iconName to second crumb in Breadcrumb call
  - [x] 9.7 Conditionally render RelatedArticles between Sources and Newsletter when tiles ≥ 3
  - [x] 9.8 Verify npm run build exits 0
  - [x] 9.9 Verify existing Article and BreadcrumbList JSON-LD blocks byte-identical
- [x] 10. Edit `src/pages/[category]/[slug].astro` — resolve and pass related tiles
  - [x] 10.1 Import getRecentArticlesAcrossCategories and resolveRelatedTiles
  - [x] 10.2 Call getRecentArticlesAcrossCategories() after getArticleData
  - [x] 10.3 Call resolveRelatedTiles with sameCategory, crossCategoryPool, currentArticleId, currentPrimaryCategorySlug
  - [x] 10.4 Pass relatedTiles, focusKeywords, lastUpdated to ArticleLayout
  - [x] 10.5 Verify npm run build exits 0 and article pages render Related Articles
- [x] 11. Run full Phase 1 verification suite
  - [x] 11.1 Run `npm run test:phase1` → all tests pass (76 total: 51 original + 12 related + 13 dataset)
  - [x] 11.2 Run `node baseline/verify-animations.mjs` → 31/31 pass
  - [x] 11.3 Run `node baseline/verify-a11y.mjs` → 16/16 pass (now 17/17 with new assertion)
  - [x] 11.4 Run `node baseline/verify-bundle.mjs` → 7/7 pass
  - [x] 11.5 Run `npm run build` → exit 0, Pagefind page count 25 ≥ pre-phase21 baseline
  - [x] 11.6 Compare article head against pre-phase21 baseline: only Dataset script added
- [x] 12. Create `baseline/verify-related.mjs` — new post-build verification script
  - [x] 12.1 Auto-discover representative article HTML from dist (one per category)
  - [x] 12.2 Assert section.related-articles present on pages with ≥ 3 tiles
  - [x] 12.3 Assert h2 heading text exactly "Related Articles"
  - [x] 12.4 Assert grid contains 3 or 4 article-card children
  - [x] 12.5 Assert each tile href matches /{categorySlug}/{slug}/ pattern
  - [x] 12.6 Assert responsive grid classes present
  - [x] 12.7 Assert three ld+json scripts in head in order: Article, BreadcrumbList, Dataset
  - [x] 12.8 Assert Dataset block has required fields
  - [x] 12.9 Assert breadcrumb nav contains inline svg with aria-hidden on category crumb
  - [x] 12.10 Run script → all assertions pass (72/72)
- [x] 13. Add breadcrumb icon contrast assertion to `verify-a11y.mjs`
  - [x] 13.1 Add assertion: crumb-2 icon color (#CBD5E1) achieves ≥ 3:1 vs bg (#0A0F1F)
  - [x] 13.2 Run verify-a11y.mjs → passes with 17 assertions
- [ ] 14. Production deploy and Lighthouse regression
  - [ ] 14.1 Commit all Phase 2.1 changes with detailed multi-line message
  - [ ] 14.2 Push to main (Cloudflare Pages auto-deploys)
  - [ ] 14.3 Wait for CF Pages build success
  - [ ] 14.4 Smoke test: Related Articles visible, 3 JSON-LD blocks, breadcrumb icon present
  - [ ] 14.5 Run Lighthouse home desktop + mobile, article desktop + mobile
  - [ ] 14.6 Compare: Performance Δ ≥ −5, Accessibility Δ ≥ 0, mobile LCP Δ ≤ +200ms
  - [ ] 14.7 Record results
- [ ] 15. Schema validation (manual gate)
  - [ ] 15.1 Run Google Rich Results Test on one article from each of 8 categories
  - [ ] 15.2 Run Schema.org validator on same 8 URLs
  - [ ] 15.3 Confirm zero errors on Dataset block for all 8
  - [ ] 15.4 Capture results for changelog
- [ ] 16. Write changelog.md
  - [ ] 16.1 Create `.kiro/specs/seo-quick-wins-phase2-1/changelog.md`
  - [ ] 16.2 Document summary of 3 work streams shipped
  - [ ] 16.3 Document dependency additions (none expected)
  - [ ] 16.4 Document bundle size deltas vs pre-phase21 baseline
  - [ ] 16.5 Document head diff vs Phase_1_Baseline
  - [ ] 16.6 Document A11y, Animation, Unit test results
  - [ ] 16.7 Document Lighthouse comparison table
  - [ ] 16.8 Document Schema validator results
  - [ ] 16.9 Document Pagefind page count
  - [ ] 16.10 Document files changed/created/deleted
  - [ ] 16.11 Document open follow-ups

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1, 2, 4, 6, 7, 8], "parallel": true },
    { "wave": 2, "tasks": [3, 5], "parallel": true, "dependsOn": { "3": [2], "5": [4] } },
    { "wave": 3, "tasks": [9], "parallel": false, "dependsOn": { "9": [4, 7, 8] } },
    { "wave": 4, "tasks": [10], "parallel": false, "dependsOn": { "10": [2, 6, 9] } },
    { "wave": 5, "tasks": [11, 12, 13], "parallel": true, "dependsOn": { "11": [10], "12": [10], "13": [7] } },
    { "wave": 6, "tasks": [14], "parallel": false, "dependsOn": { "14": [11, 12, 13] } },
    { "wave": 7, "tasks": [15], "parallel": false, "dependsOn": { "15": [14] } },
    { "wave": 8, "tasks": [16], "parallel": false, "dependsOn": { "16": [14, 15] } }
  ]
}
```

## Notes

- Total: 16 tasks, 8 waves. Estimated: 3–4 hours for an engineer familiar with the codebase.
- Tasks 1–13 are local (no deploy needed). Task 14 triggers production deploy.
- Task 15 is a manual gate requiring browser access to Google Rich Results Test.
- If Lighthouse regression is detected at Task 14, revert and investigate before proceeding.
- The `test:phase1` script in package.json must be updated (Tasks 3, 5) to include the new test files before Task 11 runs.
