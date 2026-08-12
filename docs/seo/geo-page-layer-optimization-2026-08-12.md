# GEO and SEO Page-Layer Optimization - 2026-08-12

This pass improves how search engines and answer engines identify the site's research content without changing article titles, bodies, URLs, canonicals, redirects, or index directives.

## Changes

- Added `data-nosnippet` to navigation, footer, search, cookie, newsletter, and article CTA boilerplate so generated snippets can concentrate on article evidence and conclusions.
- Added a stable `#website` entity and connected each Article to that WebSite and its visible category topic.
- Added Article keywords only when the WordPress focus-keyword field is populated.
- Added a visible linked-source count near the Research Desk byline.
- Added a stable `#sources` anchor to every rendered Sources section.
- Expanded `llms.txt` with eight curated research entry points and a preferred citation format.

## Rationale

Google states that AI search features use the same foundational requirements as Search and that structured data should match visible content. Google and Bing support `data-nosnippet` for excluding selected page sections from generated snippets while leaving the page discoverable. The implementation therefore emphasizes clear visible evidence, consistent entities, and selective snippet control rather than unsupported GEO-only markup.

## Measurement

Monitor Bing AI citations and grounding queries, Google impressions and CTR, and whether generated search captions quote article evidence instead of repeated navigation or promotional text. Do not infer impact from fewer than seven complete post-deployment days.
