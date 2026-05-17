// Phase 1 Task 17: A11y + contrast audit using static analysis.
//
// Uses two strategies that don't require a browser:
//   1. WCAG 2.1 contrast ratio computed from the resolved hex token values
//      (Reqs 1.3, 1.4, 1.5, 1.6, 1.13, 1.14, 2.14)
//   2. DOM-attribute audit on built HTML (Reqs 4.7, 4.8, 4.9, 2.13, 2.14)

import { readFileSync } from 'node:fs';

const HOME = readFileSync('dist/index.html', 'utf8');
const ARTICLE = readFileSync('dist/analytics/saas-market-size-statistics/index.html', 'utf8');

let passed = 0;
let failed = 0;
function check(name, condition, detail = '') {
  if (condition) { console.log(`  ✅ ${name}${detail ? '  (' + detail + ')' : ''}`); passed++; }
  else { console.log(`  ❌ ${name}${detail ? '  — ' + detail : ''}`); failed++; }
}

// ---------- WCAG 2.1 contrast helpers ----------
function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relativeLuminance(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrast(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

// ---------- Token values (must match @theme block in src/styles/global.css) ----------
const TOKENS = {
  bg: '#0A0F1F',
  bgAlt: '#0F172A',
  bgWarm: '#111827',
  surface: '#0F1A2E',
  surfaceElevated: '#162238',
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  border: '#1E293B',
  borderStrong: '#64748B',
  primary: '#3B82F6',
  positive: '#34D399',
  negative: '#F87171',
  neutral: '#94A3B8',
};

console.log('=== Contrast ratios vs --color-bg #0A0F1F (Reqs 1.3–1.6, 1.14) ===');
const fg = (c) => contrast(c, TOKENS.bg).toFixed(2);
check(`--color-text (#F1F5F9) ≥ 7.0 (AAA body)`, contrast(TOKENS.text, TOKENS.bg) >= 7.0, `${fg(TOKENS.text)}:1`);
check(`--color-text-secondary (#CBD5E1) ≥ 4.5 (AA)`, contrast(TOKENS.textSecondary, TOKENS.bg) >= 4.5, `${fg(TOKENS.textSecondary)}:1`);
check(`--color-text-muted (#94A3B8) ≥ 3.0 (large text)`, contrast(TOKENS.textMuted, TOKENS.bg) >= 3.0, `${fg(TOKENS.textMuted)}:1`);
check(`--color-positive (#34D399) ≥ 4.5`, contrast(TOKENS.positive, TOKENS.bg) >= 4.5, `${fg(TOKENS.positive)}:1`);
check(`--color-negative (#F87171) ≥ 4.5`, contrast(TOKENS.negative, TOKENS.bg) >= 4.5, `${fg(TOKENS.negative)}:1`);
check(`--color-primary (#3B82F6) ≥ 4.5 link/CTA`, contrast(TOKENS.primary, TOKENS.bg) >= 4.5, `${fg(TOKENS.primary)}:1`);

console.log('\n=== Form input border contrast vs surface (Req 1.13) ===');
// Form input borders use --color-border-strong; must be ≥ 3:1 vs both
// the surrounding card surface and the input's own background.
check(`Input border --color-border-strong ≥ 3.0 vs --color-surface`,
  contrast(TOKENS.borderStrong, TOKENS.surface) >= 3.0,
  `${contrast(TOKENS.borderStrong, TOKENS.surface).toFixed(2)}:1`);
check(`Input border --color-border-strong ≥ 3.0 vs --color-bg`,
  contrast(TOKENS.borderStrong, TOKENS.bg) >= 3.0,
  `${contrast(TOKENS.borderStrong, TOKENS.bg).toFixed(2)}:1`);
check(`Input border --color-border-strong ≥ 3.0 vs --color-surface-elevated`,
  contrast(TOKENS.borderStrong, TOKENS.surfaceElevated) >= 3.0,
  `${contrast(TOKENS.borderStrong, TOKENS.surfaceElevated).toFixed(2)}:1`);

console.log('\n=== Footer text contrast vs --color-surface (Req 1.14) ===');
check(`Footer body text-secondary ≥ 4.5 vs surface`,
  contrast(TOKENS.textSecondary, TOKENS.surface) >= 4.5,
  `${contrast(TOKENS.textSecondary, TOKENS.surface).toFixed(2)}:1`);
check(`Footer muted text-muted ≥ 3.0 vs surface`,
  contrast(TOKENS.textMuted, TOKENS.surface) >= 3.0,
  `${contrast(TOKENS.textMuted, TOKENS.surface).toFixed(2)}:1`);

// ---------- DOM attribute audit ----------
console.log('\n=== Icon a11y (Reqs 4.7, 4.8) — homepage ===');
const allSvgs = [...HOME.matchAll(/<svg\b[^>]*>/g)].map((m) => m[0]);
const hidden = allSvgs.filter((t) => /aria-hidden="true"/.test(t)).length;
const labeled = allSvgs.filter((t) => /role="img"\s+aria-label="[^"]+"/.test(t)).length;
const orphan = allSvgs.filter((t) => !/aria-hidden="true"/.test(t) && !/role="img"\s+aria-label="[^"]+"/.test(t));
check(`All SVGs have aria-hidden OR role+aria-label`, orphan.length === 0,
  `total ${allSvgs.length}, hidden ${hidden}, labeled ${labeled}, orphan ${orphan.length}`);

console.log('\n=== Standalone icon controls (Req 4.7) ===');
check(`#search-toggle button has aria-label`, /<button[^>]*id="search-toggle"[^>]*aria-label="[^"]+"/.test(HOME));
check(`#mobile-menu-toggle button has aria-label`, /<button[^>]*id="mobile-menu-toggle"[^>]*aria-label="[^"]+"/.test(HOME));

console.log('\n=== Sparkline a11y (Req 2.13) — homepage ===');
const sparkSvgs = [...HOME.matchAll(/<svg\b[^>]*class="[^"]*sparkline[^"]*"[^>]*>/g)].map((m) => m[0]);
const sparkLabeled = sparkSvgs.filter((t) => /role="img"/.test(t) && /aria-label="Trend:[^"]+"/.test(t)).length;
check(`All sparklines have role=img + Trend: aria-label`, sparkSvgs.length > 0 && sparkLabeled === sparkSvgs.length,
  `${sparkLabeled}/${sparkSvgs.length}`);

console.log('\n=== Article-page sparkline + icon a11y ===');
const artSvgs = [...ARTICLE.matchAll(/<svg\b[^>]*>/g)].map((m) => m[0]);
const artOrphan = artSvgs.filter((t) => !/aria-hidden="true"/.test(t) && !/role="img"/.test(t));
check(`All SVGs on article page have a11y attribute`, artOrphan.length === 0,
  `total ${artSvgs.length}, orphan ${artOrphan.length}`);

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
