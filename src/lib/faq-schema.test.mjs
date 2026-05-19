// Unit tests for src/lib/faq-schema.ts
//
// Run with:  node --test --experimental-strip-types src/lib/faq-schema.test.mjs
// or via the npm script:  npm run test:phase1
//
// Tests cover Phase 2.2 requirements 2.3-2.7, 2.11:
//   - required fields (@context, @type, mainEntity with Question + acceptedAnswer)
//   - conditional skipping (empty/whitespace question or answer)
//   - null return when zero valid items
//   - deterministic JSON output
//   - malformed input (non-array, non-string fields)
//   - filterFaqItems exposed for FaqSection byte-match parity

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFaqPageSchema, filterFaqItems } from './faq-schema.ts';

test('Req 2.3/2.5: required fields populated for one valid item', () => {
  const out = buildFaqPageSchema([
    { question: 'What is X?', answer: 'X is the answer.' },
  ]);
  assert.equal(out['@context'], 'https://schema.org');
  assert.equal(out['@type'], 'FAQPage');
  assert.equal(out.mainEntity.length, 1);
  assert.equal(out.mainEntity[0]['@type'], 'Question');
  assert.equal(out.mainEntity[0].name, 'What is X?');
  assert.deepEqual(out.mainEntity[0].acceptedAnswer, {
    '@type': 'Answer',
    text: 'X is the answer.',
  });
});

test('Req 2.4: mainEntity preserves input order', () => {
  const out = buildFaqPageSchema([
    { question: 'Q1', answer: 'A1' },
    { question: 'Q2', answer: 'A2' },
    { question: 'Q3', answer: 'A3' },
  ]);
  assert.deepEqual(
    out.mainEntity.map((m) => m.name),
    ['Q1', 'Q2', 'Q3'],
  );
});

test('Req 2.5: trims whitespace from question and answer', () => {
  const out = buildFaqPageSchema([
    { question: '  Q with spaces  ', answer: '\n A with newlines \t' },
  ]);
  assert.equal(out.mainEntity[0].name, 'Q with spaces');
  assert.equal(out.mainEntity[0].acceptedAnswer.text, 'A with newlines');
});

test('Req 2.6: skips items with empty/whitespace question', () => {
  const out = buildFaqPageSchema([
    { question: 'Valid Q', answer: 'Valid A' },
    { question: '', answer: 'Orphan answer' },
    { question: '   ', answer: 'Whitespace question' },
    { question: 'Another Valid', answer: 'OK' },
  ]);
  assert.equal(out.mainEntity.length, 2);
  assert.deepEqual(
    out.mainEntity.map((m) => m.name),
    ['Valid Q', 'Another Valid'],
  );
});

test('Req 2.7: skips items with empty/whitespace answer', () => {
  const out = buildFaqPageSchema([
    { question: 'Q1', answer: '' },
    { question: 'Q2', answer: '   \n  ' },
    { question: 'Q3', answer: 'Valid' },
  ]);
  assert.equal(out.mainEntity.length, 1);
  assert.equal(out.mainEntity[0].name, 'Q3');
});

test('Req 3.2: returns null when input array is empty', () => {
  assert.equal(buildFaqPageSchema([]), null);
});

test('Req 3.2: returns null when all items are filtered out', () => {
  const out = buildFaqPageSchema([
    { question: '', answer: '' },
    { question: '   ', answer: 'Orphan' },
    { question: 'Orphan', answer: '' },
  ]);
  assert.equal(out, null);
});

test('Req 5.14: graceful with malformed input (null, non-array, missing fields)', () => {
  assert.equal(buildFaqPageSchema(null), null);
  assert.equal(buildFaqPageSchema(undefined), null);
  assert.equal(buildFaqPageSchema('not an array'), null);
  assert.equal(buildFaqPageSchema({ not: 'an array' }), null);
  assert.equal(buildFaqPageSchema([{ no_question: 'oops' }]), null);
  assert.equal(buildFaqPageSchema([{ question: 123, answer: 'x' }]), null);
});

test('Req 2.11: deterministic — two builds with same input produce identical JSON', () => {
  const items = [
    { question: 'Q1', answer: 'A1' },
    { question: 'Q2', answer: 'A2' },
  ];
  const a = JSON.stringify(buildFaqPageSchema(items));
  const b = JSON.stringify(buildFaqPageSchema(items));
  assert.equal(a, b);
});

test('Req 3.8: filterFaqItems exposed for FaqSection byte-match parity', () => {
  const items = [
    { question: '  Q1  ', answer: '  A1  ' },
    { question: '', answer: 'orphan' },
    { question: 'Q3', answer: 'A3' },
  ];
  const filtered = filterFaqItems(items);
  assert.deepEqual(filtered, [
    { question: 'Q1', answer: 'A1' },
    { question: 'Q3', answer: 'A3' },
  ]);
});

test('Req 3.8: filterFaqItems and buildFaqPageSchema produce byte-identical text content', () => {
  const items = [
    { question: '  Salesforce market share?  ', answer: '23% as of 2026.' },
    { question: '', answer: 'skip me' },
    { question: 'Employee count?', answer: '79,000 as of 2026.' },
  ];
  const filtered = filterFaqItems(items);
  const schema = buildFaqPageSchema(items);
  assert.equal(filtered.length, schema.mainEntity.length);
  for (let i = 0; i < filtered.length; i++) {
    assert.equal(filtered[i].question, schema.mainEntity[i].name);
    assert.equal(filtered[i].answer, schema.mainEntity[i].acceptedAnswer.text);
  }
});
