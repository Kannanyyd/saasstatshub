// Final post-fix Lighthouse comparison.
// home-mobile uses post2 (after font subset), the other 3 use post (still valid).
import { readFileSync, writeFileSync } from 'node:fs';

const RUNS = [
  { id: 'home-desktop',    base: 'baseline/lh-home-desktop.report.json',    post: 'baseline/post-lh-home-desktop.report.json'    },
  { id: 'home-mobile',     base: 'baseline/lh-home-mobile.report.json',     post: 'baseline/post2-lh-home-mobile.report.json'    },
  { id: 'article-desktop', base: 'baseline/lh-article-desktop.report.json', post: 'baseline/post-lh-article-desktop.report.json' },
  { id: 'article-mobile',  base: 'baseline/lh-article-mobile.report.json',  post: 'baseline/post-lh-article-mobile.report.json'  },
];

function pick(r) {
  const score = (k) => r.categories[k]?.score != null ? Math.round(r.categories[k].score * 100) : null;
  const num = (k) => r.audits[k]?.numericValue;
  return { perf: score('performance'), a11y: score('accessibility'), LCP: num('largest-contentful-paint'), CLS: num('cumulative-layout-shift') };
}

let passed = 0, failed = 0;
const summary = { capturedAt: new Date().toISOString(), runs: {} };

console.log('id                 | Perf       | A11y       | LCP (ms)');
console.log('-------------------+------------+------------+--------------------');
for (const r of RUNS) {
  const b = pick(JSON.parse(readFileSync(r.base, 'utf8')));
  const p = pick(JSON.parse(readFileSync(r.post, 'utf8')));
  summary.runs[r.id] = { baseline: b, post: p };

  const perfDelta = p.perf - b.perf;
  const a11yDelta = p.a11y - b.a11y;
  const lcpDelta = (b.LCP != null && p.LCP != null) ? p.LCP - b.LCP : 0;
  const isHomeMobile = r.id === 'home-mobile';

  const perfPass = perfDelta >= -5;
  const a11yPass = a11yDelta >= 0;
  const lcpPass = !isHomeMobile || lcpDelta <= 200;

  if (perfPass) passed++; else failed++;
  if (a11yPass) passed++; else failed++;
  if (lcpPass) passed++; else failed++;

  const fmt = (a, c, ok) => `${String(a).padStart(3)}→${String(c).padStart(3)} ${ok ? '✓' : '✗'}`;
  const lcpFmt = `${String(Math.round(b.LCP)).padStart(5)}→${String(Math.round(p.LCP)).padStart(5)} ${lcpPass ? '✓' : '✗'}${isHomeMobile ? ' (Δ' + (lcpDelta>=0?'+':'') + Math.round(lcpDelta) + ', budget ≤200)' : ' (info)'}`;
  console.log(`${r.id.padEnd(18)} | ${fmt(b.perf, p.perf, perfPass)} | ${fmt(b.a11y, p.a11y, a11yPass)} | ${lcpFmt}`);
}

writeFileSync('baseline/baseline-vs-post-lighthouse-final.json', JSON.stringify(summary, null, 2));
console.log(`\nPassed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
