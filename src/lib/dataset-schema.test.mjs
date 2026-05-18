// Unit tests for src/lib/dataset-schema.ts
//
// Run with:  node --test --experimental-strip-types src/lib/dataset-schema.test.mjs
// or via the npm script:  npm run test:phase1
//
// Tests cover Phase 2.1 requirements 3.2–3.13 and 3.16:
//   - required fields (@context, @type, name, description, creator, license, distribution)
//   - description fallback to title when cleanExcerpt empty
//   - keywords splitting / trimming / dropping empties / omission
//   - creator Organization shape with site origin
//   - license literal CC BY-NC 4.0 URL
//   - distribution DataDownload with text/html and canonical URL
//   - temporalCoverage pass-through and conditional omission
//   - variableMeasured PropertyValue array and conditional omission
//   - deterministic JSON output

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDatasetSchema } from './dataset-schema.ts';

const baseProps = {
  title: 'SaaS Market Size 2026',
  cleanExcerpt: 'A comprehensive overview of the SaaS market.',
  canonicalURL: 'https://saasstatshub.com/analytics/saas-market-size-statistics-2026/',
  siteOrigin: 'https://saasstatshub.com',
};

test('Req 3.2/3.3/3.4: required fields populated', () => {
  const out = buildDatasetSchema(baseProps);
  assert.equal(out['@context'], 'https://schema.org');
  assert.equal(out['@type'], 'Dataset');
  assert.equal(out.name, baseProps.title);
  assert.equal(out.description, baseProps.cleanExcerpt);
});

test('Req 3.5: empty cleanExcerpt → description falls back to title', () => {
  const out = buildDatasetSchema({ ...baseProps, cleanExcerpt: '' });
  assert.equal(out.description, baseProps.title);
});

test('Req 3.6: focusKeywords splits, trims, drops empties', () => {
  const out = buildDatasetSchema({
    ...baseProps,
    focusKeywords: 'saas, market size,  2026,, growth ',
  });
  assert.deepEqual(out.keywords, ['saas', 'market size', '2026', 'growth']);
});

test('Req 3.7: empty / whitespace / absent focusKeywords → keywords field omitted', () => {
  const out1 = buildDatasetSchema({ ...baseProps, focusKeywords: '' });
  const out2 = buildDatasetSchema({ ...baseProps, focusKeywords: '   ,  ' });
  const out3 = buildDatasetSchema({ ...baseProps });
  assert.equal('keywords' in out1, false);
  assert.equal('keywords' in out2, false);
  assert.equal('keywords' in out3, false);
});

test('Req 3.8: creator is Organization with site origin url', () => {
  const out = buildDatasetSchema(baseProps);
  assert.deepEqual(out.creator, {
    '@type': 'Organization',
    name: 'SaaSStatsHub',
    url: 'https://saasstatshub.com',
  });
});

test('Req 3.9: license is the locked CC BY-NC 4.0 URL', () => {
  const out = buildDatasetSchema(baseProps);
  assert.equal(out.license, 'https://creativecommons.org/licenses/by-nc/4.0/');
});

test('Req 3.10: distribution is DataDownload with text/html and canonical URL', () => {
  const out = buildDatasetSchema(baseProps);
  assert.deepEqual(out.distribution, {
    '@type': 'DataDownload',
    encodingFormat: 'text/html',
    contentUrl: baseProps.canonicalURL,
  });
});

test('Req 3.11: lastUpdated present → temporalCoverage emitted (trimmed)', () => {
  const out = buildDatasetSchema({ ...baseProps, lastUpdated: '  2026-04-12  ' });
  assert.equal(out.temporalCoverage, '2026-04-12');
});

test('Req 3.11: lastUpdated empty / whitespace / absent → temporalCoverage omitted', () => {
  const out1 = buildDatasetSchema({ ...baseProps, lastUpdated: '' });
  const out2 = buildDatasetSchema({ ...baseProps, lastUpdated: '   ' });
  const out3 = buildDatasetSchema({ ...baseProps });
  assert.equal('temporalCoverage' in out1, false);
  assert.equal('temporalCoverage' in out2, false);
  assert.equal('temporalCoverage' in out3, false);
});

test('Req 3.12: quickOverview populated → variableMeasured array of PropertyValue', () => {
  const out = buildDatasetSchema({
    ...baseProps,
    quickOverview: [
      { statLabel: 'Market Size 2026', statValue: '$307B' },
      { statLabel: 'CAGR', statValue: '13.7%' },
    ],
  });
  assert.deepEqual(out.variableMeasured, [
    { '@type': 'PropertyValue', name: 'Market Size 2026', description: '$307B' },
    { '@type': 'PropertyValue', name: 'CAGR', description: '13.7%' },
  ]);
});

test('Req 3.13: empty / absent quickOverview → variableMeasured omitted', () => {
  const out1 = buildDatasetSchema({ ...baseProps, quickOverview: [] });
  const out2 = buildDatasetSchema({ ...baseProps });
  assert.equal('variableMeasured' in out1, false);
  assert.equal('variableMeasured' in out2, false);
});

test('Req 3.16: deterministic — two builds with same input produce byte-identical JSON', () => {
  const props = {
    ...baseProps,
    focusKeywords: 'a, b, c',
    lastUpdated: '2026-04-12',
    quickOverview: [{ statLabel: 'X', statValue: '1' }],
  };
  const a = JSON.stringify(buildDatasetSchema(props));
  const b = JSON.stringify(buildDatasetSchema(props));
  assert.equal(a, b);
});

test('Req 3.14: field order in JSON matches design contract', () => {
  // Field order influences byte-level diffing. The implementation builds
  // required fields first (@context, @type, name, description, creator,
  // license, distribution), then conditionally appends keywords,
  // temporalCoverage, variableMeasured.
  const props = {
    ...baseProps,
    focusKeywords: 'a',
    lastUpdated: '2026-04-12',
    quickOverview: [{ statLabel: 'X', statValue: '1' }],
  };
  const json = JSON.stringify(buildDatasetSchema(props));
  const idxs = [
    json.indexOf('"@context"'),
    json.indexOf('"@type"'),
    json.indexOf('"name"'),
    json.indexOf('"description"'),
    json.indexOf('"creator"'),
    json.indexOf('"license"'),
    json.indexOf('"distribution"'),
    json.indexOf('"keywords"'),
    json.indexOf('"temporalCoverage"'),
    json.indexOf('"variableMeasured"'),
  ];
  for (let i = 1; i < idxs.length; i++) {
    assert.ok(idxs[i] > idxs[i - 1], `field at index ${i} should come after index ${i - 1}; got ${JSON.stringify(idxs)}`);
  }
});
