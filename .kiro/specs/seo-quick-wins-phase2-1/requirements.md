# Requirements Document

## Introduction

This is **Phase 2.1 — SEO Quick Wins** for SaaSStatsHub (https://saasstatshub.com). The phase delivers three coordinated, frontend-only work streams on top of the Phase 1 — Visual System Uplift baseline (shipped 2026-05-17): (①) a Related Articles module rendered inside every article page, with a cross-category fill-in strategy when the same-category pool is thin; (②) a visual breadcrumb that mirrors the existing 3-tier `BreadcrumbList` JSON-LD and adds a Lucide category icon to the category step; (③) a Schema.org `Dataset` JSON-LD block injected into every article page in addition to (not replacing) the existing `Article` and `BreadcrumbList` JSON-LD blocks. The phase is 100% frontend, makes zero changes to the WPGraphQL schema, the ACF schema, or any existing GraphQL query selection set, and must preserve every Phase 1 verification suite green and every Phase 1 regression budget intact.

Out of scope for this phase (explicitly deferred): FAQ Schema (requires backend ACF `faq` Repeater — Phase 2.2), internal anchor-text tooling (Phase 2.3), root-cause fix for `articleMeta.primaryCategory` returning `null` (Phase 2.2-D3, backend mu-plugin), removal of the deprecated `articleMeta.dataSource` field (Phase 2.2-D4, backend ACF), and any new client-side JavaScript framework.

## Glossary

- **Site**: The static site rendered from this Astro project and deployed to Cloudflare Pages at https://saasstatshub.com. Used as the system name when no narrower component applies.
- **Build**: The `npm run build` pipeline (`prebuild` font copy step → `astro build` → `pagefind --site dist`). A Build is "successful" when it exits 0, generates the static HTML output, and produces a Pagefind_Index in `dist/pagefind/`.
- **Article_Page**: Any page rendered by `src/pages/[category]/[slug].astro` via the `ArticleLayout` template, served at the URL pattern `/{categorySlug}/{slug}/`.
- **Article_Layout**: The layout component at `src/layouts/ArticleLayout.astro` that emits the article-page DOM, structured-data blocks, and surrounding chrome.
- **Related_Articles_Module**: The new UI block introduced in this phase that renders up to four related-article cards on every Article_Page.
- **Article_Card**: The existing component at `src/components/ArticleCard.astro` that renders a single article preview tile (cover image, category tag, title, excerpt, date, read time). Reused as-is by the Related_Articles_Module.
- **Same_Category_Pool**: The list of `ArticleCard`-shaped entries already populated in `getArticleData()` at `src/lib/wp-api.ts` from `categories.nodes[].posts.nodes`, excluding the current article, capped at 4 by the existing `slice(0, 4)` line at `wp-api.ts:570`.
- **Cross_Category_Pool**: A list of recent published articles drawn from categories other than the current article's primary category, sourced from the existing `wp-api.ts` GraphQL queries (no new query, no new selection-set fields). Used only to top-up the Related_Articles_Module when the Same_Category_Pool yields fewer than 3 entries.
- **Breadcrumb_Component**: The existing component at `src/components/Breadcrumb.astro` that renders an ordered list of crumb links separated by `chevron-right` Lucide icons.
- **Breadcrumb_Trail**: The ordered triple `[Home, Category, Article]` rendered by Breadcrumb_Component on every Article_Page, mirroring the three positions in the `BreadcrumbList` JSON-LD already emitted by Article_Layout.
- **Category_Meta**: The 8-entry array `CATEGORIES` exported from `src/lib/constants.ts`, including each category's `iconName` (Lucide kebab-case), color tokens, and gradient definition. The `metaFor(name, slug)` helper resolves a `CategoryMeta` from a category name or slug.
- **Icon_Component**: The existing component at `src/components/Icon.astro` that renders a Lucide icon as inline SVG at build time, failing the Build on an unknown icon name (Phase 1 Req 4.14).
- **Article_Schema**: The existing `Schema.org Article` JSON-LD block emitted in Article_Layout `<head>` (the `articleSchema` object at `ArticleLayout.astro:64-101`). Unchanged by this phase.
- **Breadcrumb_Schema**: The existing `Schema.org BreadcrumbList` JSON-LD block emitted in Article_Layout `<head>` (the `breadcrumbSchema` object at `ArticleLayout.astro:104-114`). Unchanged by this phase.
- **Dataset_Schema**: A new third `<script type="application/ld+json">` block introduced by this phase, emitted in Article_Layout `<head>` as a sibling to Article_Schema and Breadcrumb_Schema. Conforms to https://schema.org/Dataset.
- **Dataset_License_URL**: The literal string `https://creativecommons.org/licenses/by-nc/4.0/`, locked in spec phase, used as the value of the Dataset_Schema `license` field.
- **Quick_Overview_Item**: A single `{ statLabel, statValue }` entry from the article's `quickOverview` array as exposed by `getArticleData()`. Used as the source for Dataset_Schema `variableMeasured` entries.
- **Focus_Keywords_String**: The raw `articleMeta.focusKeywords` string returned by the WP GraphQL response, a comma-separated list of keyword phrases (existing field, unchanged).
- **Clean_Excerpt**: The output of the existing `cleanExcerpt()` helper in `src/lib/wp-api.ts` (post-`080e592` hotfix), which strips read-more anchors, remaining HTML tags, and entity-decodes the text. Used as the source for Dataset_Schema `description`.
- **Pre_Phase_2_1_Baseline**: A snapshot captured immediately before the Phase 2.1 branch is merged, comprising (a) Lighthouse Performance and Accessibility scores for the homepage and a representative Article_Page on both desktop and mobile profiles, (b) the count of pages in the Pagefind_Index, (c) the homepage gzipped first-party JS payload size, (d) the result of each verification suite enumerated in Requirement 4 criterion 1, and (e) the byte-level contents of the Article_Page `<head>` block. The snapshot is stored in the Phase 2.1 changelog.
- **Phase_1_Baseline**: The corresponding snapshot captured for Phase 1 and recorded in `.kiro/specs/visual-system-uplift-phase1/changelog.md`. Phase_1_Baseline is the floor referenced by the Phase 1 regression budgets that this phase must continue to honor.
- **Unit_Test_Suite**: The 51 unit-test invocations executed by `npm run test:phase1`. The suite is "green" when every test passes and the runner exits 0.
- **Animation_Verify_Suite**: The 31 animation-hook and keyframe assertions executed by `node baseline/verify-animations.mjs`. The suite is "green" when every assertion passes and the script exits 0.
- **A11y_Verify_Suite**: The 16 accessibility and contrast assertions executed by `node baseline/verify-a11y.mjs`. The suite is "green" when every assertion passes and the script exits 0.
- **Bundle_Verify_Suite**: The 7 bundle-policy assertions executed by `node baseline/verify-bundle.mjs`. The suite is "green" when every assertion passes and the script exits 0.
- **Lighthouse_Regression_Suite**: The 12 Lighthouse regression assertions retained from Phase 1 (Performance score floor, Accessibility score floor, mobile-home LCP delta cap, etc.) executed against the Pre_Phase_2_1_Baseline.
- **Phase_1_Verification_Suite**: The aggregate of Unit_Test_Suite, Animation_Verify_Suite, A11y_Verify_Suite, Bundle_Verify_Suite, and Lighthouse_Regression_Suite.
- **Pagefind_Index**: The static search index emitted into `dist/pagefind/` by the `pagefind --site dist` step of the Build.
- **Schema_Validator**: Either of two third-party validators used as the verification reference: Google Rich Results Test (https://search.google.com/test/rich-results) and the Schema.org validator (https://validator.schema.org/). A JSON-LD block is "valid" when both validators report zero errors against it.
- **WCAG_AA**: WCAG 2.1 Level AA contrast ratios — at least 4.5:1 for body text below 18pt regular / 14pt bold, and at least 3:1 for large text and non-text UI components.

## Requirements

### Requirement 1: Related Articles Module on Every Article Page

**User Story:** As a reader who finished an article, I want to see three to four genuinely related articles at the bottom of the page, so that I can keep exploring the site without dropping out to a search engine.

#### Acceptance Criteria

1. WHEN an Article_Page is rendered, THE Article_Layout SHALL render exactly one Related_Articles_Module instance per page, between the Sources block and the bottom Newsletter block, AND THE Related_Articles_Module SHALL be the only render site for related-article tiles on the Article_Page.
2. THE Related_Articles_Module SHALL render each related article using the existing Article_Card component without modifying the Article_Card component's props, internal markup, or styling.
3. WHEN the Same_Category_Pool returned by `getArticleData()` contains 3 or 4 entries, THE Related_Articles_Module SHALL render exactly those 3 or 4 entries and SHALL NOT pull any entry from the Cross_Category_Pool.
4. WHEN the Same_Category_Pool returned by `getArticleData()` contains exactly 2 entries, THE Related_Articles_Module SHALL render those 2 same-category entries followed by 1 or 2 entries from the Cross_Category_Pool, for a total tile count between 3 and 4 inclusive.
5. WHEN the Same_Category_Pool returned by `getArticleData()` contains exactly 1 entry, THE Related_Articles_Module SHALL render that 1 same-category entry followed by 2 entries from the Cross_Category_Pool, for a total tile count of exactly 3.
6. WHEN the Same_Category_Pool returned by `getArticleData()` contains exactly 0 entries AND the Cross_Category_Pool contains at least 3 entries, THE Related_Articles_Module SHALL render exactly 3 entries drawn from the Cross_Category_Pool.
7. IF, after applying criteria 3 through 6, the resolved tile count is less than 3, THEN THE Article_Layout SHALL NOT render the Related_Articles_Module at all (no heading, no placeholder, no empty container) for that Article_Page.
8. THE Related_Articles_Module SHALL preserve same-category-first ordering: any same-category entries SHALL precede any cross-category entries within the rendered grid, and the order returned by `getArticleData()` SHALL be preserved within each origin group.
9. THE Cross_Category_Pool SHALL be sourced exclusively from data already retrievable via the existing GraphQL queries in `src/lib/wp-api.ts` (no new query, no new selection-set field, no new variable on an existing query).
10. THE Cross_Category_Pool SHALL exclude the current article, all entries already present in the Same_Category_Pool (matched by article id), and any draft or unpublished post.
11. WHERE the Cross_Category_Pool is used to top-up tiles, THE Related_Articles_Module SHALL prefer the most recently published cross-category articles, ordered by publish date descending, with article id used as a deterministic tiebreaker so that two consecutive Builds against the same WordPress state produce byte-identical Related_Articles_Module HTML.
12. THE Related_Articles_Module SHALL render its container with a visible heading whose text is exactly `Related Articles` and whose semantic level is `<h2>`.
13. THE Related_Articles_Module SHALL render the tiles in a responsive grid: at viewport widths < 640px the grid SHALL be a single column; at 640px ≤ viewport < 1024px the grid SHALL be 2 columns; at viewport ≥ 1024px the grid SHALL be 3 or 4 columns matching the rendered tile count from criteria 3 through 6.
14. THE Related_Articles_Module SHALL render each tile as a link to the corresponding article URL `/{categorySlug}/{slug}/`, identical in shape to existing Article_Card link targets.
15. THE Related_Articles_Module SHALL NOT introduce a runtime client-side JavaScript framework (React, Vue, Preact, Solid, or Svelte) into the production bundle.

### Requirement 2: Breadcrumb Visual Consistency and Lucide Category Icon

**User Story:** As a visitor scanning an article page, I want the visible breadcrumb to mirror the structured-data breadcrumb and clearly mark the category step with its category icon, so that the navigation hierarchy reads at a glance and matches what search engines see.

#### Acceptance Criteria

1. WHEN an Article_Page is rendered, THE Breadcrumb_Component SHALL render a Breadcrumb_Trail of exactly three crumbs in the order `[Home, Category, Article]`.
2. THE rendered Breadcrumb_Trail SHALL be byte-consistent in label order with the `BreadcrumbList` JSON-LD block already emitted by Article_Layout: position 1 → `Home`, position 2 → the article's category name, position 3 → the article title.
3. THE first crumb SHALL render the literal label `Home` and SHALL be a clickable `<a>` element whose `href` resolves to the site root `/`.
4. THE second crumb SHALL render the article's category name as its label and SHALL be a clickable `<a>` element whose `href` resolves to `/categories/{categorySlug}/`.
5. THE second crumb SHALL render a Lucide icon resolved from `metaFor(category, categorySlug).iconName` immediately preceding the category-name text, separated from the text by a horizontal gap between 4px and 8px inclusive.
6. THE Lucide icon on the second crumb SHALL be rendered via the existing Icon_Component, AND its SVG element SHALL carry `aria-hidden="true"` so the icon is treated as decorative and the accessible name remains the category text.
7. THE third crumb SHALL render the article title as its label and SHALL NOT be a clickable link (rendered as plain text matching today's behavior).
8. THE Breadcrumb_Component SHALL render exactly one `chevron-right` separator between adjacent crumbs and SHALL NOT render a leading or trailing separator.
9. WHEN the rendered Breadcrumb_Trail's intrinsic width exceeds the width of its container at any viewport width covered by the Article_Page responsive breakpoints, THE Breadcrumb_Component SHALL wrap onto additional lines without horizontal page overflow and without splitting any single crumb's icon and label across two lines.
10. THE Breadcrumb_Component SHALL set `aria-label="Breadcrumb"` on its `<nav>` root, preserving the existing accessible-region semantics.
11. THE second-crumb Lucide icon stroke color SHALL achieve a contrast ratio of at least 3:1 against the page background under the Phase 1 Dark_Theme, satisfying WCAG_AA non-text contrast.
12. WHEN the article's category cannot be resolved by `metaFor()` to a known Category_Meta entry, THE Breadcrumb_Component SHALL render the second crumb using the fallback meta defined in `src/lib/constants.ts` (icon name `bar-chart-3`, label "Uncategorized" or the raw category name when present) AND THE Build SHALL NOT fail solely because the category did not match.
13. WHEN `npm run build` is executed on the Phase 2.1 branch, the rendered Article_Page HTML SHALL contain exactly one inline `<svg>` element for the second-crumb Lucide icon for each Article_Page, matched by the icon name resolved from Category_Meta.

### Requirement 3: Schema.org Dataset JSON-LD on Every Article Page

**User Story:** As an SEO operator targeting Google Dataset Search inclusion, I want every article to emit a valid Schema.org Dataset JSON-LD block alongside the existing Article and BreadcrumbList blocks, so that articles become eligible for Dataset Search results without losing the existing rich-result eligibility.

#### Acceptance Criteria

1. WHEN an Article_Page is rendered, THE Article_Layout SHALL emit exactly one Dataset_Schema `<script type="application/ld+json">` block in the page `<head>`, in addition to (not replacing) the existing Article_Schema and Breadcrumb_Schema blocks.
2. THE Dataset_Schema block SHALL declare `"@context": "https://schema.org"` and `"@type": "Dataset"`.
3. THE Dataset_Schema field `name` SHALL be set to the article's title string exactly as supplied to Article_Layout via the `title` prop.
4. THE Dataset_Schema field `description` SHALL be set to the Clean_Excerpt of the article (the value already passed to Article_Layout via the `description` prop, which is itself the output of `cleanExcerpt()` in `getArticleData()`).
5. IF the Clean_Excerpt is an empty string, THEN THE Dataset_Schema field `description` SHALL fall back to the article's title string so that the field is never emitted as an empty value.
6. THE Dataset_Schema field `keywords` SHALL be derived from the Focus_Keywords_String by splitting on commas, trimming whitespace from each segment, dropping empty segments, and emitting the result either as a JSON array of strings or as a single comma-joined string per Schema.org Dataset spec.
7. WHERE the Focus_Keywords_String is empty or absent on an article, THE Dataset_Schema field `keywords` SHALL be omitted from the emitted JSON-LD object (the field SHALL NOT appear with a null, empty-string, or empty-array value).
8. THE Dataset_Schema field `creator` SHALL be set to a Schema.org `Organization` object whose `name` is `SaaSStatsHub` and whose `url` is the site origin (matching the publisher used by Article_Schema).
9. THE Dataset_Schema field `license` SHALL be set to the literal Dataset_License_URL `https://creativecommons.org/licenses/by-nc/4.0/`.
10. THE Dataset_Schema field `distribution` SHALL be set to a Schema.org `DataDownload` object with `encodingFormat: "text/html"` and `contentUrl` equal to the article's canonical URL.
11. WHERE the article has a non-empty `articleMeta.lastUpdated` value, THE Dataset_Schema field `temporalCoverage` SHALL be set to that value; WHERE `articleMeta.lastUpdated` is empty or absent, THE Dataset_Schema field `temporalCoverage` SHALL be omitted from the emitted JSON-LD object.
12. WHERE the article has at least one Quick_Overview_Item, THE Dataset_Schema field `variableMeasured` SHALL be set to an array of Schema.org `PropertyValue` objects, one per Quick_Overview_Item, with `name` set to the item's `statLabel` and `description` set to the item's `statValue`.
13. WHERE the article has zero Quick_Overview_Items, THE Dataset_Schema field `variableMeasured` SHALL be omitted from the emitted JSON-LD object.
14. THE Dataset_Schema block SHALL NOT modify, reorder, or replace the existing Article_Schema or Breadcrumb_Schema blocks; the Article_Page `<head>` SHALL contain three structured-data blocks emitted in this order: Article_Schema, Breadcrumb_Schema, Dataset_Schema.
15. THE Dataset_Schema block SHALL produce zero errors when validated by both arms of the Schema_Validator (Google Rich Results Test and Schema.org validator) for at least one representative article from each of the 8 production categories.
16. THE Dataset_Schema block SHALL be deterministic with respect to the WordPress source data: two consecutive Builds against the same WordPress state SHALL produce byte-identical Dataset_Schema JSON for the same article.

### Requirement 4: Phase 1 Verification Suite Preservation

**User Story:** As a maintainer who relies on the Phase 1 regression harness as the merge gate, I want every Phase 1 verification suite to remain green and every Phase 1 regression budget to remain intact, so that Phase 2.1 ships without silently degrading any quality dimension Phase 1 fenced.

#### Acceptance Criteria

1. WHEN the Phase 2.1 branch is merged to `main`, every suite in the Phase_1_Verification_Suite SHALL be green: Unit_Test_Suite (51 tests), Animation_Verify_Suite (31 assertions), A11y_Verify_Suite (16 assertions), Bundle_Verify_Suite (7 assertions), and Lighthouse_Regression_Suite (12 assertions).
2. WHEN `npm run test:phase1` is executed on the Phase 2.1 branch, the runner SHALL exit 0 AND every test in Unit_Test_Suite SHALL pass.
3. WHEN `node baseline/verify-animations.mjs` is executed on the Phase 2.1 branch, the script SHALL exit 0 AND every assertion in Animation_Verify_Suite SHALL pass.
4. WHEN `node baseline/verify-a11y.mjs` is executed on the Phase 2.1 branch, the script SHALL exit 0 AND every assertion in A11y_Verify_Suite SHALL pass.
5. WHEN `node baseline/verify-bundle.mjs` is executed on the Phase 2.1 branch, the script SHALL exit 0 AND every assertion in Bundle_Verify_Suite SHALL pass.
6. THE Site SHALL preserve the Phase 1 named animation hooks named in Phase 1 Requirement 1 criterion 8 (`gradient-hero`, `.type-caret`, `.hero-stat-card::after`, the spotlight pointer-follow on `.article-card`, `.category-card`, `.bg-spotlight-dark` driven by `--mx`/`--my`, `float` keyframes on Hero floating mini-cards, `border-flow` keyframes on `.tech-border::before`, and `#reading-progress`) byte-identical in selector and keyframe identity.
7. THE Site SHALL preserve the Phase 1 contrast tokens at the values recorded in `.kiro/specs/visual-system-uplift-phase1/changelog.md` so that A11y_Verify_Suite continues to pass; Phase 2.1 SHALL NOT redefine any token in Theme_Token_Layer.
8. WHEN the homepage and a representative Article_Page are audited with Lighthouse on the post-phase deployment, THE Performance score for each page on each profile (desktop, mobile) SHALL NOT regress by more than 5 points compared to the same page and same profile in the Pre_Phase_2_1_Baseline, AND the same Performance score SHALL NOT regress by more than 5 points compared to the same page and same profile in the Phase_1_Baseline.
9. WHEN the homepage and a representative Article_Page are audited with Lighthouse on the post-phase deployment, THE Accessibility score for each page on each profile (desktop, mobile) SHALL be greater than or equal to the same baseline measurement in both the Pre_Phase_2_1_Baseline and the Phase_1_Baseline.
10. WHEN the homepage is measured by Lighthouse on a slow-4G mobile profile against the production Cloudflare Pages deployment, THE LCP SHALL NOT regress by more than 200ms compared to the LCP recorded in the Phase_1_Baseline.
11. THE production homepage gzipped first-party JavaScript payload growth attributable to Phase 2.1 SHALL NOT exceed 5 KB compared to the Pre_Phase_2_1_Baseline JS payload size.
12. THE production Article_Page gzipped first-party JavaScript payload growth attributable to Phase 2.1 SHALL NOT exceed 5 KB compared to the Pre_Phase_2_1_Baseline JS payload size.
13. THE Pagefind_Index page count emitted by the Build SHALL be greater than or equal to the count recorded in the Pre_Phase_2_1_Baseline; IF the Build produces a Pagefind_Index with fewer indexed pages, THEN the Phase 2.1 branch SHALL NOT be merged to `main` until the regression is resolved.
14. THE Phase 2.1 changelog SHALL list the resolved Lighthouse score deltas, the resolved JS payload delta, the resolved Pagefind_Index page-count delta, and the green/red status of each Phase_1_Verification_Suite member, so that criteria 1 through 13 are auditable from the changelog alone.

### Requirement 5: Build, Deployment, and Compatibility Guarantees

**User Story:** As an operator deploying to Cloudflare Pages, I want Phase 2.1 to ship without breaking the static build, the Pagefind index, the existing structured data, the analytics or consent integrations, or the third-party origin allowlist, so that production stays stable through the rollout and inherits every Phase 1 invariant.

#### Acceptance Criteria

1. WHEN `npm run build` is executed on the Phase 2.1 branch, THE Build SHALL exit with status 0 within 600 seconds wall-clock and SHALL emit no error-level messages on stderr.
2. WHEN `npm run build` is executed on the Phase 2.1 branch, THE Build SHALL produce a Pagefind_Index at `dist/pagefind/` containing at least the same number of indexed pages as recorded in the Pre_Phase_2_1_Baseline.
3. THE Build pipeline (`prebuild` font copy step → `astro build` → `pagefind --site dist`) SHALL be unchanged by this phase; the `package.json` `scripts.build` and `scripts.prebuild` entries SHALL remain byte-identical to their Phase_1_Baseline values.
4. THE Site SHALL continue to load the Google Analytics 4 (GA4) script tag and the Google Consent Mode v2 inline default-state script in `BaseLayout.astro` byte-identical to the corresponding lines captured in the Phase_1_Baseline.
5. THE Site SHALL continue to emit the Schema.org `Organization` JSON-LD on every page and the `WebSite` JSON-LD on the homepage with the same schema fields and field values as captured in the Phase_1_Baseline.
6. THE Site SHALL continue to emit Article_Schema and Breadcrumb_Schema on every Article_Page with the same schema fields and field values as captured in the Phase_1_Baseline; Phase 2.1 SHALL only add Dataset_Schema as a third sibling JSON-LD block per Requirement 3.
7. THE Site SHALL continue to emit the same canonical URL, OpenGraph, and Twitter card meta tags on every page as captured in the Phase_1_Baseline.
8. THE Site SHALL NOT introduce a new runtime client-side JavaScript framework dependency (React, Vue, Preact, Solid, or Svelte) in `package.json` `dependencies` or `devDependencies` as part of this phase.
9. THE Site SHALL NOT modify the WPGraphQL schema, the ACF Site Config schema, the ACF Article schema, or any existing GraphQL query selection set in `src/lib/wp-api.ts` as part of this phase. Reuse of existing fields by new client-side helpers (for example a new cross-category fill helper consuming results already returned by the existing queries) is permitted.
10. WHERE a Phase 2.1 change adds a new entry to `package.json` `dependencies` or `devDependencies`, THE Phase 2.1 changelog SHALL list each new entry with its uncompressed install size, AND the production homepage gzipped JS payload growth attributable to those new entries SHALL count toward the 5 KB budget defined in Requirement 4 criterion 11.
11. THE Site SHALL list `sangaypopo@gmail.com` as the single contact email anywhere a contact email is shown to users (visible page text, link `mailto:` targets, OG description text, JSON-LD `contactPoint` if present, and the new Dataset_Schema if a contact field is added in any future iteration); no other email address SHALL be introduced by this phase.
12. THE Site SHALL serve any new asset (icon SVG, font file, schema fixture, related-article fixture) added to the repository exclusively from the local `/public` directory or from `fonts.googleapis.com` / `fonts.gstatic.com`; THE Site SHALL NOT introduce any new third-party origin in `<link>`, `<script>`, `<img>`, or `url(...)` references as part of this phase.
13. THE Site sitemap structure (number of routes, route patterns, and URL canonicalization rules) SHALL remain unchanged by this phase; the production `sitemap-0.xml` SHALL contain at least the same number of URLs as captured in the Phase_1_Baseline.
14. THE Site SHALL continue to use the existing 3-level fallback in `wp-api.ts:resolvePrimaryCategory()` for resolving an article's primary category (ACF taxonomy → first WP category → uncategorized) without modification; Phase 2.1 SHALL NOT introduce a fix for the known `articleMeta.primaryCategory` `null` issue (deferred to Phase 2.2-D3 / backend mu-plugin).
15. THE Site SHALL continue to render with `<html lang="en">` on every page and SHALL continue to apply the existing Clean_Excerpt sanitation to WordPress excerpts; Phase 2.1 SHALL NOT change the Clean_Excerpt helper or the `lang` attribute as part of this phase.
