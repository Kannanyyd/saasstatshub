# Search Stability Monitor - 2026-08-12

This is the fixed baseline for the August 12-15 stability window. During this window, do not bulk-edit articles, resubmit the full sitemap, or submit the full URL inventory through IndexNow. Only production outages, new 5xx responses, broken canonical tags, or confirmed internal 404s justify an immediate change.

## Search baseline

Google Search Console data was last updated on August 9, 2026.

| Window | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| 7 days | 0 | 48 | 0% | 13.8 |
| 28 days | 0 | 290 | 0% | 15.6 |
| 3 months | 7 | 4,695 | 0.1% | 17.1 |

Google indexing baseline:

- Indexed pages: 127.
- Not indexed: 1,680 across five active reasons.
- Discovered, currently not indexed: 1,635.
- Not found (404): 39 historical reports.
- Redirect pages: 5 historical reports.
- Sitemap index last read successfully on August 11 with 1,625 discovered URLs.
- External links reported by GSC: 0.
- Internal links reported by GSC: 3,027.

Bing baseline:

- Search performance: 9 clicks, 82 impressions, and 10.98% CTR over three months.
- Indexed URLs: 707; warnings: 38; errors: 0; excluded: 371.
- Sitemap status: success, with 1,625 URLs in the child sitemap. Bing's 3.3K total is an aggregate that can double-count the index and child sitemap.
- AI Performance: 572 sampled citations across 17 grounding queries.
- Backlinks: one referring domain and one referring page, from `zigpoll.com`.
- IndexNow: the August 8 full submission and the 13 targeted follow-up URLs are visible in Bing.

## Priority monitor set

Keep this set unchanged through August 15 so comparisons use the same pages:

1. `https://saasstatshub.com/hr/saas-sales-rep-salary/`
2. `https://saasstatshub.com/analytics/saas-market-size-statistics-2026/`
3. `https://saasstatshub.com/analytics/state-of-saas-2026-annual-report/`
4. `https://saasstatshub.com/crm/crm-software-statistics-2026/`
5. `https://saasstatshub.com/saas-pricing-calculator/`
6. `https://saasstatshub.com/security/cybersecurity-statistics-2026/`
7. `https://saasstatshub.com/ecommerce/ecommerce-statistics-2026/`
8. `https://saasstatshub.com/crm/zoho-vs-freshsales-vs-close/`

Current GSC signals worth preserving:

- `saas-sales-rep-salary`: 46 impressions over 28 days and 3 over 7 days.
- Retired `cloud-computing-market-size-2026`: 38 impressions over 28 days and 15 over 7 days. Its production redirect is healthy; allow Google time to transfer signals.
- `zoho-vs-freshsales-vs-close`: 25 impressions over 28 days.
- `ecommerce-statistics-2026`: 21 impressions over 28 days and 4 over 7 days.
- `cybersecurity-statistics-2026`: 17 impressions over 28 days and 5 over 7 days.
- `saas-market-size-statistics-2026`: 8 impressions over 28 days.

## Production verification

Verified on August 12:

- Homepage, five priority category pages, and all eight priority pages return HTTP 200.
- All eight priority pages are present in `sitemap-0.xml`.
- The sitemap index resolves to one child sitemap containing 1,625 URLs.
- `robots.txt` allows normal crawling and excludes `/api/`, `/cdn-cgi/`, and known query-parameter variants.
- Salary, market-size, and calculator pages have self-referencing canonical URLs.
- Salary page exposes Article, FAQPage, and BreadcrumbList structured data.
- Market-size page exposes Article, Dataset, and BreadcrumbList structured data.
- Calculator exposes WebApplication structured data.
- The seven monitored retired routes return one 301 followed by HTTP 200.
- Search-priority audit result: 30/30 passed.
- Latest GitHub CI run for production commit `e1ec7d0` completed successfully.

## Change gates

Make an immediate technical change only when one of these occurs:

- A priority URL returns 4xx or 5xx instead of 200.
- A monitored retired route stops returning a single 301 to a 200 target.
- The sitemap cannot be fetched or loses a priority URL.
- A priority page loses its self-referencing canonical or expected JSON-LD type.
- GitHub CI or the production deployment fails.

Wait until the August 15-16 review before changing titles, descriptions, internal-link prominence, or index directives. At that review:

- Optimize a title only if a page has at least 20 impressions in the latest 28-day window, zero clicks, and average position between 4 and 20.
- Add internal-link support only if the page is canonical, indexed, relevant to the linking page, and average position is between 8 and 25.
- Do not judge the August 8 redirect work until GSC contains at least seven complete post-deployment days.
- Do not submit the full sitemap or full IndexNow URL set again. Submit only materially changed canonical URLs.
- Treat external authority as the primary non-technical constraint while GSC reports zero external links.

## Next checkpoint

Recheck on August 15 or 16 using the same 7-day, 28-day, and 3-month windows. Record deltas for impressions, clicks, average position, indexed pages, discovered-not-indexed pages, Bing indexed URLs, Bing AI citations, and referring domains before approving any second-stage page edits.
