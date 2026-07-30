import { readFile, writeFile } from 'node:fs/promises';

const endpoint = process.env.WP_API_URL || 'https://cms.saasstatshub.com/index.php?graphql';
const csvOutput = new URL('../public/research-catalog.csv', import.meta.url);
const jsonOutput = new URL('../public/research-catalog.json', import.meta.url);
const consolidationFile = new URL('../src/data/url-consolidations.json', import.meta.url);
const indexExclusionFile = new URL('../src/data/index-exclusions.json', import.meta.url);
const consolidations = JSON.parse(await readFile(consolidationFile, 'utf8'));
const indexExclusions = JSON.parse(await readFile(indexExclusionFile, 'utf8'));
const consolidatedSlugs = new Set(consolidations.map((rule) => rule.sourceSlug));
const excludedIndexPaths = new Set(
  indexExclusions.pages.map(({ category, slug }) => `${category}/${slug}`),
);
const query = `
query ResearchCatalog($first: Int!, $after: String) {
  posts(first: $first, after: $after, where: { status: PUBLISH }) {
    nodes {
      title
      slug
      modified
      categories { nodes { name slug } }
      articleMeta { primaryCategory { nodes { ... on Category { name slug } } } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

function csv(value) {
  const text = String(value ?? '').replaceAll('"', '""');
  return `"${text}"`;
}

const rows = [];
let cursor = null;
for (let pageNumber = 0; pageNumber < 50; pageNumber++) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { first: 100, after: cursor } }),
  });
  if (!response.ok) throw new Error(`WordPress GraphQL returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join('; '));
  const page = payload.data?.posts;
  if (!page) throw new Error('WordPress GraphQL did not return posts.');

  for (const post of page.nodes) {
    if (consolidatedSlugs.has(post.slug)) continue;
    const primary = post.articleMeta?.primaryCategory?.nodes?.[0] || post.categories?.nodes?.[0];
    if (!primary?.slug) continue;
    if (excludedIndexPaths.has(`${primary.slug}/${post.slug}`)) continue;
    rows.push({
      title: post.title,
      category: primary.name,
      categorySlug: primary.slug,
      url: `https://saasstatshub.com/${primary.slug}/${post.slug}/`,
      modified: post.modified,
    });
  }
  if (!page.pageInfo?.hasNextPage) break;
  cursor = page.pageInfo.endCursor;
  if (!cursor) break;
}

rows.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
const lines = [
  ['title', 'category', 'category_slug', 'url', 'last_modified'].map(csv).join(','),
  ...rows.map((row) => [row.title, row.category, row.categorySlug, row.url, row.modified].map(csv).join(',')),
];
const catalogModified = rows
  .map((row) => row.modified)
  .filter(Boolean)
  .sort()
  .at(-1) || null;
const jsonCatalog = {
  schema_version: '1.0',
  name: 'SaaSStatsHub Public Research Catalog',
  url: 'https://saasstatshub.com/research-data/',
  publisher: {
    name: 'SaaSStatsHub Research Desk',
    url: 'https://saasstatshub.com/research-desk/',
  },
  license: 'https://creativecommons.org/licenses/by-nc/4.0/',
  catalog_modified: catalogModified,
  article_count: rows.length,
  articles: rows.map((row) => ({
    title: row.title,
    category: row.category,
    category_slug: row.categorySlug,
    url: row.url,
    last_modified: row.modified,
  })),
};

await Promise.all([
  writeFile(csvOutput, `${lines.join('\n')}\n`, 'utf8'),
  writeFile(jsonOutput, `${JSON.stringify(jsonCatalog, null, 2)}\n`, 'utf8'),
]);
console.log(`[research-catalog] Wrote ${rows.length} public article records to CSV and JSON.`);
