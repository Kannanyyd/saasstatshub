// Unit tests for src/lib/dropcap.ts
//
// Run via:  npm run test:phase1

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { withDropCap } from './dropcap.ts';

test('wraps first letter of first <p>', () => {
  const html = '<p>The SaaS market is growing.</p><p>More text.</p>';
  const out = withDropCap(html);
  assert.equal(
    out,
    '<p><span class="drop-cap">T</span>he SaaS market is growing.</p><p>More text.</p>',
  );
});

test('wraps first digit when paragraph starts with a number', () => {
  const html = '<p>2026 was a great year for SaaS.</p>';
  const out = withDropCap(html);
  assert.ok(out.startsWith('<p><span class="drop-cap">2</span>026'));
});

test('preserves <p> attributes', () => {
  const html = '<p class="lead" id="intro">Hello world.</p>';
  const out = withDropCap(html);
  assert.equal(
    out,
    '<p class="lead" id="intro"><span class="drop-cap">H</span>ello world.</p>',
  );
});

test('preserves leading whitespace inside <p>', () => {
  const html = '<p>   Padded paragraph.</p>';
  const out = withDropCap(html);
  assert.ok(out.includes('<p>   <span class="drop-cap">P</span>added'));
});

test('skips when first non-space char is punctuation (e.g. quote)', () => {
  const html = '<p>"Quoted" paragraph.</p>';
  const out = withDropCap(html);
  assert.equal(out, html);
});

test('idempotent — already wrapped paragraph is left alone', () => {
  const html = '<p><span class="drop-cap">T</span>he start.</p>';
  const out = withDropCap(html);
  assert.equal(out, html);
});

test('handles empty input', () => {
  assert.equal(withDropCap(''), '');
});

test('handles missing <p> by returning input unchanged', () => {
  const html = '<h2>No paragraph here</h2>';
  assert.equal(withDropCap(html), html);
});

test('only wraps the FIRST paragraph, not subsequent ones', () => {
  const html = '<p>First paragraph.</p><p>Second paragraph.</p>';
  const out = withDropCap(html);
  assert.ok(out.includes('<span class="drop-cap">F</span>irst'));
  assert.ok(!out.includes('<span class="drop-cap">S</span>econd'));
});

test('handles unicode letters (non-ASCII)', () => {
  const html = '<p>Über alles.</p>';
  const out = withDropCap(html);
  assert.ok(out.includes('<span class="drop-cap">Ü</span>ber'));
});
