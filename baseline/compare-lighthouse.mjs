// Phase 1 Task 19: regression check post-phase Lighthouse vs baseline.
// Reqs 3.11 (LCP ≤ 200ms regression) and 5.11 (Perf ≤ 5pt regression, A11y ≥ baseline).

import { readFileSync, writeFileSync } from 'node:fs';

const RUNS = [
  { id: 'home-desktop',    base: 'baseline/lh-home-desktop.report.json',    post: 'baseline/post-lh-home-desktop.report.json'    },
  { id: 'home-mobile',     base: 'baseline/lh-home-mobile.report.json',     post: 'baseline/post-lh-home-mobile.report.json'     },
  { id: 'article-desktop', base: 'baseline/lh-article-desktop.report.json', post: 'baseline/post-lh-article-desktop.report.json' },
  { id: 'article-mobile',  base: 'baseline/lh-article-mobile.report.json',  post: 'baseline/post-lh-article-mobile.report.json'  },
];

function pick(report) {
  const cats = report.categories;
  const audits = report.audits;
  const score = (k) => (cats[k] && cats[k].score != null) ? Math.round(cats[k].score * 100) : null;
  const numeric = (k) => audits[k] ? audits[k].numericValue : null;
  return {
    perf: score('performance'),
    a11y: score('accessibility'),
    bp:   score('best-practices'),
    seo:  score('seo'),
    LCP:  numeric('largest-contentful-paint'),
    CLS:  numeric('cumulative-layout-shift'),
    TBT:  numeric('total-blocking-time'),
  };
}

let passed = 0, failed = 0;
function check(name, condition, detail = '') {
  if (condition) { console.log(`  ✅ ${name}${detail ? '  (' + detail + ')' : ''}`); passed++; }
  else { console.log(`  ❌ ${name}${detail ? '  — ' + detail : ''}`); failed++; }
}

const summary = { capturedAt: new Date().toISOString(), runs: {} };

for (const r of RUNS) {
  const baseReport = JSON.parse(readFileSync(r.base, 'utf8'));
  const postReport = JSON.parse(readFileSync(r.post, 'utf8'));
  const baseM = pick(baseReport);
  const postM = pick(postReport);
  summary.runs[r.id] = { baseline: baseM, post: postM };

  console.log(`\n=== ${r.id} ===`);
  // Perf score: regression ≤ 5 points
  if (baseM.perf != null && postM.perf != null) {
    const delta = postM.perf - baseM.perf;
    check(`Performance ${baseM.perf} → ${postM.perf} (Δ ${delta >= 0 ? '+' : ''}${delta}); ≤ 5pt regression`,
      delta >= -5);
  }
  // A11y score: ≥ baseline
  if (baseM.a11y != null && postM.a11y != null) {
    const delta = postM.a11y - baseM.a11y;
    check(`Accessibility ${baseM.a11y} → ${postM.a11y} (Δ ${delta >= 0 ? '+' : ''}${delta}); ≥ baseline`,
      delta >= 0);
  }
  // LCP: only mobile homepage tracked per Req 3.11; report all 4 for transparency.
  if (baseM.LCP != null && postM.LCP != null) {
    const lcpDelta = postM.LCP - baseM.LCP;
    const isHomeMobile = r.id === 'home-mobile';
    if (isHomeMobile) {
      check(`LCP ${Math.round(baseM.LCP)}ms → ${Math.round(postM.LCP)}ms (Δ ${lcpDelta >= 0 ? '+' : ''}${Math.round(lcpDelta)}ms); ≤ 200ms regression (Req 3.11)`,
        lcpDelta <= 200);
    } else {
      console.log(`  ℹ️  LCP ${Math.round(baseM.LCP)}ms → ${Math.round(postM.LCP)}ms (Δ ${lcpDelta >= 0 ? '+' : ''}${Math.round(lcpDelta)}ms) — informational only`);
    }
  }
}

writeFileSync('baseline/baseline-vs-post-lighthouse.json', JSON.stringify(summary, null, 2));

// Compact comparison table
console.log('\n=== Comparison summary ===');
console.log('id                 | Perf       | A11y       | LCP (ms)');
console.log('-------------------+------------+------------+---------------');
for (const [id, run] of Object.entries(summary.runs)) {
  const b = run.baseline, p = run.post;
  const fmt = (a, c) => a == null ? '   - ' : `${String(a).padStart(3)}→${String(c).padStart(3)} `;
  const lcpFmt = (a, c) => a == null ? '   -   →    -' : `${String(Math.round(a)).padStart(5)} → ${String(Math.round(c)).padStart(5)}`;
  console.log(
    `${id.padEnd(18)} | ${fmt(b.perf, p.perf)}| ${fmt(b.a11y, p.a11y)}| ${lcpFmt(b.LCP, p.LCP)}`
  );
}

console.log(`\nPassed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
