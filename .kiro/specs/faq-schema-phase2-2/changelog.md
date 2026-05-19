# Phase 2.2 — FAQ Schema Changelog

> Companion to `requirements.md`, `design.md`, and `tasks.md`.
>
> Date shipped: 2026-05-19

---

## Summary

Two coordinated frontend deliverables on top of the Phase 1 + 2.1 + 2.3 production baseline. Backend already shipped the ACF + mu-plugin support (`faq-field-group.php` registers a Repeater with `faq.faq[].{question,answer}`); this phase wires it through the frontend.

| # | Stream | What changed |
|---|---|---|
| C.1 | GraphQL extension + typed pass-through | `ARTICLE_PAGE_QUERY` gains one new line `faq { faq { question answer } }`; `ArticleDetail` gains `faqItems: FaqItem[]`; `getArticleData()` populates it via `post.faq?.faq?.map(...) ?? []`. **First phase since v1.0 to touch a GraphQL selection set, but purely additive** — no field removed, no field renamed. |
| C.2 | FAQPage JSON-LD + visible accordion | `ArticleLayout` emits a 4th `<script ld+json>` block (FAQPage) after Article + BreadcrumbList + Dataset, only when the article has ≥ 1 valid FAQ item. New `<section class="faq-section">` rendered between Sources and Related Articles, using native HTML5 `<details>/<summary>` (zero client JS). Filter rules guarantee visible content matches JSON-LD byte-for-byte. |

Hard guarantees kept (verified):

- ✅ No new client-side JS framework (FAQ accordion = native `<details>`)
- ✅ Only one additive line in `ARTICLE_PAGE_QUERY`; other 7 query literals byte-identical
- ✅ Existing Article + BreadcrumbList + Dataset JSON-LD blocks byte-identical
- ✅ Build pipeline unchanged (`prebuild` → `astro build` → `pagefind`)
- ✅ Single contact email `sangaypopo@gmail.com`
- ✅ No new third-party origin
- ✅ `<html lang="en">` and `cleanExcerpt()` unchanged

---

## Production state after Phase 2.2

| Metric | Pre-Phase 2.2 | Post-Phase 2.2 | Δ |
|---|---:|---:|---:|
| Pages built | 42 | 42 | 0 |
| Pagefind index pages | 25 | 25 | 0 |
| Pagefind indexed words | 3,778 | 3,780 (+2 due to "Frequently Asked Questions" heading on 1 article) | +2 |
| Article first-party JS gz (Salesforce, has FAQ) | 6,418 B | ~6,800 B (estimated) | ≤ +500 B ≤ 5 KB ✅ |
| Article first-party JS gz (no FAQ) | 6,418 B | 6,418 B | +0 B |
| JSON-LD blocks on article with FAQ | 3 (Article + Breadcrumb + Dataset) | 4 (+ **FAQPage**) | +1 |
| JSON-LD blocks on article without FAQ | 3 | 3 | 0 |
| Articles with FAQ data | 0 | 1 (Salesforce, 3 questions; backend test data) | +1 |
| Total Question entries across site | 0 | 3 | +3 |

---

## Sample FAQPage block (Salesforce article)

Captured from `dist/crm/salesforce-statistics-2026/index.html`:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Salesforce market share in 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Salesforce holds approximately 23% of the global CRM market share in 2026, making it the dominant player in the industry."
      }
    },
    {
      "@type": "Question",
      "name": "How many employees does Salesforce have?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Salesforce employs over 79,000 people worldwide as of 2026, with significant growth in AI and cloud engineering roles."
      }
    },
    {
      "@type": "Question",
      "name": "What is Salesforce annual revenue?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Salesforce reported annual revenue exceeding $38 billion in fiscal year 2026, driven by strong growth in AI-powered cloud solutions."
      }
    }
  ]
}
```

---

## Verification suite results (post-merge)

| Suite | Pre-Phase 2.2 | Post-Phase 2.2 | Status |
|---|:---:|:---:|:---:|
| Unit (`npm run test:phase1`) | 76 | **87** (+11 faq tests) | ✅ |
| Animation (`verify-animations.mjs`) | 31 | 31 | ✅ |
| A11y (`verify-a11y.mjs`) | 17 | 17 | ✅ |
| Bundle (`verify-bundle.mjs`) | 7 | 7 | ✅ |
| Related (`verify-related.mjs`) | 72 | **72** (assertion updated to accept 3 OR 4 ld+json blocks) | ✅ |
| Phase 2.3 internal links (`verify-phase23-internal-links.mjs`) | 5 | 5 | ✅ |
| **FAQ (`verify-faq.mjs`)** (NEW) | — | **49** (1 article × 4 + 45 articles × 1) | ✅ |
| **TOTAL** | 208 | **268** | ✅ |

---

## WPGraphQL surface (Req 1.1, 1.2, 1.6, 5.9)

`git diff src/lib/wp-api.ts` shows:

- ✅ Existing query string literals (`HOME_PAGE_QUERY`, `CATEGORY_PAGE_QUERY`, `ALL_SLUGS_QUERY`, `ALL_CATEGORIES_QUERY`, `SITEMAP_QUERY`, `POSTS_BY_SLUGS_QUERY`, `SITE_CONFIG_QUERY`) **byte-identical**
- ✅ Existing transformers (`transformArticleCard`, `transformCategory`, `transformSiteConfig`, `cleanExcerpt`, `resolvePrimaryCategory`, `sortBySticky`, `getRecentArticlesAcrossCategories`) byte-identical
- ✅ Single additive change to `ARTICLE_PAGE_QUERY`: appended `faq { faq { question answer } }` between `sources { ... }` and the closing brace
- ✅ New `FaqItem` interface added; `ArticleDetail.faqItems: FaqItem[]` added (additive)
- ✅ `getArticleData()` populates `faqItems` via `post.faq?.faq?.map(...) ?? []` mirroring existing Repeater pattern

---

## Files changed

### New files (5)

```
src/lib/faq-schema.ts                 buildFaqPageSchema + filterFaqItems helpers
src/lib/faq-schema.test.mjs           11 unit tests
src/components/FaqSection.astro       Section + native <details> accordion
baseline/verify-faq.mjs               49-assertion post-build suite
.kiro/specs/faq-schema-phase2-2/      requirements + design + tasks + this changelog
```

### Modified files (5)

```
src/lib/wp-api.ts                     +FaqItem interface, +faqItems field, +faq query block
src/layouts/ArticleLayout.astro       +faqItems prop, +FAQPage <script>, +FaqSection mount
src/pages/[category]/[slug].astro     +faqItems pass-through to ArticleLayout
baseline/verify-related.mjs           assertion accepts 3 OR 4 ld+json blocks now
package.json                          +faq-schema.test.mjs in test:phase1 script
```

### Deleted files

None.

---

## Commits shipped

| SHA | Title |
|-----|-------|
| (this commit) | feat(seo): Phase 2.2 FAQ Schema — Schema.org FAQPage JSON-LD + visible accordion |

---

## Open follow-ups

1. **More articles need FAQ data**: Backend has populated 3 FAQ items on Salesforce only as test data. Editors can fill the FAQ Repeater on other 45 articles to grow rich-result coverage. Frontend zero work — the accordion + JSON-LD will appear automatically on the next CF Pages rebuild.

2. **D4 — `articleMeta.dataSource` cleanup** (still pending). Phase 2.2 did not touch this. Once a coordinated FE+BE deploy window is available: FE removes `dataSource` from `ARTICLE_PAGE_QUERY` first → push → CF deploys → BE removes ACF field.

3. **Manual Schema validator pass**: Run Google Rich Results Test + Schema.org validator against `https://saasstatshub.com/crm/salesforce-statistics-2026/` after the deploy. Expect 0 errors, FAQPage rich-result detected, Dataset rich-result still detected.

4. **Optional Phase 2.x — rich-text answers**: If editors want bold / links / lists in answers, switch the ACF field type from text to WYSIWYG. Frontend would need a small change: switch `{item.answer}` to `<Fragment set:html={cleanFaqAnswer(item.answer)} />` with a sanitizer mirroring `cleanExcerpt`. Not needed today.

---

*Phase 2.2 sign-off date: 2026-05-19*
