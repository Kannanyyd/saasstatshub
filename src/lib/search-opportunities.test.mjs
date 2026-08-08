import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CATEGORY_SEARCH_OPPORTUNITIES,
  HOMEPAGE_SEARCH_OPPORTUNITY_SLUGS,
} from './search-opportunities.ts';

test('homepage search opportunities contain six unique proven-demand pages', () => {
  assert.equal(HOMEPAGE_SEARCH_OPPORTUNITY_SLUGS.length, 6);
  assert.equal(
    new Set(HOMEPAGE_SEARCH_OPPORTUNITY_SLUGS).size,
    HOMEPAGE_SEARCH_OPPORTUNITY_SLUGS.length,
  );
  assert.ok(HOMEPAGE_SEARCH_OPPORTUNITY_SLUGS.includes('saas-sales-rep-salary'));
  assert.ok(HOMEPAGE_SEARCH_OPPORTUNITY_SLUGS.includes('cybersecurity-statistics-2026'));
  assert.ok(!HOMEPAGE_SEARCH_OPPORTUNITY_SLUGS.includes('cloud-computing-market-size-2026'));
});

test('category opportunities use canonical article routes and stay category-specific', () => {
  for (const [category, opportunities] of Object.entries(CATEGORY_SEARCH_OPPORTUNITIES)) {
    assert.ok(opportunities.length >= 1 && opportunities.length <= 3);
    for (const opportunity of opportunities) {
      assert.match(opportunity.href, new RegExp(`^/${category}/[^/]+/$`));
      assert.ok(opportunity.label.length > 10);
    }
  }
  assert.equal(
    CATEGORY_SEARCH_OPPORTUNITIES.hr[0].href,
    '/hr/saas-sales-rep-salary/',
  );
});
