# Pre-Phase Baseline — Visual System Uplift Phase 1

**Captured:** 2026-05-17
**Source:** https://saasstatshub.com (production, pre-uplift)
**Spec:** `.kiro/specs/visual-system-uplift-phase1/`

This document is the immutable reference point that Phase 1 regression budgets compare against. **Do not edit values after capture** — only append a "Post-Phase Comparison" section once Phase 1 ships.

---

## 1. Lighthouse Scores

Run with `lighthouse@12`, headless Chromium, default desktop preset / `form-factor=mobile --throttling-method=simulate`.

| Page / Profile     | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS    |
|--------------------|------------:|--------------:|---------------:|----:|---------:|-------:|
| Home / Desktop     |          93 |            92 |            100 |  92 |    1,569 | 0.005  |
| Home / Mobile      |          87 |            92 |              — |   — |    3,773 | 0.010  |
| Article / Desktop  |          98 |            95 |            100 |  83 |      818 | 0.000  |
| Article / Mobile   |          86 |            95 |            100 |  83 |    3,198 | 0.000  |

> Note: home-mobile Best Practices / SEO came back null in the report (quirk of the simulate-mobile run); both can be re-captured if needed.

**Phase 1 regression budgets** (per Reqs 3.11, 5.11):

- Performance: ≤ 5 points regression per page per profile
- Accessibility: ≥ baseline per page per profile
- LCP (home / mobile): ≤ 200 ms regression vs **3,773 ms**

Raw reports stored at `lh-{home,article}-{desktop,mobile}.report.{json,html}`.

---

## 2. Pagefind Index

Captured from `https://saasstatshub.com/pagefind/pagefind-entry.json`:

```json
{ "version": "1.5.2", "languages": { "en": { "page_count": 3 } } }
```

**Baseline page count: 3.** Phase 1 build must produce ≥ 3 indexed pages (Req 5.2, 5.3).

---

## 3. JS Payload (gzipped)

Captured by fetching every `<script src>` referenced in the homepage HTML and gzipping each + summing inline `<script>` blocks.

| Bucket                    | Gzipped (B) | Gzipped (KB) |
|---------------------------|------------:|-------------:|
| **Total** (incl. third-party) |     167,212 |        163.29 |
| **First-party only**          |       5,139 |          5.02 |

Third-party origins excluded from first-party total: `googletagmanager.com`, `google-analytics.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `doubleclick.net`, `googlesyndication.com`.

**Phase 1 budget** (Req 5.9): first-party gzipped JS growth from new dependencies (Lucide, Sparkline, Fraunces loader) ≤ 12 KB.

Raw breakdown stored at `baseline-js-payload.json`.

---

## 4. `<head>` Block Snapshots

Both pages' `<head>` were extracted, normalized (line-per-tag), and saved for byte-level diffing post-phase.

| Page    | File                            | Tag counts                                  |
|---------|---------------------------------|---------------------------------------------|
| Home    | `baseline-home.head.html`       | 15 meta · 1 title · 7 link · 5 script       |
| Article | `baseline-article.head.html`    | 15 meta · 1 title · 7 link · 4 script       |

**Phase 1 invariants** (Reqs 5.4, 5.5, 5.6):

- GA4 `gtag.js` `<script>` tag and Consent Mode v2 inline script: byte-identical
- `Organization` JSON-LD (every page) and `WebSite` JSON-LD (homepage only): same fields and values
- canonical / OpenGraph / Twitter card meta: byte-identical, with only `og:image` allowed to change

The verification step (Task 20) diffs the post-phase `<head>` against these snapshots, ignoring only the new Fraunces `<link rel="preload">` and `@font-face` block.

---

## 5. Raw HTML Snapshots

| Page    | File                       | Size (B) |
|---------|----------------------------|---------:|
| Home    | `baseline-home.html`       |   62,376 |
| Article | `baseline-article.html`    |   34,298 |

Used to re-compute first-party JS payload, head diff, or any other byte-level check during Phase 1 verification.

---

## 6. Files in This Directory

| File                                       | Purpose |
|--------------------------------------------|---------|
| `BASELINE.md`                              | This summary |
| `baseline-home.html`                       | Raw homepage HTML |
| `baseline-article.html`                    | Raw article-page HTML |
| `baseline-home.head.html`                  | Normalized homepage `<head>` |
| `baseline-article.head.html`               | Normalized article-page `<head>` |
| `baseline-pagefind-entry.json`             | Pagefind entry (page count) |
| `baseline-js-payload.json`                 | JS payload breakdown (external + inline, raw + gzipped, first-party split) |
| `baseline-lighthouse.json`                 | Lighthouse summary (4 runs, scores + key metrics) |
| `lh-home-desktop.report.{json,html}`       | Raw Lighthouse report — home / desktop |
| `lh-home-mobile.report.{json,html}`        | Raw Lighthouse report — home / mobile |
| `lh-article-desktop.report.{json,html}`    | Raw Lighthouse report — article / desktop |
| `lh-article-mobile.report.{json,html}`     | Raw Lighthouse report — article / mobile |
| `extract-head.mjs`                         | Tool: head extractor |
| `measure-js-payload.mjs`                   | Tool: JS payload measurer |
| `summarize-lighthouse.mjs`                 | Tool: Lighthouse summarizer |

To re-capture (post-phase comparison), run from project root:

```powershell
curl.exe -s -o "post/post-home.html" https://saasstatshub.com/
curl.exe -s -o "post/post-article.html" https://saasstatshub.com/analytics/saas-market-size-statistics/
curl.exe -s -o "post/post-pagefind-entry.json" https://saasstatshub.com/pagefind/pagefind-entry.json
node baseline/extract-head.mjs            # adapt to point at post/* files
node baseline/measure-js-payload.mjs       # adapt to point at post-home.html
npx --yes lighthouse@12 https://saasstatshub.com/ --preset=desktop --output=json --output-path=post/lh-home-desktop --quiet --no-enable-error-reporting
# (repeat for mobile + article × desktop/mobile)
node baseline/summarize-lighthouse.mjs    # adapt to point at post/lh-*
```

Then diff the post/* artifacts against baseline/* artifacts.

---

*Captured by automated tooling. Do not modify above values.*


---

## Appendix: Task 2 Dependency Snapshot (recorded 2026-05-17)

Task 2 added two npm dependencies to `package.json`:

| Package | Version | node_modules size (uncompressed) | Production bundle impact |
|---------|--------:|---------------------------------:|--------------------------|
| `lucide` | ^1.16.0 | 20,580,693 B (~19.6 MB) | **Tree-shaken** — Task 3's `Icon.astro` imports only the ~16 icons we actually use, so the production JS bundle grows by ≪ 19 MB. The 8 KB gz icon-payload budget (Req 4.5) is still the binding constraint, not node_modules size. |
| `@fontsource-variable/fraunces` | ^5.2.9 | 1,924,547 B (~1.8 MB) | **Build-time copy only** — `scripts/copy-fonts.mjs` (run via `prebuild`) copies one woff2 file (`fraunces-latin-opsz-normal.woff2`, 67,304 bytes) to `public/fonts/fraunces-variable-latin.woff2`. The package itself is never bundled into the user-facing JS. |

`prebuild` script added:

```json
"prebuild": "node scripts/copy-fonts.mjs"
```

Build verification (post-Task-2):

- `npm run build` exit code: **0**
- Pages built: **20**
- Pagefind index: **3 pages** (parity with baseline)
- Build duration: **~24 s**
- `dist/_astro/*.js` chunks: 1 (no `lucide` references — expected, Icon.astro lands in Task 3)
- `dist/fonts/fraunces-variable-latin.woff2` shipped: **67,304 bytes**
