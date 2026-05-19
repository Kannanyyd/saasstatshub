# Requirements Document

> Phase 2.2 — FAQ Schema

## Introduction

This is **Phase 2.2 — FAQ Schema** for SaaSStatsHub (https://saasstatshub.com). The phase delivers two coordinated frontend deliverables on top of the Phase 1 + 2.1 + 2.3 baseline shipped on 2026-05-18: (①) extending the existing WPGraphQL article query to include a new `faq` field that the backend has just exposed via the `faq-field-group.php` mu-plugin (`faq.faq[].{question,answer}`); (②) emitting a Schema.org `FAQPage` JSON-LD block in the article-page `<head>` as a fourth structured-data block alongside the existing Article + BreadcrumbList + Dataset blocks, AND optionally rendering a visible FAQ accordion section in the article body.

This is the first phase since v1.0 that **changes the WPGraphQL query selection set** (every prior phase forbid it). The change is purely additive: a new `faq { faq { question answer } }` block is added to `ARTICLE_PAGE_QUERY`. No existing field is removed or renamed.

Out of scope for this phase: removing `articleMeta.dataSource` (deferred to Phase 2.x backend cleanup, item D4). Adding FAQ to non-article pages (homepage, category page) is out of scope; FAQ schema is article-only by design. Visual styling beyond the dark-theme baseline is out of scope.

## Glossary

- **Site**: The static site rendered from this Astro project and deployed to Cloudflare Pages at https://saasstatshub.com.
- **Article_Page**: Any page rendered by `src/pages/[category]/[slug].astro` via the `ArticleLayout` template, served at `/{categorySlug}/{slug}/`.
- **Article_Layout**: The layout component at `src/layouts/ArticleLayout.astro`.
- **FAQ_Item**: A `{ question: string; answer: string }` pair as returned by WPGraphQL via `faq.faq[]`. Question is plain text. Answer is plain text in this phase (no HTML).
- **FAQPage_Schema**: A new fourth `<script type="application/ld+json">` block introduced by this phase, emitted in Article_Layout `<head>` as a sibling to the existing Article + BreadcrumbList + Dataset blocks. Conforms to https://schema.org/FAQPage.
- **FAQ_Section**: A new visible UI section rendered in the article body, between Sources and Related Articles. Shows the FAQ items as native HTML5 `<details>` / `<summary>` accordions (no client-side JS framework).
- **Article_Schema / Breadcrumb_Schema / Dataset_Schema**: The three existing JSON-LD blocks emitted by Article_Layout. Unchanged by this phase.
- **Pre_Phase_2_2_Baseline**: A snapshot captured immediately before the Phase 2.2 branch is merged, comprising: (a) Lighthouse Performance and Accessibility scores for the homepage and a representative Article_Page on both desktop and mobile profiles; (b) the count of pages in the Pagefind_Index; (c) the homepage and article-page first-party gzipped JS payload sizes; (d) the byte-level contents of the Article_Page `<head>` block; (e) the result of each verification suite (76 unit / 31 anim / 17 a11y / 7 bundle / 72 verify-related).
- **Schema_Validator**: Either of two third-party validators: Google Rich Results Test (https://search.google.com/test/rich-results) and the Schema.org validator (https://validator.schema.org/). A JSON-LD block is "valid" when both validators report zero errors against it.
- **WCAG_AA**: WCAG 2.1 Level AA contrast ratios — at least 4.5:1 for body text below 18pt regular / 14pt bold, and at least 3:1 for large text and non-text UI components.

## Requirements

### Requirement 1: Extend WPGraphQL article query with FAQ field (additive)

**User Story:** As a frontend maintainer, I want the existing `getArticleData()` to additionally pull `faq.faq[]` from WPGraphQL so the new schema and UI can use it, without breaking any other query field or transformer.

#### Acceptance Criteria

1. THE `ARTICLE_PAGE_QUERY` string in `src/lib/wp-api.ts` SHALL be extended to add exactly one new top-level Repeater block `faq { faq { question answer } }` alongside the existing `quickOverviewItems`, `keyTakeaways`, `sources`, `articleMeta`, `tags`, `categories`, `featuredImage` blocks.
2. WHERE the new `faq` Repeater block is added, THE field order of all other selection-set entries (categories, tags, articleMeta, quickOverviewItems, keyTakeaways, sources, featuredImage) SHALL remain byte-identical to their pre-phase order, and no existing field SHALL be removed.
3. THE `ArticleDetail` TypeScript interface SHALL gain exactly one new field `faqItems: FaqItem[]` where `FaqItem = { question: string; answer: string }`. No existing field on `ArticleDetail` SHALL be removed or renamed.
4. THE `getArticleData(slug)` function SHALL populate the new `faqItems` field by mapping `post.faq?.faq?.map((item) => ({ question: item.question, answer: item.answer })) ?? []`, mirroring the existing handling for quickOverviewItems / keyTakeaways / sources.
5. WHERE the GraphQL response has zero faq items (the field is null, or the array is empty, or the post has no faq populated), `getArticleData()` SHALL return `faqItems: []` (empty array, never null or undefined).
6. THE existing `transformArticleCard` function and the existing `HOME_PAGE_QUERY`, `CATEGORY_PAGE_QUERY`, `ALL_SLUGS_QUERY`, `ALL_CATEGORIES_QUERY`, `SITEMAP_QUERY`, `POSTS_BY_SLUGS_QUERY`, `SITE_CONFIG_QUERY` query string literals SHALL remain byte-identical to their pre-phase values; only `ARTICLE_PAGE_QUERY` is touched.
7. THE existing `cleanExcerpt`, `resolvePrimaryCategory`, `sortBySticky`, `getRecentArticlesAcrossCategories` functions SHALL remain byte-identical to their pre-phase values.

### Requirement 2: Emit Schema.org FAQPage JSON-LD on every article page that has FAQ items

**User Story:** As an SEO operator targeting FAQ rich results, I want every article that has at least one FAQ item to emit a valid Schema.org FAQPage JSON-LD block, so articles become eligible for Google's FAQ rich-result accordion in SERPs.

#### Acceptance Criteria

1. WHEN an Article_Page is rendered AND `faqItems.length >= 1`, THE Article_Layout SHALL emit exactly one FAQPage_Schema `<script type="application/ld+json">` block in the page `<head>`, in addition to (not replacing) the existing Article_Schema, Breadcrumb_Schema, and Dataset_Schema blocks.
2. WHEN an Article_Page is rendered AND `faqItems.length === 0`, THE Article_Layout SHALL NOT emit any FAQPage_Schema block.
3. THE FAQPage_Schema block SHALL declare `"@context": "https://schema.org"` and `"@type": "FAQPage"`.
4. THE FAQPage_Schema field `mainEntity` SHALL be an array of `Question` objects, one per `FAQ_Item`, in the same order as returned by `getArticleData().faqItems`.
5. EACH `Question` object in `mainEntity` SHALL have `"@type": "Question"`, a `name` field equal to the FAQ_Item.question string trimmed, and an `acceptedAnswer` field which is an `Answer` object with `"@type": "Answer"` and `text` equal to the FAQ_Item.answer string trimmed.
6. WHERE a FAQ_Item has an empty or whitespace-only question string, THE Article_Layout SHALL skip emitting that Question entry in `mainEntity`. WHERE all FAQ_Items have empty questions, the FAQPage_Schema block SHALL NOT be emitted at all (treat as faqItems.length === 0).
7. WHERE a FAQ_Item has an empty or whitespace-only answer string, THE Article_Layout SHALL skip emitting that Question entry in `mainEntity` (a Question without an acceptedAnswer is invalid per Schema.org).
8. THE FAQPage_Schema block SHALL appear in `<head>` AFTER the existing three blocks, in the order: Article → BreadcrumbList → Dataset → FAQPage.
9. THE FAQPage_Schema block SHALL NOT modify, reorder, or replace the existing Article_Schema, Breadcrumb_Schema, or Dataset_Schema blocks.
10. THE FAQPage_Schema block SHALL produce zero errors when validated by both arms of the Schema_Validator (Google Rich Results Test and Schema.org validator) for the test article (Salesforce, 3 FAQ items already populated by the backend).
11. THE FAQPage_Schema block SHALL be deterministic with respect to the WordPress source data: two consecutive Builds against the same WordPress state SHALL produce byte-identical FAQPage JSON for the same article.

### Requirement 3: Render visible FAQ accordion section on every article page that has FAQ items

**User Story:** As a reader on an article page, I want to see the FAQ as a visible accordion section in the article body, so I can scan questions, expand the ones I care about, and benefit from the same content that powers the SERP rich result.

#### Acceptance Criteria

1. WHEN an Article_Page is rendered AND `faqItems.length >= 1`, THE Article_Layout SHALL render exactly one FAQ_Section instance per page, between Sources (or KeyTakeaways if Sources is absent) and Related_Articles.
2. WHEN an Article_Page is rendered AND `faqItems.length === 0`, THE Article_Layout SHALL NOT render any FAQ_Section markup (no heading, no placeholder, no empty container).
3. THE FAQ_Section SHALL render its container with a visible heading whose text is exactly `Frequently Asked Questions` and whose semantic level is `<h2>`.
4. THE FAQ_Section SHALL render each FAQ_Item as a native HTML5 `<details><summary>{question}</summary><div>{answer}</div></details>` element so progressive disclosure works without any client-side JavaScript framework.
5. THE FAQ_Section SHALL NOT introduce a runtime client-side JavaScript framework (React, Vue, Preact, Solid, or Svelte) into the production bundle.
6. THE FAQ_Section heading SHALL meet WCAG_AA contrast against the page background (≥ 4.5:1 against `--color-bg`) and SHALL inherit the existing `.font-section-heading` styling used by the Related Articles heading and other in-article section headings, so visual consistency is maintained.
7. THE FAQ_Section SHALL preserve the answer text's whitespace-collapsed plain-text form (the answer is not interpreted as HTML in this phase). WHERE the answer string contains literal HTML tags from the WP backend (legacy editor content), THE Article_Layout SHALL strip them via the existing `cleanExcerpt`-style utility before rendering, OR pass the answer through Astro's default HTML-escaping.
8. THE FAQ_Section question and answer text SHALL match byte-for-byte the values emitted in the FAQPage_Schema block, after both go through the same trimming/skipping rules from Requirement 2.6 and 2.7.
9. THE FAQ_Section SHALL be located inside the existing `<article data-pagefind-body>` wrapper so the FAQ content becomes searchable via Pagefind alongside the rest of the article body.
10. THE FAQ_Section `<summary>` element SHALL be keyboard-focusable (default browser behavior, no overrides) and SHALL display a visible focus ring meeting WCAG_AA, leveraging the existing global focus-ring style.

### Requirement 4: Phase 1 + 2.1 + 2.3 verification suite preservation

**User Story:** As a maintainer who relies on the prior verification harness as the merge gate, I want every existing suite to remain green and every existing budget to remain intact, so Phase 2.2 ships without silently degrading any quality dimension prior phases fenced.

#### Acceptance Criteria

1. WHEN the Phase 2.2 branch is merged to `main`, every prior suite SHALL be green: 76/76 unit tests, 31/31 animations, 17/17 a11y, 7/7 bundle, 72/72 verify-related, and the new Phase 2.3 verify-phase23-internal-links suite (5/5).
2. WHEN `npm run test:phase1` is executed on the Phase 2.2 branch, the runner SHALL exit 0 AND every existing test SHALL pass alongside any new tests Phase 2.2 adds (target: ≥ 84 total — 76 prior + ≥ 8 new for FAQ helper).
3. WHEN the homepage and a representative Article_Page are audited with Lighthouse on the post-phase deployment, THE Performance score for each page on each profile SHALL NOT regress by more than 5 points compared to the same page and same profile in the Pre_Phase_2_2_Baseline.
4. WHEN the homepage and a representative Article_Page are audited with Lighthouse on the post-phase deployment, THE Accessibility score for each page on each profile SHALL be greater than or equal to the same baseline measurement in Pre_Phase_2_2_Baseline (which is currently 96 home-desktop, 100 home-mobile, 100 article-desktop, 100 article-mobile after the D7+D3 fixes).
5. THE production homepage gzipped first-party JavaScript payload growth attributable to Phase 2.2 SHALL NOT exceed 2 KB compared to the Pre_Phase_2_2_Baseline JS payload size (homepage is unaffected by this phase, so the expected delta is +0 B).
6. THE production Article_Page gzipped first-party JavaScript payload growth attributable to Phase 2.2 SHALL NOT exceed 5 KB compared to the Pre_Phase_2_2_Baseline JS payload size. The expected delta is the FAQ block JSON-LD + the FAQ accordion HTML, which together should be well under 2 KB gz per article.
7. THE Pagefind_Index page count emitted by the Build SHALL be greater than or equal to the count recorded in the Pre_Phase_2_2_Baseline.
8. THE Phase 2.2 changelog SHALL list the resolved Lighthouse score deltas, the resolved JS payload delta, the resolved Pagefind_Index page-count delta, and the green/red status of each prior verification suite member, so criteria 1 through 7 are auditable from the changelog alone.

### Requirement 5: Build, deployment, and compatibility guarantees

**User Story:** As an operator deploying to Cloudflare Pages, I want Phase 2.2 to ship without breaking the static build, the Pagefind index, the existing structured data, the analytics or consent integrations, the third-party origin allowlist, or the WP backend, so production stays stable through the rollout.

#### Acceptance Criteria

1. WHEN `npm run build` is executed on the Phase 2.2 branch, THE Build SHALL exit with status 0 within 600 seconds wall-clock and SHALL emit no error-level messages on stderr.
2. WHEN `npm run build` is executed on the Phase 2.2 branch, THE Build SHALL produce a Pagefind_Index at `dist/pagefind/` containing at least the same number of indexed pages as recorded in the Pre_Phase_2_2_Baseline.
3. THE Build pipeline (`prebuild` font copy step → `astro build` → `pagefind --site dist`) SHALL be unchanged by this phase; the `package.json` `scripts.build` and `scripts.prebuild` entries SHALL remain byte-identical.
4. THE Site SHALL continue to load the GA4 script tag and the Google Consent Mode v2 inline default-state script in `BaseLayout.astro` byte-identical to the corresponding lines captured in the Pre_Phase_2_2_Baseline.
5. THE Site SHALL continue to emit the Schema.org `Organization` JSON-LD on every page and the `WebSite` JSON-LD on the homepage with the same schema fields and values as captured in the Pre_Phase_2_2_Baseline.
6. THE Site SHALL continue to emit Article_Schema, Breadcrumb_Schema, and Dataset_Schema on every Article_Page with the same schema fields and field values as captured in the Pre_Phase_2_2_Baseline; Phase 2.2 SHALL only add FAQPage_Schema as a fourth sibling JSON-LD block per Requirement 2.
7. THE Site SHALL continue to emit the same canonical URL, OpenGraph, and Twitter card meta tags on every page as captured in the Pre_Phase_2_2_Baseline.
8. THE Site SHALL NOT introduce a new runtime client-side JavaScript framework dependency in `package.json` `dependencies` or `devDependencies` as part of this phase.
9. THE Site SHALL ONLY add the additive `faq { faq { question answer } }` block to `ARTICLE_PAGE_QUERY`. The Site SHALL NOT modify the WPGraphQL schema, the ACF Site Config schema, the ACF Article schema, or any other GraphQL query selection set in `src/lib/wp-api.ts` as part of this phase.
10. THE Site SHALL list `sangaypopo@gmail.com` as the single contact email anywhere a contact email is shown to users; no other email address SHALL be introduced by this phase.
11. THE Site SHALL serve any new asset added to the repository exclusively from the local `/public` directory or from `fonts.googleapis.com` / `fonts.gstatic.com`; THE Site SHALL NOT introduce any new third-party origin in `<link>`, `<script>`, `<img>`, or `url(...)` references as part of this phase.
12. THE Site sitemap structure (number of routes, route patterns, and URL canonicalization rules) SHALL remain unchanged by this phase.
13. THE Site SHALL continue to render with `<html lang="en">` on every page and SHALL continue to apply the existing `cleanExcerpt` sanitation to WordPress excerpts; Phase 2.2 SHALL NOT change the `cleanExcerpt` helper or the `lang` attribute as part of this phase.
14. THE Site SHALL gracefully handle the case where the `faq-field-group.php` mu-plugin is missing or returns an unexpected GraphQL shape (e.g. `faq` field is absent from the response): in this case `getArticleData()` SHALL still succeed with `faqItems: []` and the article SHALL render normally without FAQ content.
