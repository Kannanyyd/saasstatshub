// Phase 2.1 Task 12: post-build verification for the Related Articles
// module, the Lucide-icon Breadcrumb upgrade, and the Schema.org Dataset
// JSON-LD block.
//
// Reads dist/, auto-discovers one representative article per category,
// asserts every Phase 2.1 invariant the requirements lock in.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CATEGORIES = [
  'analytics',
  'crm',
  'ecommerce',
  'marketing',
  'security',
  'communication',
  'project-management',
  'hr',
];

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

function findArticlesByCategory() {
  const out = [];
  for (const cat of CATEGORIES) {
    const catDir = join('dist', cat);
    if (!existsSync(catDir)) continue;
    const slugs = readdirSync(catDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const slug of slugs) {
      const f = join(catDir, slug, 'index.html');
      if (existsSync(f)) {
        out.push({ category: cat, slug, path: f });
        break; // one per category
      }
    }
  }
  return out;
}

const articles = findArticlesByCategory();
if (articles.length === 0) {
  console.error('❌ No article HTML found in dist/. Run `npm run build` first.');
  process.exit(2);
}
console.log(`Auditing ${articles.length} representative article(s) — one per discovered category.\n`);

// ---------- Schema.org JSON-LD count, order, and shape (Reqs 3.1, 3.14) ----------
console.log('=== Phase 2.1 Schema.org JSON-LD on every article page (Reqs 3.1, 3.14) ===');

function extractLdJson(html) {
  // Greedy match each <script type="application/ld+json"> block
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim());
  const parsed = [];
  for (const raw of blocks) {
    try {
      parsed.push(JSON.parse(raw));
    } catch {
      parsed.push(null);
    }
  }
  return parsed;
}

let firstArticleSample = null;
for (const a of articles) {
  const html = readFileSync(a.path, 'utf8');
  const blocks = extractLdJson(html);
  // BaseLayout adds Organization on every page (1 block) before ArticleLayout adds 3 or 4.
  // After Phase 2.2: articles can have 4 (Article + Breadcrumb + Dataset + FAQPage) or
  //                  3 (Article + Breadcrumb + Dataset) if no FAQ items.
  // We check that Article + BreadcrumbList + Dataset are always present in that order
  // among the last 3 OR 4 blocks, and FAQPage (when present) is the very last.
  const types = blocks.map((b) => (b && (b['@type'] || b['@graph']?.[0]?.['@type'])) || 'unknown');
  const last4 = types.slice(-4);
  const last3 = types.slice(-3);
  const hasFaq = types.includes('FAQPage');

  if (hasFaq) {
    check(
      `[${a.category}] last 4 JSON-LD blocks are Article → BreadcrumbList → Dataset → FAQPage`,
      last4.length === 4 && last4[0] === 'Article' && last4[1] === 'BreadcrumbList' && last4[2] === 'Dataset' && last4[3] === 'FAQPage',
      `actual: ${JSON.stringify(types)}`,
    );
  } else {
    check(
      `[${a.category}] last 3 JSON-LD blocks are Article → BreadcrumbList → Dataset (no FAQ)`,
      last3.length === 3 && last3[0] === 'Article' && last3[1] === 'BreadcrumbList' && last3[2] === 'Dataset',
      `actual: ${JSON.stringify(types)}`,
    );
  }

  // Dataset block shape (Reqs 3.2, 3.8, 3.9, 3.10)
  const datasetBlock = blocks[blocks.length - 1];
  if (a.category === 'analytics' && datasetBlock) firstArticleSample = { article: a, html, blocks, datasetBlock };
  if (datasetBlock && datasetBlock['@type'] === 'Dataset') {
    check(
      `[${a.category}] Dataset has @context + name + description + creator + license + distribution`,
      datasetBlock['@context'] === 'https://schema.org' &&
        typeof datasetBlock.name === 'string' &&
        datasetBlock.name.length > 0 &&
        typeof datasetBlock.description === 'string' &&
        datasetBlock.description.length > 0 &&
        datasetBlock.creator?.['@type'] === 'Organization' &&
        datasetBlock.license === 'https://creativecommons.org/licenses/by-nc/4.0/' &&
        datasetBlock.distribution?.['@type'] === 'DataDownload' &&
        datasetBlock.distribution?.encodingFormat === 'text/html',
      `name=${JSON.stringify(datasetBlock.name)}, license ok=${datasetBlock.license === 'https://creativecommons.org/licenses/by-nc/4.0/'}`,
    );
  }
}

// ---------- Breadcrumb visual ↔ JSON-LD parity + Lucide icon (Reqs 2.1–2.13) ----------
console.log('\n=== Phase 2.1 Breadcrumb visual + Lucide icon (Reqs 2.5, 2.6, 2.10, 2.13) ===');
for (const a of articles) {
  const html = readFileSync(a.path, 'utf8');
  // Extract first <nav aria-label="Breadcrumb">…</nav>
  const navMatch = html.match(/<nav[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/);
  if (!navMatch) {
    check(`[${a.category}] Breadcrumb nav present`, false, 'no <nav aria-label="Breadcrumb">');
    continue;
  }
  const navHtml = navMatch[1];
  const svgsInNav = [...navHtml.matchAll(/<svg\b[^>]*>/g)].map((m) => m[0]);
  // Expected: 2 chevron-right separators + 1 category icon = 3 svgs total
  check(
    `[${a.category}] Breadcrumb contains exactly 3 inline SVGs (2 separators + 1 category icon)`,
    svgsInNav.length === 3,
    `found ${svgsInNav.length}`,
  );
  const allHidden = svgsInNav.every((s) => /aria-hidden="true"/.test(s));
  check(
    `[${a.category}] All breadcrumb SVGs are aria-hidden (decorative)`,
    allHidden,
    allHidden ? 'all 3 hidden' : 'at least one missing aria-hidden',
  );
}

// ---------- Related Articles section (Reqs 1.1, 1.12, 1.13, 1.14) ----------
console.log('\n=== Phase 2.1 Related Articles section (Reqs 1.1, 1.12, 1.13, 1.14) ===');
for (const a of articles) {
  const html = readFileSync(a.path, 'utf8');
  const sectionMatch = html.match(/<section[^>]*class="[^"]*related-articles[^"]*"[\s\S]*?<\/section>/);
  if (!sectionMatch) {
    // It's allowed to be absent only when the article had < 3 resolved tiles
    // (Req 1.7). For production with 25 articles, this is unexpected — we flag
    // as a soft warning but don't fail the suite.
    console.log(`  ⚠️  [${a.category}] No related-articles section (allowed when resolved tile count < 3)`);
    continue;
  }
  const sec = sectionMatch[0];
  // Req 1.12: <h2 id="related-articles-heading">Related Articles</h2>
  check(
    `[${a.category}] section has <h2 id="related-articles-heading"> with text "Related Articles"`,
    /<h2[^>]*id="related-articles-heading"[^>]*>[\s\S]*?Related Articles[\s\S]*?<\/h2>/.test(sec),
  );
  // Req 1.13: responsive grid classes
  check(
    `[${a.category}] section grid has grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 or lg:grid-cols-4`,
    /grid-cols-1[\s\S]*?sm:grid-cols-2[\s\S]*?lg:grid-cols-(3|4)/.test(sec),
  );
  // Tile count: 3 or 4 article-cards inside the section
  const tileCount = (sec.match(/article-card/g) || []).length;
  check(
    `[${a.category}] section contains 3 or 4 article-card tiles`,
    tileCount === 3 || tileCount === 4,
    `found ${tileCount}`,
  );
  // Req 1.14: each tile links to /{categorySlug}/{slug}/
  const hrefs = [...sec.matchAll(/href="\/([^"\/]+)\/([^"\/]+)\/"/g)].map((m) => `/${m[1]}/${m[2]}/`);
  const distinctHrefs = new Set(hrefs);
  check(
    `[${a.category}] all tile hrefs match /{categorySlug}/{slug}/ pattern`,
    hrefs.length > 0 && distinctHrefs.size >= tileCount,
    `${distinctHrefs.size} unique hrefs for ${tileCount} tiles`,
  );
}

// ---------- Section placement: between Sources and bottom Newsletter (Req 1.1) ----------
console.log('\n=== Phase 2.1 Section placement (Req 1.1) ===');
for (const a of articles) {
  const html = readFileSync(a.path, 'utf8');
  const relatedIdx = html.search(/<section[^>]*class="[^"]*related-articles/);
  const newsletterIdx = html.lastIndexOf('class="newsletter');
  const sourcesIdx = html.search(/<aside[^>]*id="sources"|<h2[^>]*id="sources"/);
  if (relatedIdx === -1) continue;
  const placementOk = (sourcesIdx === -1 || sourcesIdx < relatedIdx) &&
    newsletterIdx > relatedIdx;
  check(
    `[${a.category}] Related Articles is after Sources (when present) and before bottom Newsletter`,
    placementOk,
    `sources=${sourcesIdx}, related=${relatedIdx}, newsletter=${newsletterIdx}`,
  );
}

// ---------- Sample artifact for the changelog ----------
if (firstArticleSample) {
  console.log(`\n(Sample Dataset block for changelog — first analytics article ${firstArticleSample.article.slug}):`);
  console.log(JSON.stringify(firstArticleSample.datasetBlock, null, 2).split('\n').map((l) => '  ' + l).join('\n'));
}

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
