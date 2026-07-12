// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://saasstatshub.com',
  // Pure static output. Server-side endpoints (e.g. /api/subscribe) are
  // implemented as Cloudflare Pages Functions in `functions/` instead of
  // Astro endpoints — this keeps the deploy model identical to before
  // (no adapter, no _worker.js, just static files + edge functions).
  output: 'static',
  integrations: [
    sitemap({
      // Sensible defaults for a content site. These get added to every URL
      // unless overridden via `serialize`.
      changefreq: 'weekly',
      priority: 0.7,
      // Do not stamp every URL with the build time. Article pages expose their
      // real WordPress dateModified value; an inaccurate sitemap lastmod is
      // less useful than omitting it.
      // Per-URL overrides. Higher priority for homepage, lower for legal pages.
      serialize(item) {
        const url = new URL(item.url);
        const path = url.pathname;

        // Homepage: highest priority, refreshed often
        if (path === '/' || path === '') {
          return { ...item, priority: 1.0, changefreq: 'daily' };
        }
        // Article pages: /[category-slug]/[post-slug]/
        // Match anything with two path segments that doesn't start with /categories/
        if (path.match(/^\/[^/]+\/[^/]+\/?$/) && !path.startsWith('/categories/')) {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }
        // Category pages
        if (path.startsWith('/categories/')) {
          return { ...item, priority: 0.8, changefreq: 'daily' };
        }
        // Legal / static / utility pages: lower priority, rarely change
        if (
          path.startsWith('/privacy-policy') ||
          path.startsWith('/terms-of-service') ||
          path.startsWith('/cookie-policy') ||
          path.startsWith('/affiliate-disclosure') ||
          path.startsWith('/contact') ||
          path.startsWith('/write-for-us') ||
          path.startsWith('/about')
        ) {
          return { ...item, priority: 0.3, changefreq: 'monthly' };
        }
        return item;
      },
      // Tell crawlers about the i18n alternates if we add any in the future.
      // For now we're English-only, so we don't set i18n.
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
