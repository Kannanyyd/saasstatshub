// Measure homepage JS payload (Req 5.9 baseline).
// Find every <script src> in baseline-home.html, fetch each, gzip-compress,
// sum the gzipped sizes. Inline <script> blocks are also included
// (gzipped individually) since they ship with the HTML.
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const html = readFileSync('baseline/baseline-home.html', 'utf8');

// External scripts: <script ... src="..."></script>
const externalSrcs = [...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map((m) => m[1])
  .filter((s) => !s.startsWith('data:'));

// Inline scripts: any <script>...</script> without src
const inlineBlocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((m) => m[1])
  .filter((s) => s.trim().length > 0);

const ORIGIN = 'https://saasstatshub.com';
function abs(u) {
  if (u.startsWith('http')) return u;
  if (u.startsWith('//')) return 'https:' + u;
  return ORIGIN + (u.startsWith('/') ? '' : '/') + u;
}

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

const report = {
  capturedAt: new Date().toISOString(),
  source: 'https://saasstatshub.com/',
  external: [],
  inline: [],
  totals: { rawBytes: 0, gzippedBytes: 0 },
};

for (const src of externalSrcs) {
  const url = abs(src);
  try {
    const buf = await fetchBytes(url);
    const gz = gzipSync(buf).length;
    report.external.push({ url, raw: buf.length, gz });
    report.totals.rawBytes += buf.length;
    report.totals.gzippedBytes += gz;
  } catch (e) {
    report.external.push({ url, error: String(e) });
  }
}

for (let i = 0; i < inlineBlocks.length; i++) {
  const buf = Buffer.from(inlineBlocks[i], 'utf8');
  const gz = gzipSync(buf).length;
  report.inline.push({ index: i, raw: buf.length, gz, preview: inlineBlocks[i].slice(0, 60).replace(/\s+/g, ' ').trim() });
  report.totals.rawBytes += buf.length;
  report.totals.gzippedBytes += gz;
}

writeFileSync('baseline/baseline-js-payload.json', JSON.stringify(report, null, 2));
console.log(`External scripts: ${report.external.length}`);
console.log(`Inline scripts:   ${report.inline.length}`);
console.log(`Total raw:        ${report.totals.rawBytes} B`);
console.log(`Total gzipped:    ${report.totals.gzippedBytes} B (${(report.totals.gzippedBytes / 1024).toFixed(2)} KB)`);

// First-party only: exclude well-known third-party origins so the
// Phase 1 ≤12 KB gz growth budget is comparable across runs.
const THIRD_PARTY = ['googletagmanager.com', 'google-analytics.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'doubleclick.net', 'googlesyndication.com'];
const isThirdParty = (u) => THIRD_PARTY.some((d) => u.includes(d));
const fpExt = report.external.filter((e) => e.gz != null && !isThirdParty(e.url));
const fpExtGz = fpExt.reduce((s, e) => s + e.gz, 0);
const inlineGz = report.inline.reduce((s, i) => s + i.gz, 0);
const firstPartyTotal = fpExtGz + inlineGz;
report.firstPartyTotals = { gzippedBytes: firstPartyTotal, breakdown: { external: fpExtGz, inline: inlineGz } };
writeFileSync('baseline/baseline-js-payload.json', JSON.stringify(report, null, 2));
console.log(`First-party gz:   ${firstPartyTotal} B (${(firstPartyTotal / 1024).toFixed(2)} KB) [excludes ${THIRD_PARTY.join(', ')}]`);
