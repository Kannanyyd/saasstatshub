# Noindex Decisions - 2026-07-31

## Scope

This release applies a reversible `noindex, follow` directive to 25 reviewed
pages. Every selected page had zero recorded GSC impressions, no linked
sources, and normalized paragraph reuse of at least 84% in the July 31 index
value audit.

No page is deleted or redirected. WordPress publication status and content are
unchanged.

## Selected pages

### Repeated implementation guides (85% paragraph reuse)

- `/ai/ai-ethics-framework/`
- `/analytics/predictive-analytics-guide/`
- `/communication/video-conferencing-etiquette/`
- `/crm/crm-automation-guide/`
- `/devops/kubernetes-optimization/`
- `/ecommerce/ecommerce-personalization-guide/`
- `/finance/financial-forecasting-guide/`
- `/hr/employee-retention-strategies/`
- `/legal/contract-lifecycle-management/`
- `/marketing/marketing-attribution-guide/`
- `/nonprofit/nonprofit-sustainability-guide/`
- `/project-management/project-risk-management/`
- `/real-estate/property-valuation-tools/`
- `/sales/sales-enablement-guide/`
- `/security/zero-trust-architecture/`

### Premature 2027 trend pages (84% paragraph reuse)

- `/ai/ai-adoption-trends-2027/`
- `/analytics/saas-pricing-trends-2027/`
- `/devops/devops-trends-2027/`
- `/ecommerce/ecommerce-trends-2027/`
- `/finance/fintech-trends-2027/`
- `/healthcare/healthcare-technology-trends-2027/`
- `/hr/hr-technology-trends-2027/`
- `/marketing/marketing-technology-trends-2027/`
- `/real-estate/real-estate-technology-trends-2027/`
- `/security/cybersecurity-threats-2027/`

## Release behavior

- Pages remain available to visitors at their existing URLs.
- Pages emit `<meta name="robots" content="noindex, follow">`.
- Pages are omitted from XML sitemaps and the public research catalog.
- Existing internal links remain followable.
- A page can return to the index after a source-backed, materially distinct
  rewrite and removal from `src/data/index-exclusions.json`.

## Monitoring

Check GSC indexing after 14 days. Do not request manual indexing for these
pages while the exclusion is active.

## Validation

- Production build completed with 1,746 static routes.
- All 25 selected pages remain available in the build.
- All 25 selected pages emit `noindex, follow`.
- All 25 selected pages are absent from the sitemap and research catalog.
- A control article still emits the normal `index, follow` directive.
- Research catalog contains 1,669 indexable article records.
- Priority-page audit: 30/30 passed.
- Internal-link audit: 0 orphan pages and 0 weakly linked pages.
- Post-release audit: 1,669 indexable pages, 25 excluded pages, and 96 remaining
  high-confidence noindex-review candidates.
