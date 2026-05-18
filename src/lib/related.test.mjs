// Unit tests for src/lib/related.ts
//
// Run with:  node --test --experimental-strip-types src/lib/related.test.mjs
// or via the npm script:  npm run test:phase1
//
// Tests cover Phase 2.1 requirements 1.3–1.11:
//   - 5 fill-strategy branches (same ≥ 3, same = 2, same = 1, same = 0 pool ≥ 3, same = 0 pool < 3)
//   - cross-cat dedupe vs current id, same-cat ids, same primary slug
//   - deterministic sort: date desc + id asc tiebreaker
//   - same-cat-first ordering preserved

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRelatedTiles } from './related.ts';

const mk = (id, catSlug, date = '2026-04-01') => ({
  id,
  title: `Article ${id}`,
  slug: `slug-${id}`,
  excerpt: '',
  date: '',
  rawDate: date,
  image: '',
  imageAlt: '',
  readTime: 8,
  category: { name: catSlug, slug: catSlug },
});

test('Req 1.3: 4 same-cat → render 4, no cross-cat', () => {
  const same = [mk('a', 'crm'), mk('b', 'crm'), mk('c', 'crm'), mk('d', 'crm')];
  const out = resolveRelatedTiles({
    sameCategory: same,
    crossCategoryPool: [mk('z', 'hr')],
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.equal(out.length, 4);
  assert.deepEqual(out.map((t) => t.id), ['a', 'b', 'c', 'd']);
});

test('Req 1.3: 3 same-cat → render 3, no cross-cat', () => {
  const same = [mk('a', 'crm'), mk('b', 'crm'), mk('c', 'crm')];
  const out = resolveRelatedTiles({
    sameCategory: same,
    crossCategoryPool: [mk('z', 'hr')],
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.equal(out.length, 3);
  assert.equal(out.find((t) => t.id === 'z'), undefined);
});

test('Req 1.4: 2 same-cat → render 2 + 1-2 cross-cat (total 3-4)', () => {
  const same = [mk('a', 'crm'), mk('b', 'crm')];
  const cross = [mk('y', 'hr', '2026-04-10'), mk('z', 'analytics', '2026-04-12')];
  const out = resolveRelatedTiles({
    sameCategory: same,
    crossCategoryPool: cross,
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.ok(out.length >= 3 && out.length <= 4);
  assert.deepEqual(out.slice(0, 2).map((t) => t.id), ['a', 'b']);
});

test('Req 1.4: 2 same-cat + only 1 cross-cat available → total 3', () => {
  const same = [mk('a', 'crm'), mk('b', 'crm')];
  const cross = [mk('y', 'hr', '2026-04-10')];
  const out = resolveRelatedTiles({
    sameCategory: same,
    crossCategoryPool: cross,
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.equal(out.length, 3);
  assert.deepEqual(out.map((t) => t.id), ['a', 'b', 'y']);
});

test('Req 1.5: 1 same-cat → render 1 + 2 cross-cat (total 3)', () => {
  const same = [mk('a', 'crm')];
  const cross = [
    mk('y', 'hr', '2026-04-10'),
    mk('z', 'analytics', '2026-04-12'),
    mk('w', 'security', '2026-04-08'),
  ];
  const out = resolveRelatedTiles({
    sameCategory: same,
    crossCategoryPool: cross,
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.equal(out.length, 3);
  assert.equal(out[0].id, 'a');
  // cross-cat sorted by date desc: z (04-12), y (04-10)
  assert.deepEqual(out.slice(1).map((t) => t.id), ['z', 'y']);
});

test('Req 1.6: 0 same-cat + ≥3 pool → render 3 cross-cat', () => {
  const cross = [
    mk('y', 'hr', '2026-04-10'),
    mk('z', 'analytics', '2026-04-12'),
    mk('w', 'security', '2026-04-08'),
    mk('v', 'marketing', '2026-04-11'),
  ];
  const out = resolveRelatedTiles({
    sameCategory: [],
    crossCategoryPool: cross,
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.equal(out.length, 3);
  // sorted by date desc: z (04-12), v (04-11), y (04-10)
  assert.deepEqual(out.map((t) => t.id), ['z', 'v', 'y']);
});

test('Req 1.7: 0 same-cat + <3 pool → render NOTHING', () => {
  const cross = [mk('y', 'hr', '2026-04-10'), mk('z', 'analytics', '2026-04-12')];
  const out = resolveRelatedTiles({
    sameCategory: [],
    crossCategoryPool: cross,
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.deepEqual(out, []);
});

test('Req 1.7: 1 same-cat + 0 cross → render NOTHING (total 1 < 3)', () => {
  const out = resolveRelatedTiles({
    sameCategory: [mk('a', 'crm')],
    crossCategoryPool: [],
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.deepEqual(out, []);
});

test('Req 1.10: cross-cat excludes current id, same-cat ids, and same-cat-slug posts', () => {
  const same = [mk('a', 'crm')];
  const cross = [
    mk('cur', 'hr', '2026-04-12'),       // current id — must drop
    mk('a', 'hr', '2026-04-11'),         // already in same-cat — must drop
    mk('q', 'crm', '2026-04-10'),        // same primary cat — must drop
    mk('y', 'hr', '2026-04-09'),
    mk('z', 'analytics', '2026-04-08'),
  ];
  const out = resolveRelatedTiles({
    sameCategory: same,
    crossCategoryPool: cross,
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.equal(out.length, 3);
  assert.deepEqual(out.map((t) => t.id), ['a', 'y', 'z']);
});

test('Req 1.11: cross-cat tiebreaker is article id ascending when dates equal', () => {
  const cross = [
    mk('m', 'hr', '2026-04-10'),
    mk('a', 'hr', '2026-04-10'),
    mk('z', 'hr', '2026-04-10'),
  ];
  const out = resolveRelatedTiles({
    sameCategory: [],
    crossCategoryPool: cross,
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.deepEqual(out.map((t) => t.id), ['a', 'm', 'z']);
});

test('Req 1.8: same-cat order preserved, cross-cat appended after', () => {
  const same = [mk('s2', 'crm'), mk('s1', 'crm')]; // intentionally not sorted
  const cross = [mk('z', 'hr', '2026-04-12'), mk('y', 'hr', '2026-04-11')];
  const out = resolveRelatedTiles({
    sameCategory: same,
    crossCategoryPool: cross,
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  });
  assert.deepEqual(out.slice(0, 2).map((t) => t.id), ['s2', 's1']);
});

test('Req 1.11: deterministic — two calls with same input return identical results', () => {
  const args = {
    sameCategory: [mk('a', 'crm')],
    crossCategoryPool: [
      mk('y', 'hr', '2026-04-10'),
      mk('z', 'analytics', '2026-04-12'),
      mk('w', 'security', '2026-04-08'),
    ],
    currentArticleId: 'cur',
    currentPrimaryCategorySlug: 'crm',
  };
  const a = resolveRelatedTiles(args);
  const b = resolveRelatedTiles(args);
  assert.deepEqual(a, b);
});
