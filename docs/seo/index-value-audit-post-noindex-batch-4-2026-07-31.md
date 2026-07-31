# Index Value Audit - 2026-07-31

## Scope

This audit evaluates 1573 built content pages. It uses rendered word count,
linked source count, heading and FAQ presence, incoming internal links, normalized
paragraph reuse, title similarity, and the current GSC priority manifest.
It excludes 121 reviewed pages that already emit a robots noindex directive.

It does not change publication state, sitemap inclusion, canonical tags, or robots
directives. Every recommendation requires editorial review.

## Results

| Classification | Pages | Meaning |
| --- | ---: | --- |
| Keep | 615 | No current quality or duplication threshold triggered |
| Enhance | 752 | Search demand or a remediable quality/evidence gap |
| Consolidate review | 0 | Possible same-category topic overlap |
| Noindex review | 206 | Thin or highly repeated page requiring manual review |

High-confidence noindex-review candidates: 0.
Possible consolidation candidates: 0.

## Important findings

- 22 pages have recorded demand in the current GSC priority manifest.
- 490 statistics, comparison, buyer-guide, or report pages have fewer than two linked sources.
- 0 pages have a body below 450 words or normalized paragraph reuse of at least 80%.
- 0 pages belong to possible same-intent consolidation pairs.

### High-confidence review candidates by category

| Category | Pages |
| --- | ---: |
| None | 0 |

## Safe execution order

1. Enhance GSC-demand pages first; do not change their URLs.
2. Manually compare every consolidation pair before selecting a canonical page.
3. Review high-confidence noindex candidates for useful facts, links, or backlinks.
4. Only after review, merge or noindex pages in small batches and monitor GSC.

## Guardrails

- No URL is automatically deleted, redirected, or marked noindex.
- A low word count alone is not treated as proof of low value.
- A title-similarity match is a review lead, not a duplicate-content verdict.
- IndexNow should only receive URLs that are actually changed after review.

Full row-level evidence is in `index-value-audit-post-noindex-batch-4-2026-07-31.csv`.
