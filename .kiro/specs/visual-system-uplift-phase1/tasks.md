# Implementation Plan:

## Overview

Phase 1 Visual System Uplift — 20 tasks covering dark theme, Lucide icons, Fraunces typography, sparklines, and verification. Estimated 5–8 days for one frontend engineer. Tasks are ordered by dependency; parallelizable tasks share the same dependency tier.

## Tasks

- [x] 1. Capture Pre-Phase Baseline: Run Lighthouse (homepage + article, desktop + mobile), record Pagefind page count, capture `<head>` blocks, record homepage JS payload size. Store in baseline/ directory. {Reqs: 5.2, 5.4, 5.5, 5.6, 5.11}
- [x] 2. Add Dependencies: `npm install lucide @fontsource-variable/fraunces`. Add `prebuild` script to copy Fraunces woff2 to `public/fonts/`. Verify `npm run build` passes. Document dep sizes. {Reqs: 5.8, 5.9, 3.2}
- [x] 3. Create Icon Registry + Icon.astro: Build `src/lib/icon-registry.ts` with ~16 Lucide imports + `resolveIcon()` that throws on unknown names. Build `src/components/Icon.astro` (inline SVG, aria-label/aria-hidden, stroke-width 1.75). Verify build fails on invalid iconName, succeeds on valid. {Reqs: 4.5, 4.6, 4.13, 4.14, 4.15}
- [x] 4. Add iconName to CategoryMeta: Add required `iconName: string` to interface. Populate 8 mappings (crm→users, marketing→megaphone, ecommerce→shopping-cart, project-management→clipboard-list, hr→user-cog, analytics→bar-chart-3, security→shield, communication→message-square). Update color/bg values for dark surfaces. {Reqs: 4.1, 4.2, 1.12}
- [x] 5. Redefine @theme Token Block to Dark: Replace all `--color-*` values with dark palette. Add `--color-surface`, `--color-surface-elevated`, `--color-positive`, `--color-negative`, `--color-neutral`, `--font-display`, type-scale tokens. Update hardcoded `white`/light values in `.glass`, `.gradient-border`, `.article-card`, `.category-card`, `.newsletter-box`, `.quick-overview th`, `::selection`. Verify build passes and homepage renders dark. {Reqs: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.12, 1.13, 1.14}
- [x] 6. Replace Emoji with Icon in BaseLayout: Header desktop dropdown, mobile menu, footer categories → `<Icon name={cat.iconName}>`. Search button, hamburger, chevron → `<Icon>`. Footer surface → token-driven dark. Verify inline SVGs in built HTML. {Reqs: 4.3, 4.4, 4.7, 4.8, 4.9}
- [x] 7. Replace Emoji with Icon in Section Components: HeroSection pills, BrowseCategoriesSection cat-icon, HotStatsSection card icon (when iconName set), Breadcrumb category step + separator, Sources external-link, CookieConsent close, SearchModal close, Newsletter mail icon. Verify no emoji in primary UI surfaces. {Reqs: 4.3, 4.4, 4.7, 4.8, 4.10, 4.12}
- [x] 8. Add Fraunces Font Loading: Preload link in BaseLayout head. Inline @font-face with font-display:swap. Fallback stack ending in Georgia, serif. Verify font loads; verify fallback renders when font blocked. {Reqs: 3.1, 3.2, 3.9, 3.10, 3.12, 3.13, 3.16}
- [x] 9. Apply Display Font to Headlines: HeroSection H1 (font-display, letter-spacing -0.03em, line-height 1.05). ArticleLayout H1 (display-lg). Homepage/category section H2s. Verify typewriter + count-up + gradient-text DOM hooks preserved and functional. {Reqs: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.14}
- [x] 10. Implement Drop-Cap: Create `src/lib/dropcap.ts` with `withDropCap(html)`. Call in ArticleLayout before injecting content. Add `.drop-cap` CSS (Display_Font, 3.4em, float left). Verify renders; verify fallback with font blocked. {Reqs: 3.15, 3.16}
- [x] 11. Create Sparkline Helpers: Build `src/lib/sparkline.ts` (validateSeries, computeSlope, classifyTrend, pointsToPath, decorativeCurve, formatAriaLabel, percentChange, trendClassToDirection). Create `src/data/sparkline-defaults.ts` with 8 series. Write unit tests for all helpers. {Reqs: 2.3, 2.4, 2.5, 2.6, 2.7, 2.14}
- [x] 12. Create Sparkline.astro Component: Props: series?, trend?, ariaLabel?, width?, height?, animate?. Data resolution chain. Slope→color. SVG with gradient fill + line + marker. aria-label + role=img. Draw-in animation + reduced-motion override. Verify renders valid SVG. {Reqs: 2.1, 2.2, 2.8, 2.9, 2.13, 2.14, 2.15, 2.16, 2.17}
- [x] 13. Wire Sparklines into HotStatsSection: Add trend/sparklineData to HotStat interface + defaults. Import SPARKLINE_DEFAULTS. Render Sparkline in each enabled card between stat-label and stat-source. Verify 8 sparklines visible, no overlap with numbers, count-up still works. {Reqs: 2.1, 2.10, 2.11, 2.15, 2.17, 2.18}
- [x] 14. Wire Sparkline into StatCard: Add series/trend props. Render Sparkline when provided; omit when not. Verify backward compatibility for existing usages. {Reqs: 2.12, 2.13}
- [x] 15. Dark Theme Sweep — All Pages: Walk every page in Req 1.7 set (homepage, categories, articles, search modal, newsletter, cookie banner, 404, about, contact, write-for-us, privacy, cookie, terms, affiliate). Fix remaining hardcoded light colors. {Reqs: 1.7, 1.13, 1.14}
- [x] 16. Verify Existing Animations: Typewriter, count-up, scanline, spotlight, float, border-flow, reading-progress all functional. Toggle reduced-motion → all stop. DOM hooks present in built HTML. {Reqs: 1.8, 1.9, 3.14}
- [x] 17. Accessibility & Contrast Audit: axe-core on homepage + article (0 contrast violations). Icon aria-label/aria-hidden correct. Sparkline role=img + aria-label. Form input border contrast 3:1. Footer text contrast. {Reqs: 1.3, 1.4, 1.5, 1.6, 1.13, 1.14, 2.14, 4.7, 4.8, 4.9}
- [x] 18. Build & Bundle Size Verification: Build exits 0 ≤600s. Pagefind count ≥ baseline. JS growth ≤12KB gz. Sparkline code ≤3KB gz. Icon payload ≤8KB gz. No framework deps. No unauthorized origins. Email = sangaypopo@gmail.com only. {Reqs: 5.1, 5.2, 5.7, 5.8, 5.9, 5.10, 5.12, 2.18, 4.5}
- [x] 19. Lighthouse Regression Check: Compare post-phase Lighthouse scores against baseline. Performance ≤5pt regression. Accessibility ≥ baseline. LCP ≤200ms regression. Fix any failures. {Reqs: 3.11, 5.11}
- [x] 20. Write Phase 1 Changelog & Merge: Document token hex+contrast table. Document dep sizes + bundle deltas. Diff head blocks (GA4, JSON-LD, OG unchanged). Diff wp-api.ts queries (0 changes). Create PR. Verify CF Pages build. Merge. {Reqs: 1.15, 5.4, 5.5, 5.6, 5.8}

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3, 4, 5, 8, 11] },
    { "wave": 4, "tasks": [6, 7, 9, 12] },
    { "wave": 5, "tasks": [10, 13, 14] },
    { "wave": 6, "tasks": [15] },
    { "wave": 7, "tasks": [16] },
    { "wave": 8, "tasks": [17] },
    { "wave": 9, "tasks": [18] },
    { "wave": 10, "tasks": [19] },
    { "wave": 11, "tasks": [20] }
  ],
  "dependencies": {
    "2": [1],
    "3": [2],
    "4": [3],
    "5": [2],
    "6": [4, 5],
    "7": [4, 5],
    "8": [2],
    "9": [8],
    "10": [9],
    "11": [2],
    "12": [11],
    "13": [12, 5],
    "14": [12],
    "15": [5, 6, 7, 9, 13],
    "16": [8, 15],
    "17": [15, 16],
    "18": [17],
    "19": [18],
    "20": [19]
  }
}
```

Wave 3 tasks (3, 4, 5, 8, 11) can run in parallel after Task 2.
Wave 4 tasks (6, 7, 9, 12) can run in parallel once their direct parents complete.
Waves 6–11 are sequential (verification chain).

## Notes

- All tasks assume a single feature branch off `main`. Do NOT push to main until Task 20.
- Tasks 1 and 20 are the only tasks that touch production (baseline capture + final merge).
- If any verification task (15–19) fails, loop back to the relevant implementation task to fix before proceeding.
- The `prebuild` script (Task 2) ensures the font file is always fresh in `public/fonts/` even after `npm ci`.
- Unit tests (Task 11) use Node's built-in test runner (`node --test`) — no additional test framework needed.
