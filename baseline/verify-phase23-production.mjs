// Phase 2.3 — production verification (fetches live HTML).
// Scans top-receiver and top-sender articles via curl/fetch.

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';

const BASE = 'https://saasstatshub.com';
// Sample articles likely to have internal links (top categories, well-known products)
const SAMPLE = [
  '/crm/salesforce-statistics-2026/',
  '/crm/hubspot-statistics-2026/',
  '/analytics/ai-saas-statistics-2026/',
  '/communication/zoom-statistics-2026/',
  '/communication/slack-statistics-2026/',
  '/ecommerce/shopify-statistics-2026/',
  '/marketing/email-marketing-statistics-2026/',
  '/hr/payroll-statistics-2026/',
  '/security/cybersecurity-statistics-2026/',
  '/project-management/asana-statistics-2026/',
];

const SPAM_ANCHORS = new Set(['click here', 'read more', 'learn more', 'here', 'this', 'more']);
const FORBIDDEN_HOSTS = ['cms.saasstatshub.com', 'http://saasstatshub.com'];

let passed = 0;
let failed = 0;
function check(name, cond, detail = '') {
  if (cond) { console.log(`  ✅ ${name}${detail ? '  (' + detail + ')' : ''}`); passed++; }
  else { console.log(`  ❌ ${name}${detail ? '  — ' + detail : ''}`); failed++; }
}

function extractArticleBody(html) {
  const m = html.match(/<div class="article-body">([\s\S]*?)<\/div>\s*(?:<!--|<div\b|<aside|<section|<\/article)/);
  return m ? m[1] : '';
}

const stats = {
  fetched: 0,
  internalCount: 0,
  cmsLeaks: 0,
  spamCount: 0,
  uniqueAnchors: new Set(),
  perArticle: {},
};
const sampleCms = [];
const sampleSpam = [];

for (const path of SAMPLE) {
  const url = BASE + path;
  let html;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  ⚠️  ${path} → HTTP ${res.status}, skip`);
      continue;
    }
    html = await res.text();
  } catch (e) {
    console.log(`  ⚠️  ${path} → fetch error, skip`);
    continue;
  }
  stats.fetched++;
  const body = extractArticleBody(html);
  if (!body) {
    console.log(`  ⚠️  ${path} → no <div class="article-body"> match, skip`);
    continue;
  }

  const links = [...body.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi)];
  let articleInternal = 0;
  for (const m of links) {
    const href = m[1];
    const anchor = m[2].replace(/\s+/g, ' ').trim();

    if (FORBIDDEN_HOSTS.some((h) => href.includes(h))) {
      stats.cmsLeaks++;
      if (sampleCms.length < 3) sampleCms.push({ from: path, href, anchor });
      continue;
    }
    const isInternal = href.startsWith('/') || href.startsWith('https://saasstatshub.com');
    if (!isInternal) continue;

    articleInternal++;
    stats.internalCount++;
    stats.uniqueAnchors.add(anchor.toLowerCase());

    if (SPAM_ANCHORS.has(anchor.toLowerCase())) {
      stats.spamCount++;
      if (sampleSpam.length < 3) sampleSpam.push({ from: path, href, anchor });
    }
  }
  stats.perArticle[path] = articleInternal;
}

console.log('\n=== Phase 2.3 Internal Link Juicer — production verification ===');
check(`Fetched ${stats.fetched}/${SAMPLE.length} sample articles`, stats.fetched >= 8);
check(
  'Zero hrefs leak cms.saasstatshub.com (WP_HOME fix)',
  stats.cmsLeaks === 0,
  stats.cmsLeaks > 0 ? `found ${stats.cmsLeaks}; sample: ${JSON.stringify(sampleCms[0])}` : '',
);
check(
  'Zero spammy anchors',
  stats.spamCount === 0,
  stats.spamCount > 0 ? `found ${stats.spamCount}; sample: ${JSON.stringify(sampleSpam[0])}` : '',
);
check(
  `At least 5 sample articles have ≥ 1 internal link`,
  Object.values(stats.perArticle).filter((n) => n > 0).length >= 5,
  `${Object.values(stats.perArticle).filter((n) => n > 0).length} of ${stats.fetched} have links`,
);
check(
  'Total internal links across 10 samples ≥ 15',
  stats.internalCount >= 15,
  `found ${stats.internalCount}`,
);
check(
  'Unique anchor texts ≥ 8',
  stats.uniqueAnchors.size >= 8,
  `${stats.uniqueAnchors.size} unique`,
);

console.log('\n=== Per-article internal link count ===');
for (const [path, n] of Object.entries(stats.perArticle).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${path.padEnd(55)} ${n}`);
}
console.log(`\nTotal internal links found: ${stats.internalCount}`);
console.log(`Unique anchor texts:        ${stats.uniqueAnchors.size}`);
console.log(`Sample of unique anchors:   ${[...stats.uniqueAnchors].slice(0, 10).join(' | ')}`);

console.log(`\nPassed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
