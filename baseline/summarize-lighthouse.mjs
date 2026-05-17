// Read 4 Lighthouse JSON reports and extract the metrics that matter
// for the Phase 1 regression budget (Reqs 3.11, 5.11).
import { readFileSync, writeFileSync } from 'node:fs';

const RUNS = [
  { id: 'home-desktop',    file: 'baseline/lh-home-desktop.report.json' },
  { id: 'home-mobile',     file: 'baseline/lh-home-mobile.report.json' },
  { id: 'article-desktop', file: 'baseline/lh-article-desktop.report.json' },
  { id: 'article-mobile',  file: 'baseline/lh-article-mobile.report.json' },
];

function pick(report) {
  const cats = report.categories;
  const audits = report.audits;
  const score = (k) => (cats[k] && cats[k].score != null) ? Math.round(cats[k].score * 100) : null;
  const numeric = (k) => audits[k] ? audits[k].numericValue : null;
  return {
    fetchedAt: report.fetchTime,
    finalUrl: report.finalDisplayedUrl || report.finalUrl,
    formFactor: report.configSettings?.formFactor,
    scores: {
      performance:  score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo:          score('seo'),
    },
    metrics: {
      LCP_ms:  numeric('largest-contentful-paint'),
      FCP_ms:  numeric('first-contentful-paint'),
      CLS:     numeric('cumulative-layout-shift'),
      TBT_ms:  numeric('total-blocking-time'),
      SI_ms:   numeric('speed-index'),
    },
  };
}

const summary = { capturedAt: new Date().toISOString(), runs: {} };
for (const r of RUNS) {
  const report = JSON.parse(readFileSync(r.file, 'utf8'));
  summary.runs[r.id] = pick(report);
}

writeFileSync('baseline/baseline-lighthouse.json', JSON.stringify(summary, null, 2));

// Print a human-readable table
console.log('\nLighthouse Baseline');
console.log('=====================================================');
console.log('id                | Perf | A11y | BP | SEO | LCP   | CLS');
console.log('------------------+------+------+----+-----+-------+------');
for (const [id, run] of Object.entries(summary.runs)) {
  const s = run.scores;
  const m = run.metrics;
  const fmt = (v, w) => String(v ?? '-').padStart(w);
  console.log(
    `${id.padEnd(17)} | ${fmt(s.performance, 4)} | ${fmt(s.accessibility, 4)} | ${fmt(s.bestPractices, 2)} | ${fmt(s.seo, 3)} | ${fmt(m.LCP_ms ? Math.round(m.LCP_ms) : null, 5)} | ${fmt(m.CLS != null ? m.CLS.toFixed(3) : null, 5)}`
  );
}
console.log('=====================================================');
console.log('Saved to baseline/baseline-lighthouse.json');
