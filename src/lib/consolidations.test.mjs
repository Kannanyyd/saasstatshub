import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const rules = JSON.parse(
  fs.readFileSync(new URL('../data/url-consolidations.json', import.meta.url), 'utf8'),
);
const redirects = fs.readFileSync(
  new URL('../../public/_redirects', import.meta.url),
  'utf8',
);
const wpApi = fs.readFileSync(new URL('./wp-api.ts', import.meta.url), 'utf8');
const catalogGenerator = fs.readFileSync(
  new URL('../../scripts/generate-research-catalog.mjs', import.meta.url),
  'utf8',
);

test('consolidation manifest contains unique, acyclic routes', () => {
  assert.equal(rules.length, 13);
  const sources = rules.map((rule) => `${rule.sourceCategory}/${rule.sourceSlug}`);
  const destinations = rules.map(
    (rule) => `${rule.destinationCategory}/${rule.destinationSlug}`,
  );
  assert.equal(new Set(sources).size, rules.length);
  assert.equal(new Set(destinations).size, rules.length);
  for (const source of sources) {
    assert.ok(!destinations.includes(source), `destination points to retired route: ${source}`);
  }
});

test('every consolidation has slash and no-slash permanent redirects', () => {
  for (const rule of rules) {
    const source = `/${rule.sourceCategory}/${rule.sourceSlug}`;
    const destination = `/${rule.destinationCategory}/${rule.destinationSlug}/`;
    assert.match(redirects, new RegExp(`^${source}/ ${destination} 301$`, 'm'));
    assert.match(redirects, new RegExp(`^${source} ${destination} 301$`, 'm'));
  }
});

test('published surfaces filter consolidated slugs centrally', () => {
  assert.match(wpApi, /activePosts\(data\.posts\.nodes\)/);
  assert.match(wpApi, /isConsolidatedSlug\(post\.slug\)/);
  assert.match(wpApi, /isConsolidatedSlug\(node\.slug\)/);
  assert.match(catalogGenerator, /consolidatedSlugs\.has\(post\.slug\)/);
});
