# Implementation Plan: Phase 2.2 FAQ Schema

## Overview

This plan implements the two Phase 2.2 work streams defined in [design.md](./design.md): (C.1) extending `ARTICLE_PAGE_QUERY` with the new `faq.faq[].{question,answer}` Repeater and surfacing `faqItems` on `ArticleDetail`; (C.2) emitting Schema.org FAQPage JSON-LD on every article that has FAQ items, plus rendering a visible HTML5 `<details>` accordion section. 9 tasks across 5 execution waves. Backend ACF + mu-plugin already shipped (`faq-field-group.php`); this phase is frontend-only.

## Tasks

- [ ] 1. Capture Pre-Phase 2.2 Baseline
  - [ ] 1.1 Run `npm run build` and confirm exit 0
  - [ ] 1.2 Re-run `node baseline/capture-pre-phase21.mjs` → save outputs as `baseline/pre-phase22-*`
  - [ ] 1.3 Run all 6 verify scripts and confirm green: test:phase1 (76), animations (31), a11y (17), bundle (7), verify-related (72), verify-phase23-internal-links (5)
  - [ ] 1.4 Record current Lighthouse production baseline summary in `baseline/pre-phase22-lighthouse-summary.txt` (4 profiles: home/article × desktop/mobile)
- [ ] 2. Implement `src/lib/faq-schema.ts` — buildFaqPageSchema helper
  - [ ] 2.1 Create file with `FaqItem`, `FaqPageSchema` interfaces and `buildFaqPageSchema()` function
  - [ ] 2.2 Filter items with empty/whitespace question or answer (Req 2.6, 2.7)
  - [ ] 2.3 Return null when zero valid items remain (Req 3.2 caller-side empty-state)
  - [ ] 2.4 Emit @context, @type, mainEntity (array of Question with acceptedAnswer)
- [ ] 3. Implement `src/lib/faq-schema.test.mjs` — unit tests
  - [ ] 3.1 Create file with ≥ 8 tests covering required fields, conditional skipping, deterministic JSON, empty/malformed input
  - [ ] 3.2 Wire into `package.json` `test:phase1` script
  - [ ] 3.3 Run `npm run test:phase1` → new tests pass alongside existing 76
- [ ] 4. Edit `src/lib/wp-api.ts` — additive GraphQL extension
  - [ ] 4.1 Add `FaqItem` interface (or import from faq-schema.ts) and `faqItems: FaqItem[]` to ArticleDetail
  - [ ] 4.2 Append `faq { faq { question answer } }` to ARTICLE_PAGE_QUERY between `sources { ... }` and the closing brace
  - [ ] 4.3 In getArticleData(): map `post.faq?.faq?.map(...) ?? []` into faqItems
  - [ ] 4.4 Verify git diff shows zero changes to other query string literals (HOME / CATEGORY / ALL_SLUGS / SITEMAP / POSTS_BY_SLUGS / SITE_CONFIG)
- [ ] 5. Create `src/components/FaqSection.astro`
  - [ ] 5.1 Accept `items: FaqItem[]` prop
  - [ ] 5.2 Apply same trim/skip filter as faq-schema.ts (Req 3.8 byte match)
  - [ ] 5.3 Early-return when filtered count is 0
  - [ ] 5.4 Render section with class="faq-section" + aria-labelledby
  - [ ] 5.5 Render h2 with id="faq-section-heading" and text "Frequently Asked Questions"
  - [ ] 5.6 Render each item as native `<details><summary>{q}</summary><div>{a}</div></details>` with dark-theme styling
  - [ ] 5.7 Verify no client-side JS framework emitted
- [ ] 6. Edit `src/layouts/ArticleLayout.astro`
  - [ ] 6.1 Import FaqSection, buildFaqPageSchema, FaqItem type
  - [ ] 6.2 Add `faqItems?: FaqItem[]` prop with default `[]`
  - [ ] 6.3 Build faqPageSchema via buildFaqPageSchema(faqItems)
  - [ ] 6.4 Emit 4th JSON-LD script after datasetSchema only when faqPageSchema is non-null
  - [ ] 6.5 Render FaqSection between Sources and RelatedArticles when faqItems.length > 0
  - [ ] 6.6 Verify build exit 0 and existing 3 JSON-LD blocks byte-identical
- [ ] 7. Edit `src/pages/[category]/[slug].astro` — pass faqItems
  - [ ] 7.1 Pass `faqItems={article.faqItems}` to ArticleLayout
  - [ ] 7.2 Verify build exit 0 and Salesforce article renders 3 FAQ items + FAQPage block
- [ ] 8. Update `baseline/verify-related.mjs` + Create `baseline/verify-faq.mjs`
  - [ ] 8.1 Update verify-related.mjs assertion: accept 4 ld+json blocks (Article + BreadcrumbList + Dataset + optional FAQPage)
  - [ ] 8.2 Create verify-faq.mjs: assert FAQPage block present iff article has FAQ items, count matches visible details, byte-match question/answer text
  - [ ] 8.3 Run both scripts → all assertions pass
- [ ] 9. Production deploy + Lighthouse + Schema validator + Changelog
  - [ ] 9.1 Run all 7 verify scripts locally; commit + push to main
  - [ ] 9.2 Wait for CF Pages auto-deploy
  - [ ] 9.3 Smoke test: Salesforce article shows 4 ld+json + visible FAQ accordion + 3 questions match
  - [ ] 9.4 Run Google Rich Results Test on Salesforce URL: 0 errors, FAQPage detected
  - [ ] 9.5 Run Lighthouse home + article × desktop + mobile, compare against Pre_Phase_2_2_Baseline
  - [ ] 9.6 Verify budgets: Perf Δ ≥ -5, A11y Δ ≥ 0, mobile-home LCP Δ ≤ +200ms
  - [ ] 9.7 Write `changelog.md` with all metrics, deltas, files changed, commits

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1, 2, 5], "parallel": true },
    { "wave": 2, "tasks": [3, 4], "parallel": true, "dependsOn": { "3": [2], "4": [2] } },
    { "wave": 3, "tasks": [6], "parallel": false, "dependsOn": { "6": [2, 4, 5] } },
    { "wave": 4, "tasks": [7, 8], "parallel": true, "dependsOn": { "7": [4, 6], "8": [6] } },
    { "wave": 5, "tasks": [9], "parallel": false, "dependsOn": { "9": [3, 7, 8] } }
  ]
}
```

## Notes

- Total: 9 tasks, 5 waves. Estimated: 1-1.5 hours for an engineer familiar with the codebase (smaller than Phase 2.1 because the GraphQL change is one additive line and the visible UI is a single new component).
- Tasks 1-8 are local. Task 9 triggers production deploy + manual schema validation gate.
- The backend has already populated 3 FAQ items on `salesforce-statistics-2026` for testing. Other articles will render the FAQ section as soon as editors fill the field.
- `verify-related.mjs` needs a small update because Phase 2.1 hardcoded "exactly 3 ld+json blocks"; Phase 2.2 makes the count 3 OR 4 depending on whether the article has FAQ.
