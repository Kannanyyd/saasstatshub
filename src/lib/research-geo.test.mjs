import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const articleLayout = fs.readFileSync(
  new URL('../layouts/ArticleLayout.astro', import.meta.url),
  'utf8',
);
const baseLayout = fs.readFileSync(
  new URL('../layouts/BaseLayout.astro', import.meta.url),
  'utf8',
);
const researchPage = fs.readFileSync(
  new URL('../pages/research-data.astro', import.meta.url),
  'utf8',
);
const deskPage = fs.readFileSync(
  new URL('../pages/research-desk.astro', import.meta.url),
  'utf8',
);
const llms = fs.readFileSync(new URL('../../public/llms.txt', import.meta.url), 'utf8');

test('research entities use the stable Research Desk profile URL', () => {
  assert.match(articleLayout, /url: `\$\{siteOrigin\}\/research-desk\/`/);
  assert.match(baseLayout, /url: `\$\{siteOrigin\}\/research-desk\/`/);
  assert.match(deskPage, /'@type': 'ProfilePage'/);
  assert.match(deskPage, /We do not invent individual author identities/);
});

test('research catalog exposes JSON and CSV distributions', () => {
  assert.match(researchPage, /research-catalog\.json/);
  assert.match(researchPage, /application\/json/);
  assert.match(researchPage, /research-catalog\.csv/);
  assert.match(llms, /research-catalog\.json/);
});
