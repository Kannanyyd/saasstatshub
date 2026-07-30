# URL Consolidation Decisions - 2026-07-31

## Scope

The index-value audit identified 25 pages in 13 same-intent groups. Each group
was reviewed using available GSC demand, URL stability, rendered word count,
linked sources, incoming internal links, modification date, and normalized
paragraph reuse.

## Decision rules

1. Preserve the URL with demonstrated GSC demand.
2. Otherwise prefer an evergreen URL over a year-bound URL when content depth is comparable.
3. Prefer the more distinct and complete page when neither URL has demand.
4. Redirect only same-intent pages; do not merge glossary and buyer-guide intent.

## Decisions

| Retired URL | Canonical URL | Primary reason |
| --- | --- | --- |
| `/ai/best-ai-tools-for-customer-service/` | `/ai/best-ai-customer-service-tools/` | Destination is longer and less repetitive |
| `/ai/best-ai-tools-for-sales/` | `/ai/best-ai-sales-tools/` | Destination is longer and less repetitive |
| `/ai/claude-vs-chatgpt/` | `/ai/chatgpt-vs-claude/` | Same comparison; conventional query order |
| `/crm/pipedrive-vs-hubspot/` | `/crm/hubspot-vs-pipedrive/` | Same comparison; destination is longer |
| `/devops/best-ci-cd-tools-2027/` | `/devops/best-ci-cd-tools/` | Evergreen and less repetitive |
| `/ecommerce/shopify-vs-woocommerce-2026/` | `/ecommerce/woocommerce-vs-shopify/` | Evergreen comparison URL |
| `/hospitality/hotel-revenue-management/` | `/hospitality/hotel-revenue-management-strategies/` | Longer and less repetitive |
| `/hr/best-hr-software-for-small-business/` | `/hr/best-hr-software-small-business/` | Canonical has 61 GSC impressions at position 13 |
| `/marketing/best-email-marketing-platforms-2026/` | `/marketing/best-email-marketing-software/` | Evergreen buyer-guide URL |
| `/marketing/best-marketing-automation-software-2026/` | `/marketing/best-marketing-automation-tools/` | Evergreen buyer-guide URL |
| `/project-management/best-project-management-software-2026/` | `/project-management/best-project-management-tools/` | Evergreen buyer-guide URL |
| `/real-estate/what-is-property-management-software-2027/` | `/real-estate/what-is-property-management-software/` | Evergreen definition URL |
| `/security/best-security-awareness-training-2027/` | `/security/best-security-awareness-training/` | Current evergreen buyer-guide URL |

## Release behavior

- Retired routes are omitted from the static build, sitemap, RSS feed, category
  archives, related-article pools, pinned lists, and machine-readable catalogs.
- Both slash and no-slash variants return HTTP 301.
- WordPress posts remain unchanged in this release so the consolidation is
  reversible while search signals settle.
- Review redirects and GSC indexing after 14 days.

## Validation

- Full production build completed with 1,746 static routes.
- Pagefind indexed 1,694 content pages.
- All 13 retired routes are absent from the build, sitemap, research catalog,
  and rendered internal links.
- All 13 destination routes are present in the build and sitemap.
- Priority-page audit: 30/30 passed.
- Internal-link audit: 0 orphan pages and 0 weakly linked pages.
- Post-consolidation index-value audit: 0 possible consolidation candidates.
