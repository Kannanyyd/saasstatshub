// Pre-build step: copy the Fraunces variable font (latin subset, wght axis)
// from node_modules into public/fonts so it ships at a stable URL on our
// origin and can be preloaded by BaseLayout.astro.
//
// Source filename: fraunces-latin-wght-normal.woff2  (~36 KB, wght 100-900)
// Destination:     public/fonts/fraunces-variable-latin.woff2
//
// Note: we use the wght-only subset (not opsz) to keep the LCP regression
// budget at home-mobile within Req 3.11's +200ms ceiling. Drop-cap still
// renders correctly via standard font-size scaling — opsz is a fine-tuning
// nicety, not a visual requirement.
//
// Idempotent: skips the copy if the destination already exists with the
// same byte length, so `npm run dev` doesn't churn on every restart.

import { mkdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

const SRC = 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2';
const DST = 'public/fonts/fraunces-variable-latin.woff2';

if (!existsSync(SRC)) {
  console.error(`[copy-fonts] Source missing: ${SRC}`);
  console.error(`[copy-fonts] Did you run "npm install"? The @fontsource-variable/fraunces package must be present.`);
  process.exit(1);
}

mkdirSync(dirname(DST), { recursive: true });

if (existsSync(DST) && statSync(DST).size === statSync(SRC).size) {
  console.log(`[copy-fonts] ${DST} already up-to-date (${statSync(DST).size} bytes)`);
  process.exit(0);
}

copyFileSync(SRC, DST);
console.log(`[copy-fonts] Copied ${SRC} -> ${DST} (${statSync(DST).size} bytes)`);
