# Noindex Decisions - Batch 3 - 2026-07-31

## Scope

This release adds 30 reviewed template pages to the reversible index-exclusion
manifest. Every selected page had zero recorded GSC impressions, zero linked
sources, and normalized paragraph reuse of 81% after Batch 2.

The batch covers nine categories. DevOps, Finance, and Marketing contribute
four pages each; the other six categories contribute three pages each. No page
is deleted, redirected, or unpublished in WordPress.

## Selected pages

### CRM

- `/crm/crm-roi-calculator-template/`
- `/crm/crm-success-metrics-template/`
- `/crm/crm-training-plan-template/`

### DevOps

- `/devops/documentation-template/`
- `/devops/incident-postmortem-template/`
- `/devops/infrastructure-audit-checklist/`
- `/devops/monitoring-setup-template/`

### Ecommerce

- `/ecommerce/shipping-calculator-template/`
- `/ecommerce/store-launch-checklist/`
- `/ecommerce/supplier-evaluation-template/`

### Finance

- `/finance/cash-flow-template/`
- `/finance/financial-projection-template/`
- `/finance/invoice-template/`
- `/finance/payroll-calculator-template/`

### HR

- `/hr/hr-compliance-checklist/`
- `/hr/interview-question-template/`
- `/hr/job-description-template/`

### Marketing

- `/marketing/lead-generation-checklist/`
- `/marketing/marketing-budget-template/`
- `/marketing/marketing-calendar-template/`
- `/marketing/marketing-campaign-template/`

### Project Management

- `/project-management/project-charter-template/`
- `/project-management/project-closure-template/`
- `/project-management/project-timeline-template/`

### Sales

- `/sales/sales-playbook-template/`
- `/sales/sales-script-template/`
- `/sales/sales-training-checklist/`

### Security

- `/security/security-awareness-template/`
- `/security/security-policy-template/`
- `/security/security-training-checklist/`

## Release behavior

- All URLs remain available and followable.
- Pages emit `noindex, follow`.
- Pages are omitted from XML sitemaps and the public research catalog.
- Existing internal links remain available to visitors.
- A source-backed, materially distinct rewrite can be restored by removing its
  manifest entry and rebuilding the site.

## Monitoring

Review GSC indexing and crawl status after 14 days. Do not request manual
indexing for these URLs while the exclusion is active.

## Validation

- Production build completed with 1,747 Astro pages.
- All 85 cumulative exclusions emit `noindex, follow`.
- All 30 Batch 3 pages remain available in the static build.
- No excluded URL appears in the sitemap or public research catalog.
- A control article still emits the normal `index, follow` directive.
- Research catalog contains 1,609 indexable article records.
- Priority-page audit: 30/30 passed.
- Internal-link audit: 0 orphan pages and 0 weakly linked pages.
- Post-Batch-3 audit: 1,609 indexable pages, 85 excluded pages, and 36
  remaining high-confidence noindex-review candidates.
