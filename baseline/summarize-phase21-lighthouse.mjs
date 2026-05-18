// Read 4 Phase 2.1 Lighthouse reports + Phase 1 baseline-vs-post final report.
// Compute deltas vs both Pre_Phase_2_1_Baseline (= Phase 1 final post values)
// and emit a Phase 2.1 regression table.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const RUNS = [
  { id: 'home-desktop',    file: 'baseline/phase21-lh-home-desktop.report.json' },
  { id: 'home-mobile',     file: 'baseline/phase21-lh-home-mobile.report.json' },
  { id: 'article-desktop', file: 'baseline/phase21-lh-article-desktop.report.json' },
  { id: 'article-mobile',  file: 'baseline/phase21-lh-article-mobile.report.json' },
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
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
    },
    metrics: {
      LCP_ms: numeric('largest-contentful-paint'),
      FCP_ms: numeric('first-contentful-paint'),
      CLS: numeric('cumulative-layout-shift'),
      TBT_ms: numeric('total-blocking-time'),
      SI_ms: numeric('speed-index'),
    },
  };
}

const summary = { capturedAt: new Date().toISOString(), runs: {} };
for (const r of RUNS) {
  if (!existsSync(r.file)) {
    console.warn('skip missing', r.file);
    continue;
  }
  const report = JSON.parse(readFileSync(r.file, 'utf8'));
  summary.runs[r.id] = pick(report);
}

writeFileSync('baseline/post-phase21-lighthouse.json', JSON.stringify(summary, null, 2));

// Phase_1_Baseline final values (from Phase 1 changelog).
// These are the post-Phase-1 production values that Phase 2.1 must not regress.
const PHASE1_FINAL = {
  'home-desktop':    { perf: 91, a11y: 92, lcp: 1633 },
  'home-mobile':     { perf: 86, a11y: 96, lcp: 3717 },
  'article-desktop': { perf: 96, a11y: 98, lcp: 938 },
  'article-mobile':  { perf: 97, a11y: 98, lcp: 2026 },
};

console.log('\nPhase 2.1 Lighthouse vs Phase 1 baseline');
console.log('========================================================================');
console.log('id              | Perf       | A11y       | LCP (ms)            | CLS');
console.log('----------------+------------+------------+---------------------+------');
for (const [id, run] of Object.entries(summary.runs)) {
  const s = run.scores;
  const m = run.metrics;
  const base = PHASE1_FINAL[id];
  const dPerf = base ? (s.performance - base.perf) : null;
  const dA11y = base ? (s.accessibility - base.a11y) : null;
  const dLcp = base && m.LCP_ms != null ? Math.round(m.LCP_ms - base.lcp) : null;
  const fmt = (v, w) => String(v ?? '-').padStart(w);
  const sgn = (v) => v == null ? '' : (v > 0 ? `+${v}` : `${v}`);
  const perfCell = `${fmt(s.performance, 3)} (Δ ${fmt(sgn(dPerf), 3)})`;
  const a11yCell = `${fmt(s.accessibility, 3)} (Δ ${fmt(sgn(dA11y), 3)})`;
  const lcpCell = m.LCP_ms != null
    ? `${fmt(Math.round(m.LCP_ms), 5)} (Δ ${fmt(sgn(dLcp), 5)})`
    : '-';
  const clsCell = m.CLS != null ? m.CLS.toFixed(3) : '-';
  console.log(`${id.padEnd(15)} | ${perfCell.padEnd(10)} | ${a11yCell.padEnd(10)} | ${lcpCell.padEnd(19)} | ${clsCell}`);
}
console.log('========================================================================');
console.log('Budget: Perf Δ ≥ -5, A11y Δ ≥ 0, mobile-home LCP Δ ≤ +200 ms');
