# Requirements Document

## Introduction

This is **Phase 1 — Visual System Uplift** for SaaSStatsHub (https://saasstatshub.com). The goal is to elevate the front-end perceived quality from "competent SaaS blog" to "professional data terminal" along the lines of Bloomberg Terminal, Stripe Atlas, and Statista Pro, **without** introducing a runtime JavaScript framework, breaking the Astro 6 + Tailwind 4 SSG build, or modifying the WPGraphQL schema.

The phase is scoped to four work streams, each tracked as one or more requirements below:

- **A.1 Dark-First Theme** — switch the site's primary chrome from light to a dark, high-contrast data-terminal palette across every page.
- **A.2 Data Visualization Upgrade** — add sparkline mini-charts to all 8 Hot Stat cards on the homepage and to in-article StatCard components.
- **A.3 Typography Refinement** — introduce Fraunces as a display-serif headline face, retain Inter for body and JetBrains Mono for numerics, and codify a measurable type scale.
- **A.4 Icon System** — replace category emoji and ad-hoc SVGs in primary UI with a single, tree-shaken Lucide icon system; retain emoji only as a decorative-only fallback field.

Out of scope for this phase (explicitly deferred to a future phase): light/dark theme toggle UI, content/IA changes, new homepage sections, backend ACF schema changes, and any work requiring a JS runtime framework.

## Glossary

- **Site**: The static site rendered from this Astro project and deployed to Cloudflare Pages at https://saasstatshub.com. Used as the system name when no narrower component applies.
- **Build**: The `npm run build` pipeline (`astro build && pagefind --site dist`). A Build is "successful" when it exits 0, generates the static HTML output, and produces a Pagefind index in `dist/pagefind/`.
- **Pre_Phase_Baseline**: A snapshot captured immediately before the Phase 1 branch is merged, comprising (a) Lighthouse Performance and Accessibility scores for the homepage and a representative article page on both desktop and mobile profiles, (b) the count of pages in the Pagefind_Index, (c) the byte-level contents of `<head>` blocks named in Requirement 5 criteria 4, 5, 6, and (d) the homepage gzipped JS payload size. The snapshot is stored in the Phase 1 changelog.
- **Theme_Token_Layer**: The `@theme { … }` block in `src/styles/global.css` that exposes design tokens as CSS custom properties consumed by Tailwind 4 utilities and component CSS.
- **Dark_Theme**: The default visual theme introduced in this phase. Applied to `:root` (or `html`) so that no opt-in attribute is required for users.
- **Hero_Stat_Card**: A single card in the 8-card Hot Stats grid on the homepage, rendered by `src/components/sections/HotStatsSection.astro`.
- **Article_Stat_Card**: The in-article `.stat-card` block rendered by `src/components/StatCard.astro`.
- **Sparkline**: A small inline trend chart, rendered as inline SVG without external libraries, embedded inside a Hero_Stat_Card or Article_Stat_Card.
- **Sparkline_Slope**: The normalized linear-regression slope of the Sparkline series after each value is divided by the series mean. Used to classify the line color.
- **Category_Meta**: The 8-entry array exported from `src/lib/constants.ts` as `CATEGORIES`, the single source of truth for category slug, name, color, gradient, and (post-phase) icon name.
- **Icon_System**: The Lucide icon set, consumed via tree-shakable per-icon imports rendered as inline SVG at build time. No runtime icon font and no full-bundle CSS file.
- **Display_Font**: Fraunces (a variable serif font), used for H1, H2, and selected oversized display text.
- **Body_Font**: Inter (existing). Used for paragraph text, UI labels, navigation, and form controls.
- **Mono_Font**: JetBrains Mono (existing). Used for numeric stats, source labels, code, and tabular numerics.
- **Reduced_Motion**: User preference signaled by `prefers-reduced-motion: reduce`. The Site MUST honor this preference by suppressing non-essential animation.
- **WCAG_AA**: WCAG 2.1 Level AA contrast ratios — at least 4.5:1 for body text below 18pt regular / 14pt bold, and at least 3:1 for large text and non-text UI components.
- **LCP**: Largest Contentful Paint, as measured by Lighthouse on a slow-4G mobile profile against the homepage, served from the production Cloudflare Pages deployment.
- **Pagefind_Index**: The static search index emitted into `dist/pagefind/` by the `pagefind --site dist` step of the Build.

## Requirements

### Requirement 1: Dark-First Theme as Site Default

**User Story:** As a returning visitor expecting a professional data-terminal feel, I want the entire site to render in a high-contrast dark theme by default, so that the visual identity matches the data product positioning rather than a generic SaaS blog.

#### Acceptance Criteria

1. THE Site SHALL render every page using a Dark_Theme as its default and only theme.
2. THE Theme_Token_Layer SHALL define the page background such that, when sampled at five evenly distributed points across the body root on the homepage at 1440×900, every sample falls within CIE Lab lightness L\* 8–14 inclusive.
3. THE Theme_Token_Layer SHALL define the primary body text color such that body text against the page background achieves a contrast ratio of at least 7.0:1, verified by a tool reporting WCAG contrast (for example axe-core, Lighthouse, or a deterministic WCAG 2.1 contrast formula applied to the resolved CSS variable values).
4. THE Theme_Token_Layer SHALL define the secondary text color such that secondary text against the page background achieves a contrast ratio of at least 4.5:1, verified the same way as criterion 3.
5. THE Theme_Token_Layer SHALL define a "muted" text color used only for metadata (timestamps, source attributions, breadcrumbs) such that the muted text against the page background achieves a contrast ratio of at least 3.0:1, verified the same way as criterion 3.
6. THE Theme_Token_Layer SHALL expose a finance-style positive color (green) and a finance-style negative color (red) for ticker-style up/down deltas, each achieving a contrast ratio of at least 4.5:1 against the page background.
7. WHEN any page in the following set is rendered — homepage (`/`), category index (`/categories/[slug]/`), article (`/[category]/[slug]/`), search modal (open state), newsletter CTA, cookie consent banner, 404, about, contact, write-for-us, privacy-policy, cookie-policy, terms-of-service, affiliate-disclosure — THE Site SHALL render that page using Dark_Theme background, Dark_Theme text colors, and Dark_Theme component surfaces (cards, tables, blockquotes, code blocks).
8. THE Site SHALL preserve the following named animation hooks unchanged in selector and keyframe identity: the Hero gradient class `gradient-hero`, the typewriter caret on `.type-caret`, the scanline overlay on `.hero-stat-card::after`, the spotlight pointer-follow on `.article-card`, `.category-card`, and `.bg-spotlight-dark` (driven by `--mx`/`--my`), the `float` keyframes on Hero floating mini-cards, the `border-flow` keyframes on `.tech-border::before`, and the reading-progress bar `#reading-progress`. Token refactors SHALL change CSS variable values only, not these selectors or keyframe names.
9. WHERE a user has set Reduced_Motion, THE Site SHALL suppress decorative dark-theme animations (scanline, ticker-blink, grid-pan, border-flow) consistent with the existing `prefers-reduced-motion` rule in `global.css`.
10. IF Build is run after the theme refactor, THEN THE Build SHALL exit with status 0 and the resulting Pagefind_Index SHALL contain at least as many indexed pages as the count recorded in the Pre_Phase_Baseline.
11. THE Site SHALL NOT ship a runtime light/dark theme toggle UI in this phase; tokens MAY be authored in a way that does not preclude a future toggle, but no toggle control SHALL appear in the header, footer, or any page.
12. THE Theme_Token_Layer SHALL retain the existing token names (`--color-bg`, `--color-bg-alt`, `--color-bg-warm`, `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-border-light`, `--color-primary`, `--color-primary-dark`, `--color-primary-light`, `--color-primary-lighter`, `--color-accent`, `--color-accent-light`, `--color-violet`, `--color-violet-light`, `--color-warning`, `--color-danger`) so that components consuming them via `var(...)` continue to work; only the values SHALL change.
13. THE Site SHALL render form controls (newsletter email input, search input shell, contact form fields where present) with input background contrast and border contrast meeting WCAG_AA non-text contrast (3:1) against the surrounding card surface.
14. THE Site SHALL render footer text such that the footer body copy contrast against the footer background meets WCAG_AA (4.5:1) for body and 3:1 for muted/secondary footer text.
15. THE Phase 1 changelog SHALL list, for each Dark_Theme token redefined in `Theme_Token_Layer`, the resolved hex value used in production and the verified contrast ratio against the page background, so that criteria 3, 4, 5, 6, 13, and 14 are auditable from the changelog alone.

### Requirement 2: Hot Stat Card Sparklines

**User Story:** As a data-driven visitor scanning the homepage, I want each of the 8 Hot Stat cards to show a small trend chart alongside its number, so that I can read the trajectory at a glance without reading prose.

#### Acceptance Criteria

1. WHEN the homepage Hot Stats section is rendered, THE Site SHALL render exactly one Sparkline inside each Hero_Stat_Card whose `enabled` flag is `true`, AND THE Site SHALL NOT render a Sparkline for any Hero_Stat_Card whose `enabled` flag is `false`.
2. THE Sparkline SHALL be rendered as inline SVG without any external chart library and without any runtime JavaScript framework.
3. THE Sparkline SHALL be drawn from a frontend-hardcoded series of between 8 and 16 numeric points (inclusive on both bounds, all values finite) stored alongside the card definition in `src/lib/site-config.ts` as a new optional field on the `HotStat` interface.
4. IF a card's hardcoded series fails the validity rule in criterion 3 (length out of bounds, contains non-finite values, or is missing), THEN THE Site SHALL fall back to rendering a deterministic decorative curve generated from the card's `trend` field; the resolution order SHALL be: WPGraphQL `sparklineData` (if present and valid) → hardcoded series (if present and valid) → decorative curve from `trend`.
5. WHERE no `trend` field is provided to a card relying on the decorative curve fallback, THE Site SHALL default the curve to `'flat'`.
6. THE Sparkline SHALL render at a minimum size of 100px wide by 28px tall and SHALL scale fluidly up to 100% of its container's content width while preserving aspect ratio.
7. THE Sparkline SHALL render its line stroke in the finance-style positive color when Sparkline_Slope > +0.01, the finance-style negative color when Sparkline_Slope < −0.01, and a neutral accent color when Sparkline_Slope is within ±0.01 inclusive (or when the series mean is zero, treated as the neutral case).
8. THE Sparkline SHALL render the final point as a filled circle with radius between 2px and 4px inclusive, using the same color as the line stroke.
9. THE Sparkline SHALL render an underlying gradient fill below the line at an alpha between 0.10 and 0.20 inclusive of the line stroke color, with the fill bottom edge clamped to the SVG bottom edge so it never overlaps the card's number element.
10. THE Site SHALL NOT mutate the WPGraphQL schema, the ACF Site Config schema, or any existing GraphQL query as a consequence of adding sparklines.
11. IF the WPGraphQL response in the future includes an optional `sparklineData` array on a HotStat that satisfies criterion 3's validity rule, THEN THE Site SHALL prefer the response data over the hardcoded series; if the response field is absent, empty, or invalid, THE Site SHALL fall back to the hardcoded series per criterion 4.
12. WHEN an Article_Stat_Card is rendered with a valid `series` prop or a `trend` prop, THE Site SHALL render an inline Sparkline matching criteria 2, 6, 7, 8, 9, 13, and 14.
13. WHERE neither a `trend` prop nor a `series` prop is provided to an Article_Stat_Card, THE Site SHALL render the card without a Sparkline (preserving today's appearance for existing usages).
14. THE Sparkline SHALL include a non-empty `aria-label` and SHALL set `role="img"` on the SVG element. The label SHALL follow the format `"Trend: {direction} {percent}% over period"` where direction is `up`, `down`, or `flat` and percent is the absolute change from first to last data point rounded to one decimal; for decorative curves rendered from `trend` only, the label SHALL be `"Trend: {direction}"` without a percent value.
15. WHERE a user has set Reduced_Motion, THE Site SHALL render the Sparkline as a static SVG with no draw-in animation and no CSS transitions on the path or marker.
16. WHERE Reduced_Motion is NOT set, THE Site MAY animate the line draw using the existing `line-draw` keyframes, completing within 800ms.
17. THE Site SHALL preserve the existing count-up animation on the Hero_Stat_Card number; the Sparkline SHALL NOT replace, displace, or visually overlap the number element at any viewport width covered by the homepage responsive breakpoints.
18. THE Sparkline rendering code (any new `.astro`, `.ts`, or `.js` modules introduced specifically to render Sparklines) SHALL add no more than 3 KB of gzipped JavaScript to the homepage's production build output.

### Requirement 3: Display Typography with Fraunces

**User Story:** As a visitor forming a first impression, I want the largest headlines on the site to use a distinctive editorial display serif, so that the brand reads as an authoritative publication rather than another SaaS marketing page.

#### Acceptance Criteria

1. THE Theme_Token_Layer SHALL declare three named font roles: Display_Font (Fraunces), Body_Font (Inter), and Mono_Font (JetBrains Mono).
2. THE Site SHALL load Fraunces as a variable font with weight axis covering at least 400–800 and the optical-size axis (`opsz`).
3. THE Site SHALL apply Display_Font to the Hero H1, the article-page H1, and section H2 headings used as page section titles in the homepage and category-index pages.
4. THE Site SHALL apply Body_Font to all paragraph text, UI labels, navigation items, button labels, form inputs, and breadcrumbs.
5. THE Site SHALL apply Mono_Font to all numeric stat values, source attributions in Hero_Stat_Card and Article_Stat_Card, code snippets in article content, and tabular numerics in Quick Overview tables.
6. THE Theme_Token_Layer SHALL define an explicit type scale with at least the following six steps and SHALL assign them to specific roles, with the desktop floors below applying at viewport widths ≥ 1024px and the mobile floors applying at viewport widths < 768px:
   - display-xl (Hero H1): ≥ 56px desktop, ≥ 36px mobile
   - display-lg (article H1): ≥ 40px desktop, ≥ 28px mobile
   - heading-lg (H2): ≥ 28px desktop, ≥ 22px mobile
   - heading-md (H3): ≥ 20px desktop, ≥ 18px mobile
   - body (paragraph): 16–17px on every viewport
   - small (metadata): 12–13px on every viewport
7. THE Site SHALL render Hero H1 with a line-height between 1.00 and 1.10 inclusive and a letter-spacing between -0.02em and -0.04em inclusive to match editorial display conventions.
8. THE Site SHALL render body paragraph text with a line-height between 1.65 and 1.85 inclusive.
9. THE Site SHALL load Display_Font using `font-display: swap` so that the page is never blocked on Display_Font for first paint.
10. THE Site SHALL declare a fallback font stack for Display_Font ending in `Georgia, 'Times New Roman', serif` so that headings remain readable if Display_Font fails to load.
11. WHEN the homepage is measured by Lighthouse on a slow-4G mobile profile against the production Cloudflare Pages deployment, THE LCP SHALL NOT regress by more than 200ms compared to the LCP recorded in the Pre_Phase_Baseline.
12. THE Site SHALL preload the single most critical Display_Font weight file (the file that backs the Hero H1 weight) using `<link rel="preload" as="font" type="font/woff2" crossorigin>` to minimize layout shift on hero load.
13. THE Site SHALL NOT load more than four total Display_Font weight files (variable font axis files count as one file each).
14. THE Site SHALL preserve the following Hero H1 / tagline DOM hooks unchanged when introducing Display_Font, so the typewriter, count-up, gradient-text, and scanline effects continue to function: the `[data-typewriter]` element and its sibling caret container with class `type-caret`, the `id="hero-tagline"` paragraph, the inline gradient span containing `headlineHighlight`, and the `data-count-up` attribute on stat number elements.
15. THE Site SHALL preserve the article body drop-cap pattern (`.article-body p:first-of-type::first-letter`) with the Display_Font applied, OR SHALL switch the drop-cap selector to use Display_Font directly; in either case the drop-cap glyph SHALL remain visible on the first paragraph of articles.
16. IF Display_Font fails to load (for example a third-party font origin outage), THEN THE Site SHALL render headlines using the fallback stack from criterion 10 with no layout breakage and no missing-glyph boxes for ASCII characters.

### Requirement 4: Lucide Icon System for Primary UI

**User Story:** As a professional visitor, I want category icons and UI controls to use a consistent linear icon set rather than emoji, so that the site looks like a B2B data product instead of a consumer app.

#### Acceptance Criteria

1. THE Category_Meta SHALL gain a new required field `iconName: string` whose value is the kebab-case name of a Lucide icon, mapped per category as: `crm` → `users`, `marketing` → `megaphone`, `ecommerce` → `shopping-cart`, `project-management` → `clipboard-list`, `hr` → `user-cog`, `analytics` → `bar-chart-3`, `security` → `shield`, `communication` → `message-square`.
2. THE Category_Meta SHALL retain the existing `emoji` field, but the field SHALL be marked as decorative-only and SHALL NOT be rendered in the primary UI surfaces enumerated in criteria 3 and 4.
3. THE Site SHALL render the Lucide icon (not the emoji) in: the BaseLayout header desktop Categories dropdown, the BaseLayout mobile menu category list, the BaseLayout footer Categories list, the homepage Browse Categories section cards, the homepage Hero category pills, the article-page breadcrumb category step, and any "Read more in {category}" affordances.
4. THE Site SHALL render Lucide icons (not emoji) for UI controls including: the search trigger icon, the mobile hamburger icon, the dropdown chevron in the header Categories menu, the close icon in the search modal, the close icon in the cookie consent banner if present, and the external-link icon next to source citations if present.
5. THE Icon_System SHALL be implemented such that only the icons actually used by the Site appear in the production bundle; the total icon-related payload added to the homepage — measured as the sum of inline `<svg>` bytes in the homepage HTML response plus any icon-specific JS chunks emitted by the build — SHALL NOT exceed 8 KB gzipped.
6. THE Site SHALL render every Lucide icon as inline SVG emitted at build time by the Astro build pipeline; THE Site SHALL NOT load icons via a runtime icon font, a remote icon CDN, or a global CSS sprite file.
7. WHEN an icon stands alone as an interactive control without adjacent visible text (for example the search button, the hamburger button, or the search-modal close button), THE Site SHALL set a non-empty `aria-label` on the control element describing the action it performs.
8. WHEN an icon is decorative and accompanied by visible text (for example a category name in the header dropdown), THE Site SHALL set `aria-hidden="true"` on the SVG element AND SHALL NOT set `role="img"` on the same element.
9. THE Site SHALL render Lucide icons with a `stroke-width` between 1.5 and 2.0 inclusive, AND the icon stroke color SHALL achieve a contrast ratio of at least 3:1 against its background surface (verified per Requirement 1 criterion 3 methodology) in the Dark_Theme.
10. WHERE a Hero_Stat_Card defines an emoji-only legacy icon and no Lucide-equivalent icon name has been assigned to that card, THE Site SHALL render the existing emoji as a transitional fallback inside the card icon slot, AND the card surface SHALL inherit Dark_Theme styling unchanged.
11. THE `HotStat` interface in `src/lib/site-config.ts` SHALL gain an optional `iconName` field of type string accepting a kebab-case Lucide icon name; the existing `icon` (emoji) field SHALL remain present and optional for backward compatibility.
12. WHEN both `iconName` and `icon` are provided on a HotStat, THE Site SHALL render only the Lucide icon resolved from `iconName` AND SHALL NOT render the emoji from `icon` in the same card.
13. IF Build is run after the icon migration, THEN THE Build SHALL exit with status 0 AND the generated homepage HTML SHALL contain at least one inline `<svg>` element for each rendered category icon (per criterion 3) and each rendered UI-control icon (per criterion 4).
14. IF an `iconName` value on Category_Meta or HotStat does not resolve to a known Lucide icon at build time, THEN THE Build SHALL fail with a non-zero exit status AND emit an error message identifying the offending field and the unresolved icon name.
15. THE Site SHALL NOT introduce any runtime client-side JavaScript framework (React, Vue, Preact, or Solid) into the production bundle as a side effect of adopting the Icon_System.

### Requirement 5: Build, Deployment, and Compatibility Guarantees

**User Story:** As an operator deploying to Cloudflare Pages, I want the visual uplift to ship without breaking the static build, the Pagefind index, or analytics/consent integrations, so that production stays stable through the rollout.

#### Acceptance Criteria

1. WHEN `npm run build` is executed on the Phase 1 branch, THE Build SHALL exit with status 0 within 600 seconds wall-clock and SHALL emit no error-level messages on stderr.
2. WHEN `npm run build` is executed on the Phase 1 branch, THE Build SHALL produce a Pagefind_Index at `dist/pagefind/` containing at least the same number of indexed pages as recorded in the Pre_Phase_Baseline.
3. IF the Build produces a Pagefind_Index with fewer indexed pages than the Pre_Phase_Baseline, THEN the Phase 1 branch SHALL NOT be merged to `main` until the regression is resolved.
4. THE Site SHALL continue to load the Google Analytics 4 (GA4) script tag and the Google Consent Mode v2 inline default-state script in `BaseLayout.astro` byte-identical to the corresponding lines captured in the Pre_Phase_Baseline.
5. THE Site SHALL continue to emit the Schema.org `Organization` JSON-LD on every page and the `WebSite` JSON-LD on the homepage with the same schema fields and field values as captured in the Pre_Phase_Baseline.
6. THE Site SHALL continue to emit the same canonical URL, OpenGraph, and Twitter card meta tags on every page as captured in the Pre_Phase_Baseline; the only permitted change is the value of `og:image` if the OG default asset is replaced.
7. THE Site SHALL NOT introduce a new runtime client-side JavaScript framework dependency (React, Vue, Preact, Solid, or Svelte) in `package.json` `dependencies` or `devDependencies` as part of this phase.
8. THE Site SHALL NOT modify the WPGraphQL schema, the ACF Site Config schema, or any existing GraphQL query selection set in `src/lib/wp-api.ts` as part of this phase; new optional client-only fields on TypeScript interfaces (for example `sparklineData`, `iconName`) are permitted.
9. WHERE a Phase 1 change adds a new entry to `package.json` `dependencies` or `devDependencies`, THE Phase 1 changelog SHALL list each new entry with its uncompressed install size, AND the production homepage gzipped JS payload growth attributable to those new entries SHALL NOT exceed 12 KB compared to the Pre_Phase_Baseline JS payload size.
10. THE Site SHALL list `sangaypopo@gmail.com` as the single contact email anywhere a contact email is shown to users (visible page text, link `mailto:` targets, OG description text, and JSON-LD `contactPoint` if present); no other email address SHALL be introduced by this phase.
11. WHEN the homepage and a representative article page are audited with Lighthouse on the post-phase deployment, THE Performance score for each page on each profile (desktop, mobile) SHALL NOT regress by more than 5 points compared to the same page and same profile in the Pre_Phase_Baseline, AND THE Accessibility score for each page on each profile SHALL be greater than or equal to the same baseline measurement.
12. THE Site SHALL serve any new font file, icon SVG, or sparkline data file added to the repository exclusively from the local `/public` directory or from `fonts.googleapis.com` / `fonts.gstatic.com`; THE Site SHALL NOT introduce any other third-party origin in `<link>`, `<script>`, `<img>`, or `url(...)` references as part of this phase.
