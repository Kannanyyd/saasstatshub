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
import { getAllArticlesForRss } from '../lib/wp-api';

const SITE_URL = 'https://saasstatshub.com';

export async function GET(context) {
  let items = [];
  try {
    const articles = await getAllArticlesForRss();
    items = articles.map((a) => ({
      title: a.title,
      pubDate: a.rawDate ? new Date(a.rawDate) : new Date(),
      description: a.excerpt || a.title,
      link: `/${a.category.slug}/${a.slug}/`,
      categories: [a.category.name],
    }));
  } catch (err) {
    console.warn('[rss] getAllArticlesForRss failed; emitting empty feed:', err);
  }

  // Already sorted sticky-first by sortBySticky inside the helper, but
  // for RSS we want strict pub-date desc (no sticky bias) so readers see
  // the actual publication chronology.
  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

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
