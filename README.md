# SaaSStatsHub

Astro frontend for [saasstatshub.com](https://saasstatshub.com) — a SaaS statistics & data hub.

- **Frontend**: Astro 6 + Tailwind CSS 4, statically generated
- **Backend**: WordPress (Headless CMS) at `cms.saasstatshub.com`, exposed via WPGraphQL
- **Hosting**: Cloudflare Pages
- **Build**: pulls data from WPGraphQL at build time → outputs static HTML

## Project layout

```
src/
├── components/
│   ├── sections/        # Homepage section components (Hero, HotStats, …)
│   ├── ArticleCard.astro
│   ├── CoverImage.astro # SVG cover placeholder generator
│   ├── KeyTakeaways.astro
│   ├── QuickOverview.astro
│   ├── Sources.astro
│   └── …
├── data/
│   └── mock-data.ts     # Local fallback when GraphQL is unreachable
├── layouts/
│   ├── BaseLayout.astro
│   └── ArticleLayout.astro
├── lib/
│   ├── constants.ts     # Single source of truth for category slugs/meta
│   ├── site-config.ts   # Homepage CMS types + defaultSiteConfig
│   └── wp-api.ts        # GraphQL client + queries
├── pages/
│   ├── [category]/[slug].astro   # Article page (URL: /{category}/{slug}/)
│   ├── categories/[slug].astro   # Category page
│   ├── index.astro
│   └── …                # 404, about, contact, legal, etc.
└── styles/
    └── global.css       # Tailwind 4 + design tokens + custom animations
```

## Local development

```bash
npm install
npm run dev      # localhost:4321
```

The dev server uses mock data automatically when WP GraphQL is unreachable.

To pull live data, set `WP_API_URL` in `.env`:

```
WP_API_URL=https://cms.saasstatshub.com/index.php?graphql
```

## Build & deploy

```bash
npm run build    # outputs to dist/
```

Cloudflare Pages auto-builds on push to `main`. Manual deploy fallback:

```bash
npx wrangler pages deploy dist --project-name saasstatshub
```

## Documentation

Operational and integration docs live in the `WEB1/` folder of the parent project (not in this repo):

- `saasstatshub-backend-handbook.md` — WordPress / VPS / GraphQL operations
- `saasstatshub-backend-spec-final.md` — Backend feature spec & ACF fields
- `saasstatshub-homepage-cms-spec.md` — Homepage CMS field reference
- `saasstatshub-data-schema.md` — GraphQL data contracts (partially outdated)
- `saasstatshub-frontend-review-integration.md` — Frontend review & TODOs

## License

Proprietary. All rights reserved.
