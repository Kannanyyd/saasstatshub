# Search Opportunity Round - 2026-08-08

This round concentrates internal authority on pages that already have Google Search Console impressions and replaces unsupported compensation claims on the strongest new query opportunity. It does not add new articles or expand the indexable page count.

## GSC baseline

Latest available data through August 5, 2026:

- Last 7 days: 53 impressions, 0 clicks, 0% CTR, average position 12.1.
- Last 28 days: 318 impressions, 0 clicks, 0% CTR, average position 14.9.
- Last 3 months: 4,667 impressions, 7 clicks, 0.1% CTR, average position 17.0.
- Indexed pages: 127.
- Discovered, currently not indexed: 1,635.
- External links reported by GSC: 0.

The sitemap is current and Google reports successful discovery. The primary constraints are crawl priority, content selectivity, and external authority rather than sitemap submission.

## Changes

### Internal priority links

- Added a six-article Featured Research section to the homepage using canonical URLs only.
- Added compact Featured Research links to Analytics, CRM, E-commerce, Security, and HR category pages.
- Selected pages from current GSC page-level demand rather than publication recency.
- Excluded the retired `cloud-computing-market-size-2026` route after confirming that it redirects to `cloud-computing-statistics-2026`.

### SaaS sales representative salary

URL: `https://saasstatshub.com/hr/saas-sales-rep-salary/`

- Preserved the URL, title, excerpt, and existing search history.
- Replaced unsupported salary bands, geographic ratios, equity percentages, commission ranges, and sales-cycle assertions.
- Added a 1,281-word evidence-scoped article using RepVue role data, Salesforce's OTE definition, and BLS occupational wage context.
- Added six Quick Overview items, five Key Takeaways, four direct sources, methodology limitations, and offer-evaluation guidance.
- Explicitly distinguishes base salary, OTE, actual earnings, platform data, and broad federal occupation data.

## Monitoring plan

- Submit the homepage, five category pages, and the salary page through IndexNow after deployment.
- Compare the salary page's impressions and position after 14 and 28 days.
- Compare impressions for the six homepage-priority pages after 14 days.
- Do not request indexing for large batches of generic pages; use GSC URL inspection only for a small set of materially revised canonical URLs.
- The next non-technical growth priority is earning relevant external citations. GSC currently reports no external links, and code changes alone cannot solve that authority gap.

## Bing technical follow-up

Baseline observed in Bing Webmaster Tools on August 8, 2026:

- Search performance over three months: 9 clicks, 82 impressions, 10.98% CTR.
- Site Explorer: 707 indexed URLs, 38 warnings, and 371 excluded URLs.
- AI Performance: 572 citations across 16 sampled pages.
- Backlinks: 2 referring domains and 2 referring pages.
- Bing's sitemap report was stale at 20 discovered URLs even though the live sitemap contains 1,625 canonical URLs.

Actions completed:

- Reordered all four dynamic Cloudflare redirect rules after the 1,348 static rules, as required by the Pages redirect parser.
- Added a regression test that prevents future static rules from being placed after dynamic rules.
- Verified production 301 responses for legacy routes sampled near the beginning, middle, and end of `_redirects`.
- Limited generated search titles to 65 characters while leaving visible article headings unchanged.
- Resubmitted `sitemap-index.xml` and `sitemap-0.xml` in Bing Webmaster Tools on August 8.
- Submitted all 1,625 canonical sitemap URLs through IndexNow; the API returned HTTP 200 and Bing reported 1.6K URLs received in the current four-hour window.
- Completed Bing Site Scan `Production technical scan 2026-08-08`: 1,000 pages scanned, 6 errors, and 0 warnings. All six errors were HTTP 4xx findings.
- Traced five article 404s to retired WordPress posts that were absent from GraphQL, the research catalog, and the sitemap while legacy links still referenced them.
- Added direct 301 recovery routes to the closest live canonical research pages and updated the internal-link rules, pricing calculator source, and publication scripts that produced the stale links.
- Added recovery coverage for an additional retired employee-benefits URL found during the same investigation.
- Added `Disallow: /cdn-cgi/` to `robots.txt` for the sixth finding, Cloudflare's managed email-protection endpoint, following Cloudflare's crawler guidance.

Recheck the sitemap discovery count, Site Scan findings, search impressions, and AI citations after Bing processes the fixes. Do not resubmit the same full URL set daily; use IndexNow for material changes and new canonical pages.
