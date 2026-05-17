// Pre-build step: copy the Fraunces variable font (latin subset, opsz axis)
// from node_modules into public/fonts so it ships at a stable URL on our
// origin and can be preloaded by BaseLayout.astro.
//
// Source filename: fraunces-latin-opsz-normal.woff2  (~67 KB, wght 100-900 + opsz 9-144)
// Destination:     public/fonts/fraunces-variable-latin.woff2
//
// Idempotent: skips the copy if the destination already exists with the
// same byte length, so `npm run dev` doesn't churn on every restart.

import { mkdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

const SRC = 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2';
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
