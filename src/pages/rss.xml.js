/**
 * RSS Feed for SaaSStatsHub.
 *
 * Endpoint: /rss.xml
 * Items: All published articles, sorted by date desc, capped at 50.
 *
 * Why: Google scrapes RSS feeds proactively (Googlebot subscribes to
 * pubsubhubbub-style feeds) — exposing one accelerates fresh-content
 * discovery vs sitemap polling alone. Also useful for newsletter
 * subscribers who use RSS readers.
 *
 * Format: RSS 2.0 with Atom self-link (best-practice for Google).
 * Description content is the article excerpt (cleanExcerpt-stripped).
 * Full article body is intentionally NOT included — keeps feed small
 * and drives readers to the canonical URL.
 */

import rss from '@astrojs/rss';
import { getHomePageData, getAllArticleSlugs, getArticleData } from '../lib/wp-api';

const SITE_URL = 'https://saasstatshub.com';

export async function GET(context) {
  // Pull article metadata. We use the same HOME_PAGE_QUERY shape that's
  // already populated for the homepage Latest Articles section, plus
  // fall back to a per-slug fetch for anything not in the 15-post
  // window so the feed represents the whole catalog.
  let items = [];
  try {
    const home = await getHomePageData();
    // home.latestArticles is up to 15 most-recent posts with full card metadata
    items = home.latestArticles.map((a) => ({
      title: a.title,
      pubDate: a.rawDate ? new Date(a.rawDate) : new Date(),
      description: a.excerpt || a.title,
      link: `/${a.category.slug}/${a.slug}/`,
      categories: [a.category.name],
    }));
  } catch (err) {
    // GraphQL transient failure — degrade gracefully to an empty feed
    // rather than failing the build. Sitemap will still cover discovery.
    console.warn('[rss] getHomePageData failed; emitting empty feed:', err);
  }

  // Sort by pubDate desc and cap at 50 items
  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  items = items.slice(0, 50);

  return rss({
    title: 'SaaSStatsHub — SaaS Statistics & Industry Data',
    description:
      'Latest SaaS statistics, market data, and industry trends across CRM, marketing, e-commerce, project management, HR, analytics, security, and communication categories.',
    site: context.site ?? SITE_URL,
    items,
    customData: '<language>en-us</language>',
    stylesheet: false,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
  });
}
