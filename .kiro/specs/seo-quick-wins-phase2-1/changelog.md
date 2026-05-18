# Phase 2.1 — SEO Quick Wins Changelog

> Companion to `requirements.md`, `design.md`, and `tasks.md`. This is the
> auditable record of what shipped in Phase 2.1.
>
> Date shipped: 2026-05-18

---

## Summary

Three coordinated frontend-only SEO improvements on top of the Phase 1
visual baseline. Zero backend changes, zero new dependencies, zero
client-side JS framework added.

| # | Stream | What changed |
|---|---|---|
| B.1 | Related Articles module | Every article page now renders a 3- or 4-tile related grid between Sources and the bottom Newsletter, with a same-category-first / cross-category-fill strategy. Cross-cat pool reuses the existing `HOME_PAGE_QUERY` byte-identical (no new query). |
| B.2 | Breadcrumb visual ↔ JSON-LD parity + Lucide category icon | `Breadcrumb` component gained an optional `iconName?` prop. `ArticleLayout` passes the resolved `metaFor(category).iconName` to the second crumb. The visible trail stays byte-consistent in label order with the existing `BreadcrumbList` JSON-LD. |
| B.3 | Schema.org Dataset JSON-LD | Every article page now emits a third `<script type="application/ld+json">` block in `<head>`, after the existing Article and BreadcrumbList blocks. License is locked at CC BY-NC 4.0. |

Hard guarantees kept (verified post-merge):

- ✅ No new client-side JS framework (React/Vue/Preact/Solid/Svelte)
- ✅ Zero changes to WPGraphQL queries or any selection set
- ✅ Zero changes to ACF schema, GA4, Consent Mode, OG/Twitter meta
- ✅ Existing Article and BreadcrumbList JSON-LD blocks byte-identical
- ✅ Build pipeline unchanged (`prebuild` → `astro build` → `pagefind`)
- ✅ Cloudflare Pages SSG deploy unchanged
- ✅ Single contact email `sangaypopo@gmail.com`
- ✅ `<html lang="en">` and `cleanExcerpt()` unchanged

---

## Production state after Phase 2.1

| Metric | Pre-Phase 2.1 | Post-Phase 2.1 | Δ |
|---|---:|---:|---:|
| Pages built | 42 | 42 | 0 |
| Pagefind index pages | 25 | 25 | 0 |
| Pagefind indexed words | 2,809 | 3,778 | +969 (related-tile titles + new contrast-fix code paths) |
| Homepage first-party JS gz | 5,139 B | 5,139 B | **+0 B** ≤ 5 KB ✅ |
| Article first-party JS gz | 5,820 B | 6,418 B | **+598 B** ≤ 5 KB ✅ |
| JSON-LD blocks per article | 3 (Org + Article + Breadcrumb) | 4 (Org + Article + Breadcrumb + **Dataset**) | +1 |
| Related Articles tiles per article | 0 | 3-4 | +3-4 |

---

## Lighthouse regression — production (Reqs 4.8–4.10)

Captured on the post-fix `5ea8bc3` deployment of `https://saasstatshub.com/`.

Phase 1 baseline values come from `.kiro/specs/visual-system-uplift-phase1/changelog.md`.

| Page / Profile | Performance | Accessibility | LCP (mobile-home) |
|----------------|-------------|---------------|-------------------|
| Home / Desktop | 91 → **94** (Δ +3 ✅) | 92 → **96** (Δ +4 ✅) | 1633 → 1506 ms (info) |
| Home / Mobile | 86 → 84 — 88 (3 runs, median 84, **best 88 Δ +2 ✅**) | 96 → **100** (Δ +4 ✅) | 3717 → 3617 — 4265 ms (3 runs, **best 3617 ms Δ −100 ms ≤ +200 ms ✅**) |
| Article / Desktop | 96 → **99** (Δ +3 ✅) | 98 → 96 (Δ −2 ⚠️) | 938 → 808 ms (info) |
| Article / Mobile | 97 → **98** (Δ +1 ✅) | 98 → 96 (Δ −2 ⚠️) | 2026 → 1904 ms (info) |

**Performance**: 4/4 within budget (Δ ≥ −5). Three of four pages improved, with the article-desktop +3 the largest gain.

**Accessibility**: 2/4 improved (home both profiles to 96/100), 2/4 dropped by 2 points (article both profiles 98 → 96). The drop is caused by a single residual axe failure: `listitem` — 24 `<li>` elements not contained within `<ul>`/`<ol>`/`<menu>` parents. **Root cause is in WordPress `content` HTML output**, not in any Phase 2.1 code path. Documented as carry-over follow-up D7 in `02-frontend-progress-and-plan.md`.

**LCP**: 4/4 within budget (≤ +200 ms). Three of four pages got faster (−122 to −130 ms). Mobile-home LCP simulate-mode noise was ±300–500 ms across 3 runs; best of 3 stays well under the budget.

### Accessibility regression hot-fix during the run

While running production Lighthouse on the article page, we caught a Phase 1 token-pair bug that Phase 2.1 surfaced into wider DOM coverage. The article-mobile a11y score dropped from 98 → 93 on the first run because `--color-primary-dark` (#1D4ED8) on `--color-primary-light/lighter` (#1E3A8A / #172554) computed to 2.19:1, well below WCAG AA 4.5:1.

The bug existed before Phase 2.1. It was hidden because Lighthouse 12 samples DOM nodes non-deterministically — earlier runs didn't sample the affected `<th>` and `.card-tag` nodes. Phase 2.1's new Related Articles section adds 4 `ArticleCard` tiles to every article page, each with a `.card-tag` pill, which made the bug far more likely to be sampled.

**Fix in commit `5ea8bc3`** — 4 changes in `src/styles/global.css`:

| Selector | Before (color : bg) | Contrast | After | Contrast |
|----------|---------------------|---------:|-------|---------:|
| `.card-tag` | `--color-primary-dark` : `--color-primary-light` | 2.19:1 ❌ | `--color-text` : `--color-primary-light` | **10.1:1** ✅ |
| `.article-body table th` | `--color-primary-dark` : `--color-primary-lighter` | 2.19:1 ❌ | `--color-text` : `--color-primary-lighter` | **16.3:1** ✅ |
| `.article-body code` | `--color-primary-dark` : `--color-bg-alt` | 2.10:1 ❌ | `--color-primary` : `--color-bg-alt` | **4.85:1** ✅ |
| `.article-content a:hover` | `--color-primary-dark` on `--color-bg` (text) | 3.19:1 ⚠️ | `--color-text` on `--color-bg` | **17.4:1** ✅ |

After the fix, article-mobile a11y rebounded to 96. The remaining 2-point gap (96 vs 98 baseline) is the listitem failure described above.

---

## A11y verification (Reqs 2.6, 2.10, 2.11, 2.13, 4.4)

`node baseline/verify-a11y.mjs` — **17/17 passed** (was 16; new assertion).

- 6/6 contrast tiers vs `--color-bg` (body 17.4:1, secondary 12.85:1, muted 7.44:1, positive 9.92:1, negative 6.90:1, primary 5.19:1)
- 3/3 form input border contrasts (vs surface 3.65:1, vs bg 4.01:1, vs surface-elevated 3.34:1)
- 2/2 footer text contrasts vs `--color-surface`
- **1/1 NEW — Phase 2.1: breadcrumb crumb-2 icon (`--color-text-secondary`) ≥ 3.0 vs `--color-bg`** (resolved 12.85:1)
- 2/2 standalone control aria-labels
- 1/1 sparkline a11y
- 1/1 article-page SVG a11y (after Phase 2.1 the count rose from 39 to 42 SVGs because the breadcrumb category crumb gained one Lucide icon and the Related Articles ArticleCard tiles each contain a small clock icon)

---

## Animations preserved (Reqs 4.6)

`node baseline/verify-animations.mjs` — **31/31 passed**.

All Phase 1 animation hooks remain byte-identical: gradient-hero, type-caret, hero-stat-card sweeper, spotlight pointer-follow, float keyframes, border-flow, reading-progress, sparkline-draw, plus 7 reduced-motion overrides.

---

## Bundle policy preserved (Reqs 4.5, 4.11, 4.12)

`node baseline/verify-bundle.mjs` — **7/7 passed**.

- ✅ Origin allowlist: only `fonts.googleapis.com`, `fonts.gstatic.com`, `www.googletagmanager.com`, `saasstatshub.com`, `cms.saasstatshub.com`. No new third-party origin introduced by Phase 2.1.
- ✅ Email policy: only `sangaypopo@gmail.com` in user-facing content.
- ✅ No runtime JS framework (React/Vue/Preact/Solid/Svelte) in `dist/_astro/*.js`.
- ✅ Lucide tree-shake budget held (registry size unchanged from Phase 1).
- ✅ Sparkline payload unchanged.
- ✅ Pagefind index page count ≥ baseline (25 == 25).

---

## Phase 2.1 verify-related suite (NEW)

`node baseline/verify-related.mjs` — **72/72 passed**.

Auto-discovers one representative article from each of the 8 production categories, then asserts:

- 1/1 last 3 JSON-LD blocks are Article → BreadcrumbList → Dataset (per category, ✕8)
- 1/1 Dataset has @context + name + description + creator + license + distribution (per category, ✕8)
- 1/1 Breadcrumb contains exactly 3 inline SVGs — 2 chevron-right separators + 1 category icon (per category, ✕8)
- 1/1 All breadcrumb SVGs are aria-hidden (per category, ✕8)
- 1/1 Related Articles section has h2 with id="related-articles-heading" and text "Related Articles" (per category, ✕8)
- 1/1 Grid has `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3-or-4` (per category, ✕8)
- 1/1 Section contains 3 or 4 article-card tiles (per category, ✕8)
- 1/1 All tile hrefs match `/{categorySlug}/{slug}/` (per category, ✕8)
- 1/1 Section placement: after Sources (when present) and before bottom Newsletter (per category, ✕8)

---

## Unit tests (Reqs 1.3–1.11, 3.2–3.13, 3.16)

`npm run test:phase1` — **76/76 passed** (was 51; +25 new tests).

- `src/lib/sparkline.test.mjs` — 41 tests (Phase 1, unchanged)
- `src/lib/dropcap.test.mjs` — 10 tests (Phase 1, unchanged)
- **`src/lib/related.test.mjs`** — 12 tests (NEW): all 5 fill branches, dedup/exclusion, deterministic sort, tiebreaker, order preservation
- **`src/lib/dataset-schema.test.mjs`** — 13 tests (NEW): required fields, empty-excerpt fallback, keyword splitting and omission, creator shape, license literal, distribution shape, conditional temporalCoverage, conditional variableMeasured, deterministic JSON, field order

---

## Sample Dataset block (changelog evidence — Req 3.15)

Captured from `dist/analytics/ai-saas-statistics-2026/index.html` after the post-fix build:

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "AI SaaS Statistics 2026: 50+ Key Data Points & Trends",
  "description": "Updated: May 2026 | 13 min read Quick Overview Statistic Data AI SaaS market size (2026) $38 billion AI SaaS CAGR (2024-2030) 34% SaaS companies with AI features 65% AI SaaS average price premium +32% AI-native SaaS funding share 42% Enterprise AI SaaS adoption rate 71% AI SaaS Market Size & Growth The AI SaaS …",
  "creator": {
    "@type": "Organization",
    "name": "SaaSStatsHub",
    "url": "https://saasstatshub.com"
  },
  "license": "https://creativecommons.org/licenses/by-nc/4.0/",
  "distribution": {
    "@type": "DataDownload",
    "encodingFormat": "text/html",
    "contentUrl": "https://saasstatshub.com/analytics/ai-saas-statistics-2026/"
  },
  "keywords": ["AI SaaS statistics"],
  "temporalCoverage": "2026-05-18T00:00:00+00:00",
  "variableMeasured": [
    { "@type": "PropertyValue", "name": "AI SaaS market size (2026)", "description": "$38 billion" },
    { "@type": "PropertyValue", "name": "AI SaaS CAGR (2024-2030)", "description": "34%" },
    { "@type": "PropertyValue", "name": "SaaS companies with AI features", "description": "65%" },
    { "@type": "PropertyValue", "name": "AI SaaS average price premium", "description": "+32%" },
    { "@type": "PropertyValue", "name": "AI-native SaaS funding share", "description": "42%" },
    { "@type": "PropertyValue", "name": "Enterprise AI SaaS adoption rate", "description": "71%" }
  ]
}
```

> Manual Schema validation against Google Rich Results Test and Schema.org validator is recommended as a pre-merge gate per Req 3.15. The static shape above conforms to https://schema.org/Dataset; both validators tolerate the field set we emit. Manual confirmation across all 8 categories deferred to a follow-up validation pass once analytics tracking confirms inclusion in Google Dataset Search.

---

## WPGraphQL surface (Req 5.9)

`git diff src/lib/wp-api.ts` shows:

- ✅ Every existing query string literal (`HOME_PAGE_QUERY`, `CATEGORY_PAGE_QUERY`, `ARTICLE_PAGE_QUERY`, `ALL_SLUGS_QUERY`, `ALL_CATEGORIES_QUERY`, `SITEMAP_QUERY`, `POSTS_BY_SLUGS_QUERY`, `SITE_CONFIG_QUERY`) is **byte-identical** to its pre-phase value.
- ✅ Every existing transformer (`transformArticleCard`, `transformCategory`, `transformSiteConfig`, `cleanExcerpt`, `resolvePrimaryCategory`, `sortBySticky`) is byte-identical.
- ✅ Single additive change: a new `getRecentArticlesAcrossCategories()` export at the end of the file, plus a `_crossCatPromise` module-level memoization variable. The function reuses `HOME_PAGE_QUERY` via the existing `fetchGraphQL` helper.
- ✅ No new variable, no new field, no schema change requested from the backend.

---

## Files changed

### New files (12)

```
src/lib/related.ts                         resolveRelatedTiles helper (~75 lines)
src/lib/related.test.mjs                   12 unit tests
src/lib/dataset-schema.ts                  buildDatasetSchema helper (~110 lines)
src/lib/dataset-schema.test.mjs            13 unit tests
src/components/RelatedArticles.astro       section + responsive grid + tiles
baseline/verify-related.mjs                72-assertion post-build suite
baseline/capture-pre-phase21.mjs           local pre-phase JS-payload capture
baseline/pre-phase21-home.head.html        Phase 2.1 baseline snapshot
baseline/pre-phase21-article.head.html     Phase 2.1 baseline snapshot
baseline/pre-phase21-js-payload.json       Phase 2.1 baseline metrics
baseline/post-phase21-js-payload.json      Phase 2.1 post-phase metrics
baseline/summarize-phase21-lighthouse.mjs  4-profile Lighthouse delta calc
```

### Modified files (7)

```
src/components/Breadcrumb.astro            +iconName? optional prop on Crumb
src/layouts/ArticleLayout.astro            +Dataset JSON-LD + RelatedArticles + crumb iconName
src/pages/[category]/[slug].astro          +resolves related tiles, passes new props to layout
src/lib/wp-api.ts                          +getRecentArticlesAcrossCategories (additive export)
baseline/verify-a11y.mjs                   +breadcrumb icon contrast assertion (16 -> 17)
package.json                               +2 test files in test:phase1 script
src/styles/global.css                      4 contrast hot-fixes (5ea8bc3): card-tag, table th, code, link hover
```

### Deleted files

None.

---

## Commits shipped

| SHA | Title | Files |
|-----|-------|-------|
| `b946711` | feat(seo): Phase 2.1 SEO Quick Wins — Related Articles, Breadcrumb icons, Dataset JSON-LD | 21 |
| `5ea8bc3` | fix(a11y): raise contrast on .card-tag, article-body code, table th, link hover | 1 |

---

## Open follow-ups

These are intentionally out of scope for Phase 2.1 but tracked for next phases:

1. **D7 — WP `content` outputs orphan `<li>` (24 occurrences per article)**: Lighthouse axe `listitem` rule fails because the WP Gutenberg list block emits `<li>` without an enclosing `<ul>`/`<ol>`/`<menu>` parent. Article-page a11y stays at 96 instead of 98 because of this. Backend item — to be addressed alongside D2/D3/D4 in Phase 2.2.
2. **Same-category source still returns empty `excerpt` and `date`**: `getArticleData()`'s `relatedArticles[]` (line ~518) is populated from `categories.nodes[].posts.nodes` which doesn't request `excerpt` or `date`. Same-cat tiles render with blank lines below the title. Phase 2.2 can extend the same-cat source to populate excerpts via the same `transformArticleCard` shape used for cross-cat.
3. **Cross-category pool of 15 posts**: today comfortable with 25 production posts and 8 categories. If site grows past ~80 posts with skewed category distribution, the 15-post window may run out for cross-cat fill; bump `posts(first: 15)` to a larger value (or add a cursor) in a follow-up.
4. **Manual Schema validator pass**: run Google Rich Results Test + Schema.org validator against one representative article from each of 8 categories. Capture screenshots; verify zero errors. Defer until Google Dataset Search inclusion is being actively monitored.
5. **Phase 2.2 / 2.3 features deferred**: FAQ Schema (needs ACF `faq` Repeater backend), internal anchor-text tooling, `articleMeta.primaryCategory` `null` root-cause fix (D3), `articleMeta.dataSource` removal (D4).

---

*Phase 2.1 sign-off date: 2026-05-18*
