# GSC Opportunity Update - 2026-07-30

## Performance baseline

Google Search Console data available through 2026-07-28:

| Window | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| 7 days | 0 | 70 | 0% | 19.2 |
| 28 days | 0 | 462 | 0% | 13.3 |
| 3 months | 7 | 4,602 | 0.2% | 17.1 |

The site is receiving impressions, but several pages ranking on or near the
first results page have no clicks. The immediate opportunity is improving
snippet relevance and page consistency, not publishing more URLs.

## Indexing baseline

The Page indexing report was last updated on 2026-07-24:

- Indexed: 137
- Not indexed: 1,685
- Discovered - currently not indexed: 1,647
- Crawled - currently not indexed: 1
- Not found (404): 29
- Page with redirect: 5
- Blocked by robots.txt: 3

The sitemap was read successfully on 2026-07-29 and contained 1,758 discovered
URLs. Repeated sitemap submission is not required.

## Changes made

1. Added a missing permanent redirect from
   `/marketing/fintech-statistics-2026/` to the live FinTech statistics page.
2. Shortened and clarified search titles for AI SaaS, cybersecurity, Zoho CRM
   comparison, and the State of SaaS report.
3. Replaced stale ACF summaries, takeaways, and FAQs on three rewritten pages
   so visible content and structured data describe the same article.
4. Restricted Dataset schema to statistics URLs. Narrative annual reports now
   use Article schema without exposing stale metric fields.
5. Added a regression test for the Dataset schema routing rule.

## Priority pages

| Page | 3-month impressions | Position | Action |
| --- | ---: | ---: | --- |
| AI SaaS statistics | 633 | 8.6 | Search title updated |
| Zoho vs Freshsales vs Close | 571 | 7.8 | Title and ACF fields updated |
| State of SaaS report | 422 | 7.6 | Title, excerpt, ACF, and schema updated |
| Best CRM for small business | 264 | 37.7 | Stale ACF fields replaced |
| Cybersecurity statistics | 218 | 8.7 | Search title updated |

## Review rule

Review these pages again on or after 2026-08-13. Compare clicks, CTR, and
impressions using the same 14-day period. Avoid another title rewrite before
enough post-change data has accumulated.

## Validation and release

- Astro build: 1,759 pages generated successfully
- Pagefind: 1,707 content pages indexed
- Priority-page audit: 30/30 passed
- Internal-link audit: 0 orphan pages and 0 weakly linked pages
- Automated tests: 94/94 passed
- Production deployment: `08944a8e.saasstatshub-git.pages.dev`
- Production checks: five changed pages returned HTTP 200
- Redirect check: the missing FinTech URL returned HTTP 301 to the live page
- IndexNow: six changed URLs accepted with HTTP 200
