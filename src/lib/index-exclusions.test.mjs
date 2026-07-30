import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(
  fs.readFileSync(new URL('../data/index-exclusions.json', import.meta.url), 'utf8'),
);
const audit = fs.readFileSync(
  new URL('../../docs/seo/index-value-audit-2026-07-31.csv', import.meta.url),
  'utf8',
);
const baseLayout = fs.readFileSync(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8');
const articlePage = fs.readFileSync(
  new URL('../pages/[category]/[slug].astro', import.meta.url),
  'utf8',
);
const astroConfig = fs.readFileSync(new URL('../../astro.config.mjs', import.meta.url), 'utf8');
const catalogGenerator = fs.readFileSync(
  new URL('../../scripts/generate-research-catalog.mjs', import.meta.url),
  'utf8',
);

test('first noindex batch contains 25 unique reviewed routes', () => {
  assert.equal(manifest.pages.length, 25);
  const paths = manifest.pages.map(({ category, slug }) => `/${category}/${slug}/`);
  assert.equal(new Set(paths).size, paths.length);
  for (const path of paths) {
    const auditRow = audit.split('\n').find((line) => line.startsWith(`"${path}"`));
    assert.ok(auditRow, `missing audit evidence for ${path}`);
    assert.match(auditRow, /"noindex_review","high"/);
    assert.match(auditRow, /"0\.8[45]"/);
  }
});

test('reviewed exclusions are applied to every indexing surface', () => {
  assert.match(baseLayout, /'noindex, follow'/);
  assert.match(articlePage, /isIndexExcluded\(category!, slug!\)/);
  assert.match(astroConfig, /excludedIndexPaths\.has\(new URL\(page\)\.pathname\)/);
  assert.match(catalogGenerator, /excludedIndexPaths\.has\(`\$\{primary\.slug\}\/\$\{post\.slug\}`\)/);
});
