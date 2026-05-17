// Phase 1 Task 16: verify all existing animations and their DOM hooks
// survived the visual uplift (Reqs 1.8, 1.9, 3.14).
//
// Strategy:
//   1. Load the built homepage and a representative article page.
//   2. Confirm each named DOM hook is present (selector-by-selector).
//   3. Load the built _astro CSS and confirm each animation @keyframes
//      block + the reduced-motion override block are present.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const HOME = readFileSync('dist/index.html', 'utf8');
const ARTICLE = readFileSync('dist/analytics/saas-market-size-statistics/index.html', 'utf8');

// Load the bundled CSS file (Astro emits one or two _astro/*.css chunks).
const cssDir = 'dist/_astro';
const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
let CSS = cssFiles.map((f) => readFileSync(join(cssDir, f), 'utf8')).join('\n');

// Astro inlines scoped <style> blocks (e.g. from Sparkline.astro) into
// the <head> of each page that uses the component. Concatenate them so
// our keyframe + reduced-motion checks see the full ruleset.
const inlineStyleBlocks = [...HOME.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
CSS += '\n' + inlineStyleBlocks.join('\n');

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

console.log('=== DOM hooks (homepage) ===');
check('Hero typewriter target [data-typewriter]', HOME.includes('data-typewriter'));
check('Hero tagline #hero-tagline', /id="hero-tagline"/.test(HOME));
check('Hero gradient highlight span', HOME.includes('background-clip: text'));
check('Hot Stat count-up [data-count-up]', HOME.includes('data-count-up'));
check('Hero floating mini-card .animate-float', /class="[^"]*animate-float/.test(HOME));
check('Hero stat card surface .hero-stat-card', HOME.includes('class="hero-stat-card'));
check('Tech-border on Hero mini-cards', /class="tech-border/.test(HOME));
check('Spotlight target .article-card or .category-card', /class="article-card|class="category-card/.test(HOME));

console.log('\n=== DOM hooks (article page) ===');
check('Reading-progress bar #reading-progress', /id="reading-progress"/.test(ARTICLE));
check('Article body wrapper .article-body', ARTICLE.includes('class="article-body"'));

console.log('\n=== Animation @keyframes (compiled CSS) ===');
const keyframes = ['fadeInUp', 'fadeIn', 'shimmer', 'float', 'pulse-glow', 'count-up', 'scanline', 'grid-pan', 'border-flow', 'pulse-dot', 'blink-caret', 'line-draw', 'ticker-blink', 'sparkline-draw'];
for (const kf of keyframes) {
  check(`@keyframes ${kf}`, CSS.includes(`@keyframes ${kf}`));
}

console.log('\n=== Reduced-motion override (Req 1.9, 2.15) ===');
check('@media (prefers-reduced-motion: reduce) block exists', /prefers-reduced-motion:\s*reduce/.test(CSS));
const reducedBlock = CSS.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}\s*\}/);
if (reducedBlock) {
  const body = reducedBlock[0];
  check('  .animate-fade-in-up suppressed', body.includes('animate-fade-in-up'));
  check('  .animate-float suppressed', body.includes('animate-float'));
  check('  .bg-tech-grid-animated suppressed', body.includes('bg-tech-grid-animated'));
  check('  .tech-border::before suppressed', body.includes('tech-border'));
  check('  .live-dot suppressed', body.includes('live-dot'));
}
// Sparkline scoped CSS uses its own reduced-motion media query inside a scoped block.
check('Sparkline reduced-motion override exists', /sparkline__line[\s\S]{0,300}prefers-reduced-motion/.test(CSS) || /prefers-reduced-motion[\s\S]{0,300}sparkline__line/.test(CSS));

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
