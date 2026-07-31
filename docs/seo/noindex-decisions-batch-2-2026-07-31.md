# Noindex Decisions - Batch 2 - 2026-07-31

## Scope

This release adds 30 reviewed template pages to the reversible index-exclusion
manifest. The selection is balanced across 10 major categories, with three
pages per category.

Every selected page had zero recorded GSC impressions, zero linked sources,
and normalized paragraph reuse of 81% in the post-Batch-1 index-value audit.
No page is deleted, redirected, or unpublished in WordPress.

## Selected pages

### AI

- `/ai/ai-ethics-checklist/`
- `/ai/ai-implementation-checklist/`
- `/ai/ai-use-case-template/`

### CRM

- `/crm/crm-data-migration-checklist/`
- `/crm/crm-evaluation-checklist/`
- `/crm/crm-integration-planning-template/`

### DevOps

- `/devops/capacity-planning-template/`
- `/devops/cicd-pipeline-template/`
- `/devops/deployment-checklist/`

### Ecommerce

- `/ecommerce/inventory-management-template/`
- `/ecommerce/product-listing-template/`
- `/ecommerce/return-policy-template/`

### Finance

- `/finance/accounts-receivable-template/`
- `/finance/audit-preparation-checklist/`
- `/finance/budget-forecast-template/`

### HR

- `/hr/compensation-plan-template/`
- `/hr/employee-handbook-template/`
- `/hr/exit-interview-template/`

### Marketing

- `/marketing/brand-guidelines-template/`
- `/marketing/content-calendar-template/`
- `/marketing/email-marketing-checklist/`

### Project Management

- `/project-management/change-request-template/`
- `/project-management/meeting-agenda-template/`
- `/project-management/project-budget-template/`

### Sales

- `/sales/proposal-template/`
- `/sales/sales-forecast-template/`
- `/sales/sales-pipeline-template/`

### Security

- `/security/access-control-template/`
- `/security/compliance-checklist/`
- `/security/risk-assessment-template/`

## Release behavior

- All 30 URLs remain available and followable.
- The pages emit `noindex, follow`.
- The pages are omitted from XML sitemaps and the public research catalog.
- Existing internal links remain in place for visitors and crawler discovery.
- A materially distinct, source-backed rewrite can be restored to the index by
  removing its manifest entry and rebuilding the site.

## Monitoring

Review GSC indexing and crawl status after 14 days. Do not request manual
indexing for these URLs while the exclusion is active.

## Validation

- Production build completed with 1,747 Astro pages and 1,746 generated route
  log entries.
- All 55 cumulative exclusions emit `noindex, follow`.
- All 30 Batch 2 pages remain available in the static build.
- No excluded URL appears in the sitemap or public research catalog.
- A control article still emits the normal `index, follow` directive.
- Research catalog contains 1,639 indexable article records.
- Priority-page audit: 30/30 passed.
- Internal-link audit: 0 orphan pages and 0 weakly linked pages.
- Post-Batch-2 audit: 1,639 indexable pages, 55 excluded pages, and 66
  remaining high-confidence noindex-review candidates.
