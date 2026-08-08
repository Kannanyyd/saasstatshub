import assert from 'node:assert/strict';
import test from 'node:test';

import { createPageTitle } from './page-title.ts';

test('keeps short titles branded', () => {
  assert.equal(createPageTitle('About'), 'About | SaaSStatsHub');
});

test('uses the descriptive prefix for long colon titles', () => {
  const title = createPageTitle(
    'Artificial Intelligence Statistics 2026: Global Market Size, Enterprise Adoption, and Spending Trends',
  );

  assert.equal(title, 'Artificial Intelligence Statistics 2026 | SaaSStatsHub');
  assert.ok(title.length <= 65);
});

test('truncates long titles without a colon at a word boundary', () => {
  const title = createPageTitle(
    'A deliberately long research title without punctuation that still needs a concise search result',
  );

  assert.ok(title.length <= 65);
  assert.ok(!title.endsWith(' '));
  assert.ok(title.endsWith('...'));
});

test('keeps the homepage title stable', () => {
  assert.equal(
    createPageTitle('Home'),
    'SaaSStatsHub - SaaS Research, Statistics and Guides',
  );
});
