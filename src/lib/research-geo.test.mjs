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
const newsletter = fs.readFileSync(
  new URL('../components/Newsletter.astro', import.meta.url),
  'utf8',
);
const sources = fs.readFileSync(
  new URL('../components/Sources.astro', import.meta.url),
  'utf8',
);
const citeThisPage = fs.readFileSync(
  new URL('../components/CiteThisPage.astro', import.meta.url),
  'utf8',
);
const categoryPage = fs.readFileSync(
  new URL('../pages/categories/[slug].astro', import.meta.url),
  'utf8',
);
const categoryResearch = fs.readFileSync(
  new URL('./category-research.ts', import.meta.url),
  'utf8',
);
const catalogGenerator = fs.readFileSync(
  new URL('../../scripts/generate-research-catalog.mjs', import.meta.url),
  'utf8',
);

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

test('article evidence is addressable and machine-readable', () => {
  assert.match(sources, /<h2 id="sources"/);
  assert.match(articleLayout, /citationUrls\.length/);
  assert.match(articleLayout, /href="#sources"/);
  assert.match(articleLayout, /isPartOf:/);
  assert.match(articleLayout, /about:/);
  assert.match(articleLayout, /keywords:/);
});

test('boilerplate is excluded from generated search snippets', () => {
  assert.match(baseLayout, /data-nosnippet/);
  assert.match(newsletter, /data-nosnippet/);
  assert.match(articleLayout, /data-nosnippet/);
});

test('llms discovery file points to curated research entry pages', () => {
  assert.match(llms, /## Recommended research starting points/);
  assert.match(llms, /saas-market-size-statistics-2026/);
  assert.match(llms, /cybersecurity-statistics-2026/);
  assert.match(llms, /## Preferred citation format/);
});

test('articles and category hubs expose reusable citation formats', () => {
  assert.match(articleLayout, /<CiteThisPage/);
  assert.match(categoryPage, /<CiteThisPage/);
  assert.match(citeThisPage, /plain:/);
  assert.match(citeThisPage, /markdown:/);
  assert.match(citeThisPage, /bibtex:/);
  assert.match(citeThisPage, /data-citation-format=\{format\}/);
  assert.match(citeThisPage, /navigator\.clipboard\.writeText/);
});

test('category hubs publish focused research context and machine-readable datasets', () => {
  for (const slug of ['analytics', 'crm', 'security', 'ecommerce', 'hr']) {
    assert.match(categoryResearch, new RegExp(`${slug}:\\s*\\{`));
  }
  assert.match(categoryPage, /getCategoryResearchProfile/);
  assert.match(categoryPage, /'@type': 'Dataset'/);
  assert.match(categoryPage, /category-research-.*\.json/);
  assert.match(categoryPage, /category-research-.*\.csv/);
  assert.match(catalogGenerator, /category-research-/);
  assert.match(catalogGenerator, /category_article_count/);
});
