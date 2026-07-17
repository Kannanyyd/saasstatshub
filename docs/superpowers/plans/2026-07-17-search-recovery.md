# Search Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recover search signals lost to retired URLs, focus crawl and indexing on the strongest live pages, improve only proven CTR opportunities, and establish a fresh monitoring baseline without publishing more articles.

**Architecture:** Keep WordPress as the editorial source and Astro/Cloudflare Pages as the delivery layer. Static redirect rules preserve retired URLs with existing search demand, a tracked priority manifest records the pages selected from GSC, and existing build/audit scripts verify the resulting static site before deployment.

**Tech Stack:** Astro 6, Node.js 22, WordPress/WP-CLI, Cloudflare Pages, IndexNow, Google Search Console.

## Global Constraints

- Work on the existing `main` branch as authorized by the user.
- Do not publish new articles or republish quarantined drafts.
- Do not redirect unrelated retired pages to generic category pages solely to hide 404s.
- Preserve all live slugs and canonical URLs.
- Do not re-edit pages changed on 2026-07-12 through 2026-07-15 until their post-change GSC window is measurable.
- Use only accurate, source-scoped titles and descriptions; no unsupported numbers, testing claims, or superlatives.
- Do not resubmit an unchanged sitemap or repeatedly request indexing for unchanged URLs.
- Leave the two unrelated untracked remediation scripts untouched.

---

### Task 1: Recover High-Impression Retired URLs

**Files:**
- Modify: `public/_redirects`
- Create: `src/lib/search-redirects.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: Current public routes and the GSC high-impression URL audit.
- Produces: Stable 301 mappings from retired URLs with real search demand to the closest live equivalent.

- [ ] **Step 1: Add a failing redirect regression test**

Create a Node test that reads `public/_redirects`, resolves the effective rule for `/analytics/cloud-computing-market-size-2026/`, and expects:

```text
/analytics/cloud-computing-market-size-2026/ /analytics/cloud-computing-statistics-2026/ 301
```

The test must also verify that the slashless form has the same destination.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```powershell
node --test --experimental-strip-types src/lib/search-redirects.test.mjs
```

Expected: failure because the category-qualified retired URL currently returns 404.

- [ ] **Step 3: Add only evidence-backed redirect rules**

Add the cloud market-size mapping above. Add any other mapping only when the GSC audit confirms the retired URL had impressions and a closely equivalent live page exists.

- [ ] **Step 4: Run the focused test**

Run:

```powershell
node --test --experimental-strip-types src/lib/search-redirects.test.mjs
```

Expected: all tests pass.

- [ ] **Step 5: Add the test to `test:phase1` and run the suite**

Run:

```powershell
npm.cmd run test:phase1
```

Expected: zero failures.

- [ ] **Step 6: Commit the recovery milestone**

Commit only the redirect, test, and package script changes with:

```text
Recover search signals from retired URLs
```

---

### Task 2: Create the Search Priority Manifest

**Files:**
- Create: `docs/seo/search-priority-pages-2026-07.csv`
- Create: `docs/seo/search-recovery-baseline-2026-07-17.md`
- Create: `scripts/audit-search-priority-pages.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: GSC 7-day, 28-day, and 3-month metrics captured on 2026-07-17.
- Produces: A 30-page manifest and a reproducible HTTP/canonical/title/meta audit.

- [ ] **Step 1: Record the current GSC baseline**

Record these verified dashboard values:

```text
7 days: 0 clicks, 113 impressions, 0% CTR, position 13.2
28 days: 0 clicks, 660 impressions, 0% CTR, position 10.7
3 months: 7 clicks, 4,462 impressions, 0.2% CTR, position 17.1
Index snapshot 2026-07-10: 136 indexed, 1,899 not indexed, 1,862 discovered-not-indexed
Sitemap read 2026-07-17: success, 1,758 discovered URLs
External links: 1 low-quality referring link
```

- [ ] **Step 2: Build a 30-page priority CSV**

Each row must contain:

```text
url,window,clicks,impressions,position,http_status,priority,action,review_after
```

Use this exact GSC-derived pool. Metrics without an explicit suffix are from
the three-month window ending 2026-07-15:

```text
/project-management/jira-vs-notion-vs-trello/,3m,3,61,11.7
/analytics/saas-market-size-statistics-2026/,3m,1,279,11.2
/hr/saas-sales-rep-salary/,3m,1,110,10.8
/project-management/devops-statistics-2026/,3m,1,34,9.3
/analytics/business-intelligence-statistics-2026/,3m,1,12,1.8
/analytics/ai-saas-statistics-2026/,3m,0,633,8.6
/crm/zoho-vs-freshsales-vs-close/,3m,0,566,7.8
/analytics/state-of-saas-2026-annual-report/,3m,0,421,7.6
/crm/best-crm-small-business/,3m,0,264,37.7
/security/cybersecurity-statistics-2026/,3m,0,212,8.8
/ecommerce/ecommerce-statistics-2026/,3m,0,191,8.8
/,3m,0,145,10.1
/crm/salesforce-vs-hubspot-vs-pipedrive/,3m,0,135,33.7
/about/,3m,0,127,3.4
/saas-pricing-calculator/,3m,0,119,54.6
/crm/salesforce-vs-zoho/,3m,0,118,52.4
/hr/saas-founder-salary/,3m,0,98,19.6
/categories/hr/,3m,0,78,7.4
/categories/crm/,3m,0,75,50.4
/ecommerce/stripe-vs-paypal-vs-square/,3m,0,73,42.6
/categories/marketing/,3m,0,71,60.1
/communication/slack-vs-teams-vs-zoom/,3m,0,68,10.5
/crm/small-business-crm-statistics-2026/,3m,0,62,4.6
/ecommerce/bigcommerce-statistics-2026/,3m,0,62,8.4
/hr/best-hr-software-small-business/,3m,0,61,13.0
/ecommerce/amazon-fba-statistics-2026/,3m,0,52,6.2
/analytics/mixpanel-vs-amplitude-vs-google-analytics/,3m,0,51,17.0
/analytics/best-bi-tools/,3m,0,51,31.7
/hr/hr-hcm-statistics-2026/,3m,0,49,5.7
/analytics/cloud-computing-market-size-2026/,28d,0,41,8.4
```

Select live, source-reviewed pages with impressions and useful search intent.
Keep About, homepage, category pages, and redirected retired pages as
`monitor_only`; they are excluded from immediate CTR edits. Pages modified on
2026-07-12 through 2026-07-15 are also `monitor_only` until the stated review
date.

- [ ] **Step 3: Implement the manifest audit**

The script must:

```text
read the CSV
request every URL without silently accepting HTTP errors
report final URL, status, title length, description length, canonical URL
fail for priority pages that return 4xx/5xx
fail when a 200 page has a mismatched canonical
write artifacts/search-priority-audit.json
```

- [ ] **Step 4: Run the audit**

Run:

```powershell
npm.cmd run seo:audit-priority
```

Expected: all selected live pages return 200 with matching canonicals; retired rows have an explicit redirect action.

- [ ] **Step 5: Commit the priority-manifest milestone**

Commit the manifest, baseline, audit script, and package script change with:

```text
Track search recovery priority pages
```

---

### Task 3: Apply Safe CTR Improvements

**Files:**
- Create: `scripts/seo-ctr-update-2026-07.php`
- Create: `scripts/seo-ctr-verify-2026-07.php`
- Modify: `docs/seo/search-priority-pages-2026-07.csv`

**Interfaces:**
- Consumes: The priority manifest and the independent CTR audit.
- Produces: Guarded WordPress title/meta changes for pages not recently edited.

- [ ] **Step 1: Select immediate CTR candidates**

Only choose pages meeting all criteria:

```text
live HTTP 200
useful non-navigational intent
GSC impressions present
not modified in the 2026-07-12 through 2026-07-15 SEO passes
current title or description is generic, truncated, or mismatched
```

- [ ] **Step 2: Build a guarded WP-CLI update**

For every selected post, the PHP script must verify the expected post ID, slug, current title, and current excerpt/meta before changing anything. Abort the entire update when a guard does not match. Back up affected rows before the update.

- [ ] **Step 3: Verify the script without mutation**

Run PHP lint locally or remotely and execute the verification script first. Expected output must list every intended post and zero guard failures.

- [ ] **Step 4: Apply the guarded update**

Run through WP-CLI on the production WordPress server. Do not touch post content, slugs, publication status, categories, or source fields.

- [ ] **Step 5: Verify WordPress values**

Run the verification script and require exact matches for all updated titles and descriptions.

- [ ] **Step 6: Update the priority CSV**

Mark edited pages as `ctr_updated` with `review_after=2026-07-31`. Mark recently edited pages as `monitor_only` with `review_after` between 2026-07-22 and 2026-07-29.

---

### Task 4: Build, Validate, Commit, and Deploy

**Files:**
- Modify: `WEB1/SEO/plans/current-project-status-2026-07-02.md`

**Interfaces:**
- Consumes: Redirect and WordPress changes.
- Produces: A verified Cloudflare Pages production deployment and durable project record.

- [ ] **Step 1: Run unit tests**

Run:

```powershell
npm.cmd run test:phase1
```

Expected: zero failures.

- [ ] **Step 2: Build the complete static site**

Run:

```powershell
npm.cmd run build
```

Expected: Astro build succeeds and Pagefind indexes the live article corpus.

- [ ] **Step 3: Run link and priority audits**

Run:

```powershell
npm.cmd run audit:links
npm.cmd run seo:audit-priority
```

Expected: zero orphan or weakly linked content pages and no failing priority URL.

- [ ] **Step 4: Commit and push**

Commit only task-related files, preserve unrelated untracked files, and push `main` to `origin`.

- [ ] **Step 5: Deploy the exact verified build**

Run:

```powershell
npx.cmd wrangler pages deploy dist --project-name saasstatshub-git
```

Expected: Cloudflare reports a successful deployment URL.

- [ ] **Step 6: Verify production**

Check:

```text
the recovered cloud market-size URL returns 301 to the live cloud statistics page
all immediate CTR candidates return 200
live title, description, H1, canonical, robots meta, and structured data match expectations
sitemap-index.xml and sitemap-0.xml return 200
```

---

### Task 5: Notify Search Engines and Record the Monitoring Window

**Files:**
- Modify: `docs/seo/search-recovery-baseline-2026-07-17.md`
- Modify: `WEB1/SEO/plans/current-project-status-2026-07-02.md`

**Interfaces:**
- Consumes: The production deployment and priority manifest.
- Produces: Search-engine notifications and dated follow-up checkpoints.

- [ ] **Step 1: Submit changed URLs to IndexNow**

Run `npm.cmd run seo:indexnow --` with only changed production URLs. Expected response: HTTP 200 or 202.

- [ ] **Step 2: Use GSC URL Inspection for the highest-value changed pages**

Request indexing only for changed, live priority pages. Do not submit unchanged URLs repeatedly and do not resubmit the already successful sitemap.

- [ ] **Step 3: Record checkpoints**

Add checkpoints for:

```text
2026-07-22: first post-change performance check
2026-07-29: indexing and CTR decision point
2026-07-31: immediate CTR candidate review
```

- [ ] **Step 4: Record external-authority work**

Document that GSC currently recognizes one low-quality external link. Use the existing Research Data page, research CSV, State of SaaS report, calculator, and public GitHub repository as the linkable assets. Do not claim backlinks that were not actually obtained.

- [ ] **Step 5: Final verification**

Re-run:

```powershell
git status --short
git log -5 --oneline
npm.cmd run test:phase1
npm.cmd run seo:audit-priority
```

Confirm production URLs and GSC actions before reporting completion.
