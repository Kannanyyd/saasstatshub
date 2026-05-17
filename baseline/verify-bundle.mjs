// Phase 1 Task 18: build + bundle size + dependency policy verification.
// Reqs: 5.1, 5.2, 5.7, 5.8, 5.9, 5.10, 5.12, 2.18, 4.5

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

let passed = 0, failed = 0;
function check(name, condition, detail = '') {
  if (condition) { console.log(`  ✅ ${name}${detail ? '  (' + detail + ')' : ''}`); passed++; }
  else { console.log(`  ❌ ${name}${detail ? '  — ' + detail : ''}`); failed++; }
}

const HOME = readFileSync('dist/index.html', 'utf8');

// ---------- Pagefind index ----------
console.log('=== Pagefind index (Req 5.2) ===');
const baselinePagefind = JSON.parse(readFileSync('baseline/baseline-pagefind-entry.json', 'utf8'));
const baselinePages = baselinePagefind.languages.en.page_count;
const newPagefindPath = 'dist/pagefind/pagefind-entry.json';
const newPagefind = JSON.parse(readFileSync(newPagefindPath, 'utf8'));
const newPages = newPagefind.languages.en.page_count;
check(`Pagefind page count ${newPages} ≥ baseline ${baselinePages}`, newPages >= baselinePages);

// ---------- JS payload growth ----------
console.log('\n=== Homepage first-party JS payload (Req 5.9) ===');
const baselineJs = JSON.parse(readFileSync('baseline/baseline-js-payload.json', 'utf8'));
const baselineFirstPartyGz = baselineJs.firstPartyTotals.gzippedBytes;

const externalSrcs = [...HOME.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map((m) => m[1]).filter((s) => !s.startsWith('data:'));
const inlineBlocks = [...HOME.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => s.trim().length > 0);

const THIRD_PARTY = ['googletagmanager.com', 'google-analytics.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'doubleclick.net', 'googlesyndication.com'];
const isThirdParty = (u) => THIRD_PARTY.some((d) => u.includes(d));

let newFirstPartyGz = 0;
for (const src of externalSrcs) {
  if (isThirdParty(src)) continue;
  // local /_astro/ chunk: read from dist
  if (src.startsWith('/_astro/') || src.startsWith('_astro/')) {
    const path = join('dist', src.startsWith('/') ? src.slice(1) : src);
    if (statSync(path, { throwIfNoEntry: false })) {
      const buf = readFileSync(path);
      newFirstPartyGz += gzipSync(buf).length;
    }
  }
}
for (const inline of inlineBlocks) {
  newFirstPartyGz += gzipSync(Buffer.from(inline, 'utf8')).length;
}

const growth = newFirstPartyGz - baselineFirstPartyGz;
check(`First-party JS gzipped: ${newFirstPartyGz}B (baseline ${baselineFirstPartyGz}B, growth ${growth >= 0 ? '+' : ''}${growth}B)`,
  growth <= 12 * 1024,
  growth <= 0 ? 'no growth (excellent)' : `+${(growth/1024).toFixed(2)} KB ≤ 12 KB`);

// ---------- Icon payload (Req 4.5) ----------
console.log('\n=== Icon payload (Req 4.5, ≤8 KB gz) ===');
// Icon-related: every inline <svg> from Lucide has 24x24 viewBox + currentColor stroke.
// We approximate by extracting all <svg> children that look like Lucide
// (viewBox="0 0 24 24" stroke="currentColor").
const lucideSvgMatches = [...HOME.matchAll(/<svg\b[^>]*viewBox="0 0 24 24"[^>]*stroke="currentColor"[^>]*>[\s\S]*?<\/svg>/g)].map((m) => m[0]);
const lucideTotal = lucideSvgMatches.join('').length;
const lucideGz = gzipSync(Buffer.from(lucideSvgMatches.join(''), 'utf8')).length;
check(`Inline Lucide SVG count: ${lucideSvgMatches.length}, total gzipped: ${lucideGz}B`,
  lucideGz <= 8 * 1024,
  `${(lucideGz/1024).toFixed(2)} KB`);

// ---------- Sparkline payload (Req 2.18, ≤3 KB gz) ----------
console.log('\n=== Sparkline payload (Req 2.18, ≤3 KB gz) ===');
// Sparkline-related: scoped <style> in head + the <svg class="sparkline"> elements.
const sparkSvgs = [...HOME.matchAll(/<svg\b[^>]*class="[^"]*sparkline[^"]*"[^>]*>[\s\S]*?<\/svg>/g)].map((m) => m[0]);
const headStyleBlocks = [...HOME.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const sparkStyleBlock = headStyleBlocks.find((b) => /sparkline/.test(b)) || '';
const sparkPayload = sparkSvgs.join('') + sparkStyleBlock;
const sparkGz = gzipSync(Buffer.from(sparkPayload, 'utf8')).length;
check(`Sparkline payload (${sparkSvgs.length} SVGs + scoped CSS): ${sparkGz}B gz`,
  sparkGz <= 3 * 1024,
  `${(sparkGz/1024).toFixed(2)} KB`);

// ---------- Framework dependency policy (Req 5.7) ----------
console.log('\n=== Framework deps policy (Req 5.7) ===');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const FORBIDDEN = ['react', 'vue', 'preact', 'solid-js', 'svelte', '@types/react', '@types/vue'];
const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
const violations = FORBIDDEN.filter((f) => allDeps[f]);
check(`No forbidden framework deps in package.json`, violations.length === 0,
  violations.length ? `found: ${violations.join(', ')}` : 'clean');

// ---------- Origin allowlist (Req 5.12) ----------
console.log('\n=== Origin allowlist (Req 5.12) ===');
const allowedOrigins = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'saasstatshub.com',
  'www.saasstatshub.com',
];
// Namespace URIs that aren't fetched at runtime — JSON-LD schema and SVG.
const namespaceHosts = new Set(['schema.org', 'www.w3.org']);

const externalUrls = new Set();
const urlRe = /https?:\/\/([a-zA-Z0-9.-]+)/g;
let m;
while ((m = urlRe.exec(HOME)) !== null) {
  externalUrls.add(m[1]);
}
const fetchableOrigins = [...externalUrls].filter((host) => !namespaceHosts.has(host));
const unknownOrigins = fetchableOrigins.filter((host) => !allowedOrigins.some((a) => host === a || host.endsWith('.' + a) || host === a));
check(`No unknown fetchable external origins in homepage HTML`, unknownOrigins.length === 0,
  unknownOrigins.length ? `unknown: ${unknownOrigins.join(', ')}` : `fetchable: ${fetchableOrigins.sort().join(', ')} | namespaces: ${[...namespaceHosts].join(', ')}`);

// ---------- Email policy (Req 5.10) ----------
console.log('\n=== Contact email policy (Req 5.10) ===');
const pages = readdirSync('dist', { recursive: true }).filter((f) => typeof f === 'string' && f.endsWith('.html')).map((f) => join('dist', f));
// Allowed values include the real contact email + UI placeholders that
// aren't user-facing contact information.
const ALLOWED_EMAILS = ['sangaypopo@gmail.com'];
const PLACEHOLDER_EMAILS = ['email@domain.com', 'you@email.com', 'you@company.com', 'you@example.com', 'name@example.com'];
const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const emailHits = new Set();
const violationsByPage = {};
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  const m = html.match(emailRe) || [];
  for (const e of m) {
    emailHits.add(e);
    if (!ALLOWED_EMAILS.includes(e) && !PLACEHOLDER_EMAILS.includes(e)) {
      (violationsByPage[p] ??= []).push(e);
    }
  }
}
const violationCount = Object.values(violationsByPage).reduce((s, arr) => s + arr.length, 0);
check(`All contact emails are sangaypopo@gmail.com`, violationCount === 0,
  violationCount ? `${violationCount} violations across ${Object.keys(violationsByPage).length} pages` : `contact: ${[...emailHits].filter((e) => ALLOWED_EMAILS.includes(e)).join(', ') || 'none'} | placeholders ignored: ${[...emailHits].filter((e) => PLACEHOLDER_EMAILS.includes(e)).join(', ')}`);

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
