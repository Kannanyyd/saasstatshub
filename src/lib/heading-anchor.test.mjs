/**
 * Heading-anchor pipeline tests (tech fix 2026-11-01, anomaly A3).
 *
 * Reproduces the 575 TOC dead anchors: buildTocItems() slugged the
 * entity-DECODED heading text while injectH2Ids() slugged the raw
 * entity-ESCAPED text ("&amp;" kept the letters "amp" inside the id), so
 * <a href="#software-development-engineering-teams"> targeted an id that
 * was actually "software-development-amp-engineering-teams".
 *
 * Contract under test (buildArticleAnchors):
 *   1. ids are injected into id-less <h2>s first, then TOC items are
 *      extracted from THAT html — every toc id must exist in the html;
 *   2. explicit ids on <h2>s are preserved and reused by the TOC;
 *   3. repeated headings and auto-slug/explicit-id collisions get -2/-3
 *      suffixes — the output html must not contain duplicate ids;
 *   4. headings whose inner text contains inline tags (unmatched by the
 *      id injector) get no id and stay out of the TOC (unchanged legacy
 *      behavior, documented here);
 *   5. hasTakeaways/sources append the key-takeaways/sources items.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildArticleAnchors } from './heading-anchor.ts';

function assertAllTocIdsResolve(html, tocItems) {
  const ids = new Set([...html.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]));
  for (const item of tocItems) {
    assert.ok(ids.has(item.id), `toc id "#${item.id}" has no target in html`);
  }
}

function assertNoDuplicateIds(html) {
  const ids = [...html.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dup, [], `duplicate ids in html: ${dup.join(', ')}`);
}

test('575 repro: entity (&amp;) heading — TOC id matches the injected heading id', () => {
  const content = '<h2>Software Development &amp; Engineering Teams</h2><p>Best Pick: Jira</p>';
  const { html, tocItems } = buildArticleAnchors(content, false, 0);
  assertAllTocIdsResolve(html, tocItems);
  const item = tocItems.find((t) => t.text.includes('Software Development'));
  assert.ok(item, 'entity heading missing from TOC');
  assert.match(html, new RegExp(`id="${item.id}"`));
});

test('575 repro: all three use-case headings resolve', () => {
  const content = [
    '<h2>Use Case Recommendations</h2>',
    '<h2>Software Development &amp; Engineering Teams</h2>',
    '<h2>Startups &amp; Cross-Functional Teams Needing Flexibility</h2>',
    '<h2>Small Teams &amp; Personal Project Tracking</h2>',
  ].join('');
  const { html, tocItems } = buildArticleAnchors(content, false, 0);
  assert.equal(tocItems.length, 4);
  assertAllTocIdsResolve(html, tocItems);
});

test('numeric entity heading — TOC id matches injected id', () => {
  const content = '<h2>Jira&#8217;s Role in 2026</h2>';
  const { html, tocItems } = buildArticleAnchors(content, false, 0);
  assert.equal(tocItems.length, 1);
  assertAllTocIdsResolve(html, tocItems);
});

test('explicit id on <h2> is preserved and reused by the TOC', () => {
  const content = '<h2 id="custom-anchor">Custom Heading</h2>';
  const { html, tocItems } = buildArticleAnchors(content, false, 0);
  assert.ok(html.includes('id="custom-anchor"'));
  assert.equal(tocItems[0].id, 'custom-anchor');
});

test('repeated headings get -2 suffixes — no duplicate ids', () => {
  const content = '<h2>Overview</h2><p>a</p><h2>Overview</h2><p>b</p>';
  const { html, tocItems } = buildArticleAnchors(content, false, 0);
  assertNoDuplicateIds(html);
  assert.equal(tocItems.length, 2);
  assert.notEqual(tocItems[0].id, tocItems[1].id);
  assertAllTocIdsResolve(html, tocItems);
});

test('auto slug colliding with an existing explicit id gets a suffix', () => {
  const content = '<h2 id="overview">Explicit</h2><p>x</p><h2>Overview</h2><p>y</p>';
  const { html, tocItems } = buildArticleAnchors(content, false, 0);
  assertNoDuplicateIds(html);
  assert.equal(tocItems[0].id, 'overview');
  assert.equal(tocItems[1].id, 'overview-2');
  assertAllTocIdsResolve(html, tocItems);
});

test('inline-tag heading: no id injected, stays out of the TOC (legacy behavior)', () => {
  const content = '<h2>Foo <em>bar</em></h2><p>x</p>';
  const { html, tocItems } = buildArticleAnchors(content, false, 0);
  assert.ok(!/\bid=/.test(html), 'inline-tag heading must not receive an id');
  assert.equal(tocItems.length, 0);
});

test('hasTakeaways/sources append their items', () => {
  const content = '<h2>Body Section</h2>';
  const { tocItems } = buildArticleAnchors(content, true, 2);
  const ids = tocItems.map((t) => t.id);
  assert.ok(ids.includes('key-takeaways'));
  assert.ok(ids.includes('sources'));
  assert.equal(ids[0], 'body-section');
});
