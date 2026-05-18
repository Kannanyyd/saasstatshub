// Phase 2.3 — Internal Link Juicer post-deploy verification.
//
// Reads dist/, scans <a> tags inside <div class="article-body">,
// and asserts:
//   - All internal hrefs use saasstatshub.com (NOT cms.saasstatshub.com)
//   - Anchor text is not "click here" / "read more" / "here" / "this"
//   - At least N articles carry at least one internal link
//   - Total internal-link count is in a sane range (not 0, not absurd)
//
// Pre-req: `npm run build` has completed locally OR run against
// a fresh production fetch.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SPAM_ANCHORS = new Set(['click here', 'read more', 'learn more', 'here', 'this', 'more']);
const ALLOWED_INTERNAL_HOSTS = ['/', 'https://saasstatshub.com'];
const FORBIDDEN_INTERNAL_HOSTS = ['cms.saasstatshub.com', 'http://saasstatshub.com'];

let passed = 0;
let failed = 0;
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}${detail ? '  (' + detail + ')' : ''}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}${detail ? '  — ' + detail : ''}`);
    failed++;
  }
}

function findAllArticles() {
  const out = [];
  for (const cat of readdirSync(DIST)) {
    const p = join(DIST, cat);
    if (!statSync(p).isDirectory()) continue;
    if (['_astro', 'pagefind', 'categories', 'fonts'].includes(cat)) continue;
    for (const slug of readdirSync(p)) {
      const sp = join(p, slug);
      if (!statSync(sp).isDirectory()) continue;
      const idx = join(sp, 'index.html');
      if (existsSync(idx)) out.push({ category: cat, slug, path: idx });
    }
  }
  return out;
}

function extractArticleBody(html) {
  // Match <div class="article-body">...</div>, stopping at sibling <div> /
  // <div class="newsletter / aside etc.
  const m = html.match(/<div class="article-body">([\s\S]*?)<\/div>\s*(?:<!--|<div\b|<aside|<section|<\/article)/);
  return m ? m[1] : '';
}

const articles = findAllArticles();
if (articles.length === 0) {
  console.error('No articles in dist/. Run `npm run build` first.');
  process.exit(2);
}
console.log(`Scanning ${articles.length} article HTML files in dist/...`);

let totalInternal = 0;
let totalSpammy = 0;
let totalCmsHrefs = 0;
let articlesWithLinks = 0;
const allAnchors = new Set();
const linkSenders = {};
const linkReceivers = {};
const sampleSpammy = [];
const sampleCms = [];

for (const a of articles) {
  const html = readFileSync(a.path, 'utf8');
  const body = extractArticleBody(html);
  if (!body) continue;
  const links = [...body.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi)];
  if (links.length > 0) articlesWithLinks++;
  for (const m of links) {
    const href = m[1];
    const anchor = m[2].replace(/\s+/g, ' ').trim();

    // Forbidden cms.saasstatshub.com hrefs (should have been rewritten by WP_HOME fix)
    if (FORBIDDEN_INTERNAL_HOSTS.some((h) => href.includes(h))) {
      totalCmsHrefs++;
      if (sampleCms.length < 3) sampleCms.push({ from: a.slug, href, anchor });
      continue;
    }

    // Internal links: relative or saasstatshub.com
    const isInternal = href.startsWith('/') || href.startsWith('https://saasstatshub.com');
    if (!isInternal) continue;

    totalInternal++;
    allAnchors.add(anchor.toLowerCase());

    // Spammy anchor
    if (SPAM_ANCHORS.has(anchor.toLowerCase())) {
      totalSpammy++;
      if (sampleSpammy.length < 3) sampleSpammy.push({ from: a.slug, href, anchor });
    }

    // Sender / receiver tally
    linkSenders[a.slug] = (linkSenders[a.slug] || 0) + 1;
    // Extract receiver slug from href like /crm/foo-2026/
    const recvMatch = href.match(/\/[a-z][a-z-]+\/([a-z][a-z0-9-]+)\/?$/);
    if (recvMatch) {
      const recv = recvMatch[1];
      linkReceivers[recv] = (linkReceivers[recv] || 0) + 1;
    }
  }
}

console.log('\n=== Phase 2.3 Internal Link Juicer verification ===');
check(
  'Zero hrefs leak cms.saasstatshub.com (WP_HOME fix)',
  totalCmsHrefs === 0,
  totalCmsHrefs > 0 ? `found ${totalCmsHrefs}; sample: ${JSON.stringify(sampleCms[0])}` : '',
);
check(
  'Zero spammy anchors (click here / read more / here / this)',
  totalSpammy === 0,
  totalSpammy > 0 ? `found ${totalSpammy}; sample: ${JSON.stringify(sampleSpammy[0])}` : '',
);
check(
  'Total internal links ≥ 50 (backend reported 108)',
  totalInternal >= 50,
  `found ${totalInternal}`,
);
check(
  'Articles with at least 1 outgoing internal link ≥ 20',
  articlesWithLinks >= 20,
  `${articlesWithLinks} / ${articles.length}`,
);
check(
  'Unique anchor texts ≥ 10',
  allAnchors.size >= 10,
  `${allAnchors.size} unique anchors`,
);

console.log('\n=== Top 5 link senders (articles with most outgoing internal links) ===');
const topSenders = Object.entries(linkSenders).sort((a, b) => b[1] - a[1]).slice(0, 5);
for (const [slug, n] of topSenders) console.log(`  ${slug.padEnd(50)} ${n}`);

console.log('\n=== Top 5 link receivers (articles linked to from most other articles) ===');
const topReceivers = Object.entries(linkReceivers).sort((a, b) => b[1] - a[1]).slice(0, 5);
for (const [slug, n] of topReceivers) console.log(`  ${slug.padEnd(50)} ${n}`);

console.log('\n=== Summary ===');
console.log(`Total articles scanned:      ${articles.length}`);
console.log(`Articles with internal links: ${articlesWithLinks}`);
console.log(`Total internal links:         ${totalInternal}`);
console.log(`Unique anchor texts:          ${allAnchors.size}`);
console.log(`Spammy anchors:               ${totalSpammy}`);
console.log(`cms.saasstatshub.com leaks:   ${totalCmsHrefs}`);
console.log(`\nPassed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
