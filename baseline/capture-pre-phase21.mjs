// Phase 2.1 baseline capture script.
// Reads dist/, computes first-party gzipped JS for home + representative article,
// records Pagefind page count, writes baseline/pre-phase21-js-payload.json.
//
// Pure regex parser (no cheerio dep). Local dist files only — does NOT fetch
// production. This is the pre-phase21 floor for delta comparison.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const THIRD_PARTY = [
  'googletagmanager.com',
  'google-analytics.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'doubleclick.net',
  'googlesyndication.com',
];

const gz = (text) => gzipSync(Buffer.from(text, 'utf8')).length;

function parseScripts(html) {
  const externalSrcs = [...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
  const inlineBlocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1])
    .filter((s) => s.trim().length > 0);
  return { externalSrcs, inlineBlocks };
}

function measureFirstPartyJS(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const { externalSrcs, inlineBlocks } = parseScripts(html);

  let externalCount = externalSrcs.length;
  let inlineCount = inlineBlocks.length;
  let firstPartyGz = 0;

  for (const src of externalSrcs) {
    if (THIRD_PARTY.some((d) => src.includes(d))) continue;
    if (src.startsWith('/')) {
      const local = join('dist', src.slice(1));
      if (existsSync(local)) firstPartyGz += gz(readFileSync(local, 'utf8'));
    }
  }
  for (const block of inlineBlocks) {
    firstPartyGz += gz(block);
  }
  return { externalCount, inlineCount, firstPartyGz };
}

function countPagefindPages() {
  const fragmentsDir = 'dist/pagefind/fragment';
  if (!existsSync(fragmentsDir)) return 0;
  return readdirSync(fragmentsDir).filter((f) => f.endsWith('.pf_fragment')).length;
}

function findRepresentativeArticle() {
  const distDir = 'dist';
  for (const cat of readdirSync(distDir)) {
    const catPath = join(distDir, cat);
    if (!statSync(catPath).isDirectory()) continue;
    if (['_astro', 'pagefind', 'categories', 'fonts'].includes(cat)) continue;
    const slugs = readdirSync(catPath).filter((s) => statSync(join(catPath, s)).isDirectory()).sort();
    for (const slug of slugs) {
      const idx = join(catPath, slug, 'index.html');
      if (existsSync(idx)) return idx;
    }
  }
  return null;
}

const home = measureFirstPartyJS('dist/index.html');
const articlePath = findRepresentativeArticle();
const article = articlePath ? measureFirstPartyJS(articlePath) : null;

const out = {
  capturedAt: new Date().toISOString(),
  homepage: { ...home, htmlPath: 'dist/index.html' },
  article: article ? { ...article, htmlPath: articlePath } : null,
  pagefindPages: countPagefindPages(),
  notes: 'Phase 2.1 pre-merge baseline. firstPartyGz excludes third-party origins.',
};
writeFileSync('baseline/pre-phase21-js-payload.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
