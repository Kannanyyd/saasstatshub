# Search Recovery Baseline - 2026-07-17

This document records the pre-recovery Google Search Console baseline for
SaaSStatsHub. It is a monitoring snapshot, not a forecast.

## Performance

| Window | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| 7 days | 0 | 113 | 0% | 13.2 |
| 28 days | 0 | 660 | 0% | 10.7 |
| 3 months | 7 | 4,462 | 0.2% | 17.1 |

The performance windows end on 2026-07-15. Page-level metrics in
`search-priority-pages-2026-07.csv` use the three-month window unless the row
explicitly says `28d`.

## Indexing And Discovery

- Index snapshot date: 2026-07-10.
- Indexed pages: 136.
- Not indexed: 1,899.
- Discovered, currently not indexed: 1,862.
- `sitemap-index.xml` status on 2026-07-17: success.
- URLs discovered through the sitemap: 1,758.

## External Authority

Google Search Console recognized one external referring link. The referring
source was low quality, so it is not treated as meaningful authority or as a
successful outreach result.

## Priority Selection Rules

The tracked pool contains the 30 GSC pages specified in the recovery plan.
Navigation pages, category pages, and retired URLs are marked `monitor_only`
or with an explicit `redirect_to:` action. Pages changed during the
2026-07-12 through 2026-07-15 SEO passes remain under observation until their
review date.

On 2026-07-17, guarded title and description updates were applied to 10 pages
whose search snippets were generic, duplicated, or excessively long. The
affected rows are marked `ctr_updated` and will be reviewed on 2026-07-31.
The update changed no article body, slug, category, source field, or
publication status.

## Audit Contract

Run the reproducible audit with:

```powershell
npm.cmd run seo:audit-priority
```

The audit writes `artifacts/search-priority-audit.json`. A live page passes
only when it returns HTTP 200 and declares the expected canonical URL. A
redirect row passes only when its first response matches the expected status
and `Location`, and the final destination resolves successfully with a
matching canonical.

## Review Checkpoints

- 2026-07-22: first post-change performance and redirect check.
- 2026-07-29: indexing and monitored-page decision point.
- 2026-07-31: review any pages that receive a guarded CTR update.

## Production Execution

- Four retired, intent-matched URLs now have tested 301 mappings. The
  production priority audit passed 30 of 30 rows after deployment.
- Ten pages received guarded title and/or description updates. A WordPress
  database backup was created at
  `/root/saasstatshub-pre-seo-ctr-20260717.sql` before mutation.
- The production build generated 1,759 pages and indexed 1,707 content pages
  with Pagefind. The internal-link audit found zero orphan pages and zero
  weakly linked pages.
- Cloudflare Pages deployment `56206700.saasstatshub-git.pages.dev` completed
  successfully.
- IndexNow accepted the 14 changed URLs with HTTP 200.
- Google Search Console accepted indexing requests for the 10 changed live
  pages. The successful sitemap was not resubmitted.
- GSC still recognizes only one low-quality external referring link. Existing
  linkable assets include the Research Data page and CSV, State of SaaS report,
  SaaS pricing calculator, and public GitHub repository. No unearned backlink
  is claimed.
