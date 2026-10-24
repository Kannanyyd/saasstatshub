import assert from 'node:assert/strict';
import test from 'node:test';

import { categorySeoFor } from './category-seo.ts';

test('ecommerce category uses the research-catalog override with matching title/h1/description', () => {
  const seo = categorySeoFor('ecommerce', {
    name: 'E-commerce',
    description: 'E-commerce platforms and online store solutions',
  });
  assert.equal(seo.title, 'E-commerce Research: Statistics, Platforms & Trends');
  assert.equal(seo.h1, 'E-commerce Research: Statistics, Platforms & Trends');
  assert.equal(
    seo.description,
    'Explore e-commerce statistics, platform comparisons, and research guides. Start with sourced U.S. online sales and mobile shopping data.',
  );
});

test('other categories keep the default generated metadata (no override leakage)', () => {
  const seo = categorySeoFor('crm', {
    name: 'CRM',
    description: 'Customer relationship management software data',
  });
  assert.equal(seo.title, 'CRM Statistics');
  assert.equal(seo.h1, 'CRM Statistics');
  assert.equal(seo.description, 'Customer relationship management software data');
});

test('unknown slug falls back to the same generated metadata', () => {
  const seo = categorySeoFor('does-not-exist', { name: 'Widgets', description: 'Widget data' });
  assert.equal(seo.title, 'Widgets Statistics');
  assert.equal(seo.h1, 'Widgets Statistics');
  assert.equal(seo.description, 'Widget data');
});

test('empty CMS description falls back to the generic description sentence', () => {
  const seo = categorySeoFor('crm', { name: 'CRM', description: '' });
  assert.equal(seo.description, 'Latest CRM statistics, market data, and trends.');
});
