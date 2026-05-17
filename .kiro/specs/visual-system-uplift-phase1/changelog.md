# Phase 1 — Visual System Uplift Changelog

> Companion to `requirements.md` and `design.md`. This file is the
> auditable record of what shipped in Phase 1.
>
> Date shipped: 2026-05-17

---

## Summary

Four coordinated work streams turned SaaSStatsHub from a "competent SaaS
blog" into a "professional data terminal":

| # | Stream | What changed |
|---|---|---|
| A.1 | Dark-First Theme | Default site palette switched to dark slate (L\* ≈ 9 background, 17.4:1 body contrast, 4 finance tokens) |
| A.2 | Sparklines | Inline-SVG mini-trend on every Hero Stat card + opt-in for in-article StatCards. Build-time rendered, no chart library, no JS framework |
| A.3 | Editorial Typography | Self-hosted Fraunces variable serif for Hero / article H1 / section H2; preloaded; Georgia fallback |
| A.4 | Lucide Icon System | 24 icons across category nav, UI controls, hot stats, breadcrumbs. Hand-rolled `Icon.astro` with build-time inline SVG, fail-the-build on unknown name |

Hard guarantees kept:

- ✅ No new client-side JS framework (React/Vue/Preact/Solid/Svelte)
- ✅ Zero changes to WPGraphQL queries (`src/lib/wp-api.ts` byte-identical)
- ✅ Zero changes to ACF schema, GA4, Consent Mode, JSON-LD, OG/Twitter meta
- ✅ Build pipeline unchanged (`astro build && pagefind --site dist`)
- ✅ Cloudflare Pages SSG deploy unchanged
- ✅ Single contact email `sangaypopo@gmail.com`

---

## Token redefinition (Req 1.15)

All token NAMES preserved (Req 1.12). Only values change.

Background reference: `--color-bg = #0A0F1F` (CIE Lab L\* ≈ 9, in 8–14 range per Req 1.2).

| Token | Old (light) | New (dark) | Contrast vs --color-bg |
|------|------|------|---:|
| `--color-bg` | `#FFFFFF` | `#0A0F1F` | — |
| `--color-bg-alt` | `#F8FAFC` | `#0F172A` | — |
| `--color-bg-warm` | `#FAFBFF` | `#111827` | — |
| `--color-surface` *(new)* | — | `#0F1A2E` | — |
| `--color-surface-elevated` *(new)* | — | `#162238` | — |
| `--color-text` | `#0F172A` | `#F1F5F9` | **17.41:1** ✅ AAA |
| `--color-text-secondary` | `#475569` | `#CBD5E1` | **12.85:1** ✅ AA |
| `--color-text-muted` | `#94A3B8` | `#94A3B8` | **7.44:1** ✅ ≥ 3 |
| `--color-border` | `#E2E8F0` | `#1E293B` | (decorative; subtle by design) |
| `--color-border-light` | `#F1F5F9` | `#1A2236` | (hairlines) |
| `--color-border-strong` *(new)* | — | `#64748B` | **4.01:1 vs bg, 3.65:1 vs surface, 3.34:1 vs surface-elevated** ✅ Req 1.13 |
| `--color-primary` | `#2563EB` | `#3B82F6` | **5.19:1** ✅ AA |
| `--color-primary-dark` | `#1E40AF` | `#1D4ED8` | — |
| `--color-primary-light` | `#DBEAFE` | `#1E3A8A` | (chip/pill background) |
| `--color-primary-lighter` | `#EFF6FF` | `#172554` | (hover tint) |
| `--color-accent` | `#10B981` | `#34D399` | (used as `--color-positive`) |
| `--color-violet` | `#7C3AED` | `#A78BFA` | (gradient endpoint) |
| `--color-warning` | `#F59E0B` | `#FBBF24` | (warning ticker) |
| `--color-danger` | `#EF4444` | `#F87171` | (used as `--color-negative`) |
| `--color-positive` *(new)* | — | `#34D399` | **9.92:1** ✅ ≥ 4.5 |
| `--color-negative` *(new)* | — | `#F87171` | **6.90:1** ✅ ≥ 4.5 |
| `--color-neutral` *(new)* | — | `#94A3B8` | **7.44:1** ✅ ≥ 3 |

Type scale tokens added (Req 3.6):

| Token | Value (clamp) | Role |
|---|---|---|
| `--text-display-xl` | `clamp(36px, 4.5vw + 16px, 64px)` | Hero H1 (≥56 desktop, ≥36 mobile) |
| `--text-display-lg` | `clamp(28px, 2.8vw + 16px, 44px)` | Article H1 (≥40 desktop, ≥28 mobile) |
| `--text-heading-lg` | `clamp(22px, 1.4vw + 16px, 32px)` | Section H2 (≥28/≥22) |
| `--text-heading-md` | `clamp(18px, 0.6vw + 16px, 22px)` | H3 (≥20/≥18) |
| `--text-body` | `17px` | Paragraph |
| `--text-small` | `13px` | Metadata |

Font tokens:

```
--font-display: 'Fraunces Variable', 'Fraunces', Georgia, 'Times New Roman', serif;
--font-body:    'Inter', system-ui, -apple-system, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

---

## Dependency additions (Reqs 5.7, 5.8, 5.9)

| Package | Version | node_modules size | Production bundle impact |
|---|---:|---:|---|
| `lucide` | `^1.16.0` | ~19.6 MB | **Tree-shaken to 24 icons.** Inline SVG payload on homepage: **1.07 KB gz** (limit 8 KB ✅) |
| `@fontsource-variable/fraunces` | `^5.2.9` | ~1.8 MB | **Build-time copy only.** Ships one woff2 file (`fraunces-latin-opsz-normal.woff2`, 67,304 B) to `public/fonts/`. Never bundled into JS |

No forbidden runtime framework deps in `package.json`. ✅

---

## Bundle size deltas (Reqs 4.5, 5.9, 2.18)

Measured on the homepage post-phase build vs the captured Pre_Phase_Baseline.

| Bucket | Baseline | Post-phase | Delta | Budget | Status |
|---|---:|---:|---:|---:|:---:|
| First-party gzipped JS | 5,139 B | 5,139 B | **+0 B** | ≤ 12 KB | ✅ |
| Inline Lucide SVGs | 0 B | 1,097 B gz | +1.07 KB | ≤ 8 KB | ✅ |
| Sparkline payload (8 SVGs + scoped CSS) | 0 B | 1,270 B gz | +1.24 KB | ≤ 3 KB | ✅ |
| Pagefind index page count | 3 | 3 | 0 | ≥ 3 | ✅ |

Origin allowlist (Req 5.12): only `fonts.googleapis.com`, `fonts.gstatic.com`, `www.googletagmanager.com`, `saasstatshub.com`. No new third-party origins. Namespace URIs (`schema.org`, `www.w3.org`) are not fetched. ✅

Email policy (Req 5.10): only `sangaypopo@gmail.com` appears in user-facing content. Placeholder strings `you@email.com` / `you@company.com` / `email@domain.com` ignored as they're input placeholders, not contact info. ✅

---

## `<head>` diff vs baseline (Reqs 5.4, 5.5, 5.6)

Baseline `baseline/baseline-home.head.html` vs post-phase `baseline/post-home.head.html`:

**New blocks (expected per Phase 1 design)**:
- `<link rel="preload" as="font" href="/fonts/fraunces-variable-latin.woff2" ...>` (Req 3.12)
- `<style>` `@font-face` for Fraunces Variable with `font-display: swap` (Req 3.9)
- `<link rel="stylesheet" href="/_astro/global.{hash}.css">` — hash changed from `Cc6puSXZ.css` to `BCb8782t.css` because token values changed (CSS hash is content-addressed, expected)
- `.sparkline` scoped CSS rules appended to inline `<style>` (component-level)

**Unchanged blocks (Req 5.4, 5.5, 5.6)**:
- ✅ `<title>` content
- ✅ `<meta name="description">`
- ✅ `<meta name="robots">`
- ✅ `<link rel="canonical">`
- ✅ All `og:*` meta tags (site_name, type, title, description, url, image)
- ✅ All `twitter:*` meta tags (card, title, description, image)
- ✅ `<link rel="icon">`, `<link rel="sitemap">`
- ✅ `<meta name="google-adsense-account">`
- ✅ Google Consent Mode v2 inline `<script>` block (defaults to denied)
- ✅ GA4 `<script async src="googletagmanager.com/gtag/js?id=G-Z95ZVJ8TK6">`
- ✅ Schema.org Organization JSON-LD
- ✅ Schema.org WebSite JSON-LD (homepage only)

---

## WPGraphQL surface (Req 5.8)

`git diff src/lib/wp-api.ts`: **0 bytes changed.** Every GraphQL query string in `wp-api.ts` is byte-identical to the pre-phase main branch. No selection set changes, no schema changes, no new fields requested from the backend. New optional client-only fields on TypeScript interfaces (`HotStat.iconName`, `HotStat.trend`, `HotStat.sparklineData`, `CategoryMeta.iconName`) are local to the frontend.

---

## A11y verification (Reqs 1.3, 1.4, 1.5, 1.6, 1.13, 1.14, 4.7, 4.8, 4.9, 2.13)

`node baseline/verify-a11y.mjs`: **16/16 passed**.

- 6/6 contrast tiers (body 17.4:1, secondary 12.9:1, muted 7.4:1, positive 9.9:1, negative 6.9:1, primary 5.2:1)
- 3/3 form input border contrasts (vs surface 3.65:1, vs bg 4.01:1, vs surface-elevated 3.34:1)
- 2/2 footer text contrasts vs `--color-surface` (body 11.71:1, muted 6.78:1)
- 1/1 homepage SVG a11y (77 SVGs, 69 aria-hidden + 8 role=img+aria-label, 0 orphans)
- 2/2 standalone control aria-labels (`#search-toggle`, `#mobile-menu-toggle`)
- 1/1 Sparkline a11y (8/8 with `role="img"` + `aria-label="Trend: ..."`)
- 1/1 article-page SVG a11y (39 SVGs, 0 orphans)

---

## Animations preserved (Req 1.8, 3.14)

`node baseline/verify-animations.mjs`: **31/31 passed**.

- 8/8 homepage DOM hooks: `[data-typewriter]`, `#hero-tagline`, gradient highlight span, `[data-count-up]`, `.animate-float`, `.hero-stat-card`, `.tech-border`, `.article-card`/`.category-card` (spotlight target)
- 2/2 article-page DOM hooks: `#reading-progress`, `.article-body`
- 14/14 `@keyframes` blocks present: fadeInUp, fadeIn, shimmer, float, pulse-glow, count-up, scanline, grid-pan, border-flow, pulse-dot, blink-caret, line-draw, ticker-blink, sparkline-draw
- 7/7 reduced-motion overrides: animate-fade-in-up, animate-float, bg-tech-grid-animated, tech-border, live-dot, sparkline draw

---

## Unit tests (Reqs 2.3, 2.4, 2.5, 2.6, 2.7, 2.14, 3.15)

`npm run test:phase1`: **51/51 passed**.

- `src/lib/sparkline.test.mjs` — 41 tests over `validateSeries`, `computeSlope`, `classifyTrend`, `decorativeCurve`, `percentChange`, `formatAriaLabel`, `pointsToPath`, `trendClassToDirection`
- `src/lib/dropcap.test.mjs` — 10 tests over `withDropCap`

---

## Files changed

### New files

```
src/components/Icon.astro              (Lucide wrapper, build-time inline SVG)
src/components/Sparkline.astro          (inline SVG sparkline, no JS framework)
src/lib/icon-registry.ts                (24 named Lucide icons, throws on unknown)
src/lib/sparkline.ts                    (8 pure helpers — slope, path math, aria)
src/lib/sparkline.test.mjs              (41 unit tests)
src/lib/dropcap.ts                      (1 pure helper for first-letter wrapping)
src/lib/dropcap.test.mjs                (10 unit tests)
src/data/sparkline-defaults.ts          (8 hardcoded series for default Hot Stats)
scripts/copy-fonts.mjs                  (prebuild step: copy Fraunces woff2)
public/fonts/fraunces-variable-latin.woff2  (67,304 B, copied at prebuild)
```

### Modified files

```
src/styles/global.css                   (token redefinition + dark-aware overrides + Sparkline scoped styles)
src/layouts/BaseLayout.astro            (Fraunces preload + @font-face + Icon wiring + dark footer)
src/layouts/ArticleLayout.astro         (Article H1 -> .font-display-lg)
src/lib/constants.ts                    (added required `iconName` to CategoryMeta + 8 mappings)
src/lib/site-config.ts                  (HotStat: optional `iconName`, `trend`, `sparklineData`; defaults updated)
src/components/sections/HeroSection.astro             (H1 .font-display + pill icons + sparkline-friendly layout)
src/components/sections/HotStatsSection.astro         (H2 .font-section-heading + Lucide card icons + Sparkline slot)
src/components/sections/BrowseCategoriesSection.astro (cat-icon → Icon, H2 .font-section-heading)
src/components/sections/LatestArticlesSection.astro   (H2 .font-section-heading)
src/components/sections/NewsletterCtaSection.astro    (H2 .font-section-heading + dark input + decoration aria-hidden)
src/components/Newsletter.astro                       (📬 → <Icon name="mail">)
src/components/Breadcrumb.astro                       (separator → <Icon name="chevron-right">)
src/components/Sources.astro                          (external link → <Icon name="external-link">)
src/components/CookieConsent.astro                    (added <Icon name="x"> close button)
src/components/SearchModal.astro                      (search/close icons → <Icon>)
src/components/TOC.astro                              (📋 → <Icon name="list">)
src/components/KeyTakeaways.astro                     (🎯 → <Icon name="target">)
src/components/StatCard.astro                         (added optional `series` / `trend` props for opt-in sparkline)
src/components/ArticleCard.astro                      (clock SVG aria-hidden)
src/components/CoverImage.astro                       (svg aria-hidden)
src/pages/categories/[slug].astro                     (sidebar Lucide + dark surface + H1 .font-display-lg)
src/pages/[category]/[slug].astro                     (calls withDropCap on article content)
package.json                            (added lucide, @fontsource-variable/fraunces; new prebuild + test:phase1 scripts)
.gitignore                              (ignore baseline raw artifacts but keep BASELINE.md tracked)
```

### Deleted files

None of substance. Three temporary verification pages (`src/pages/icon-test.astro`, `src/pages/sparkline-test.astro`, `src/pages/dropcap-test.astro`) were created during Tasks 3, 10, 12 and removed at the end of Task 20 before merge.

---

## Verification artifacts

Stored under `baseline/`:

- `BASELINE.md` — Pre-phase baseline report
- `verify-animations.mjs` + `verify-animations-result.txt`
- `verify-a11y.mjs` + `verify-a11y-result.txt`
- `verify-bundle.mjs` + `verify-bundle-result.txt`
- `extract-head.mjs`, `measure-js-payload.mjs`, `summarize-lighthouse.mjs` — Baseline data extractors
- `baseline-home.head.html`, `post-home.head.html` — Head diff inputs (post-phase head added by Task 20)

---

## Open follow-ups

These are intentionally out of scope for Phase 1 but worth tracking for next phases:

1. **Light theme toggle UI**: tokens are authored to permit a `[data-theme="light"]` override layer in a future phase, but no toggle ships today.
2. **Real article content**: production WP currently has empty `content` fields on articles, so the drop-cap helper is wired but invisible. Once real article bodies are published, drop-cap will render automatically.
3. **Real WP `sparklineData`**: current 8 default cards use the hardcoded series in `src/data/sparkline-defaults.ts`. If editors later supply per-card `sparklineData` via ACF, the resolver in `HotStatsSection.astro` already prefers it (Req 2.10/2.11).
4. **Lighthouse production regression check**: deferred to post-deploy (this changelog), since pre-deploy preview server lacks the Cloudflare CDN that affects LCP.

---

*Phase 1 sign-off date: 2026-05-17*
