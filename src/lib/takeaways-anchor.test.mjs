import assert from 'node:assert/strict';
import test from 'node:test';

import { needsTakeawaysAnchor } from './takeaways-anchor.ts';

test('field-only takeaways (no in-content H2) need a generated anchor', () => {
  assert.equal(needsTakeawaysAnchor('<h2>Overview</h2><p>body</p>', 10), true);
  assert.equal(needsTakeawaysAnchor('', 3), true);
});

test('in-content Key Takeaways H2 already provides the anchor — do not duplicate', () => {
  assert.equal(needsTakeawaysAnchor('<h2>Overview</h2><h2>Key Takeaways</h2><ul><li>a</li></ul>', 5), false);
  assert.equal(needsTakeawaysAnchor('<h2 id="key-takeaways">Key Takeaways</h2>', 0), false);
});

test('explicit existing anchor suppresses generation regardless of shape', () => {
  assert.equal(needsTakeawaysAnchor('<span id="key-takeaways"></span><p>x</p>', 4), false);
});

test('no takeaways at all — never generate an anchor', () => {
  assert.equal(needsTakeawaysAnchor('<h2>Overview</h2>', 0), false);
  assert.equal(needsTakeawaysAnchor('', 0), false);
});
