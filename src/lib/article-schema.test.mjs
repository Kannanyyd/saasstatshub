import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const layout = fs.readFileSync(new URL('../layouts/ArticleLayout.astro', import.meta.url), 'utf8');

test('Dataset markup is limited to statistics article routes', () => {
  assert.match(layout, /const isDatasetArticle = isStatisticsPost;/);
  assert.doesNotMatch(layout, /articleSlug\.includes\('annual-report'\)/);
  assert.doesNotMatch(layout, /articleSlug\.endsWith\('-report'\)/);
});
