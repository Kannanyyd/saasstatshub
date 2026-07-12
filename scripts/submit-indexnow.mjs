const siteOrigin = 'https://saasstatshub.com';
const key = '3deb4bfcb6e446e48fa5672413e45c2a';
const keyLocation = `${siteOrigin}/${key}.txt`;

function normalizeUrl(value) {
  const url = new URL(value, siteOrigin);
  if (url.origin !== siteOrigin) throw new Error(`URL must belong to ${siteOrigin}: ${value}`);
  url.hash = '';
  return url.href;
}

async function urlsFromSitemaps() {
  const indexXml = await fetch(`${siteOrigin}/sitemap-index.xml`).then((response) => {
    if (!response.ok) throw new Error(`Sitemap index returned HTTP ${response.status}`);
    return response.text();
  });
  const sitemapUrls = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const pages = [];
  for (const sitemapUrl of sitemapUrls) {
    const xml = await fetch(sitemapUrl).then((response) => {
      if (!response.ok) throw new Error(`${sitemapUrl} returned HTTP ${response.status}`);
      return response.text();
    });
    pages.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  }
  return pages;
}

const args = process.argv.slice(2);
const requested = args.includes('--all') ? await urlsFromSitemaps() : args;
if (requested.length === 0) {
  console.error('Usage: npm run seo:indexnow -- <URL ...> | --all');
  process.exit(1);
}

const urlList = [...new Set(requested.map(normalizeUrl))];
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: new URL(siteOrigin).hostname,
    key,
    keyLocation,
    urlList,
  }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow returned HTTP ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${urlList.length} URL(s) with HTTP ${response.status}.`);
