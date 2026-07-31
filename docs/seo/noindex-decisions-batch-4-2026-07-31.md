# Noindex Decisions - Batch 4 - 2026-07-31

## Scope

This final release in the current index-quality phase adds all 36 remaining
high-confidence candidates to the reversible index-exclusion manifest.

Every selected page had zero recorded GSC impressions, zero linked sources,
and normalized paragraph reuse of 81% after Batch 3. The pages are template
content even where the URL classifier labels them as articles, reports, or a
guide. No page is deleted, redirected, or unpublished in WordPress.

## Selected pages

### AI

- `/ai/ai-data-requirements/`
- `/ai/ai-governance-policy/`
- `/ai/ai-readiness-assessment/`
- `/ai/ai-roi-calculator/`
- `/ai/ai-success-metrics/`
- `/ai/ai-training-plan/`
- `/ai/ai-vendor-evaluation/`

### CRM

- `/crm/crm-implementation-timeline/`
- `/crm/crm-requirements-document/`
- `/crm/crm-user-adoption-checklist/`
- `/crm/crm-vendor-comparison-template/`

### DevOps

- `/devops/disaster-recovery-plan/`
- `/devops/release-management-template/`
- `/devops/security-hardening-checklist/`

### Ecommerce

- `/ecommerce/customer-service-script/`
- `/ecommerce/ecommerce-business-plan/`
- `/ecommerce/ecommerce-kpi-dashboard/`
- `/ecommerce/ecommerce-marketing-plan/`

### Finance

- `/finance/expense-report-template/`
- `/finance/financial-report-template/`
- `/finance/tax-preparation-checklist/`

### HR

- `/hr/training-needs-assessment/`

### Marketing

- `/marketing/marketing-report-template/`
- `/marketing/seo-audit-checklist/`
- `/marketing/social-media-calendar/`

### Project Management

- `/project-management/risk-register-template/`
- `/project-management/stakeholder-register/`
- `/project-management/status-report-template/`
- `/project-management/work-breakdown-structure/`

### Sales

- `/sales/commission-calculator/`
- `/sales/objection-handling-guide/`
- `/sales/territory-plan-template/`
- `/sales/win-loss-analysis-template/`

### Security

- `/security/data-breach-response-plan/`
- `/security/incident-response-plan/`
- `/security/vulnerability-assessment-template/`

## Release behavior

- All URLs remain available and followable.
- Pages emit `noindex, follow`.
- Pages are omitted from XML sitemaps and the public research catalog.
- Existing internal links remain available to visitors.
- A source-backed, materially distinct rewrite can be restored by removing its
  manifest entry and rebuilding the site.

## Monitoring

Review GSC indexing and crawl status after 14 days. Do not request manual
indexing for these URLs while the exclusion is active. Future noindex work must
start from a fresh audit rather than extending this completed candidate list.

## Validation

- Production build completed with 1,747 Astro pages.
- All 121 cumulative exclusions emit `noindex, follow`.
- All 36 Batch 4 pages remain available in the static build.
- No excluded URL appears in the sitemap or public research catalog.
- A control article still emits the normal `index, follow` directive.
- Research catalog contains 1,573 indexable article records.
- Priority-page audit: 30/30 passed after one transient fetch retry.
- Internal-link audit: 0 orphan pages and 0 weakly linked pages.
- Final audit: 1,573 indexable pages, 121 excluded pages, and 0 remaining
  high-confidence noindex-review candidates.
