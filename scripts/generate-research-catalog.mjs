import { writeFile } from 'node:fs/promises';

const endpoint = process.env.WP_API_URL || 'https://cms.saasstatshub.com/index.php?graphql';
const output = new URL('../public/research-catalog.csv', import.meta.url);
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
    const primary = post.articleMeta?.primaryCategory?.nodes?.[0] || post.categories?.nodes?.[0];
    if (!primary?.slug) continue;
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
await writeFile(output, `${lines.join('\n')}\n`, 'utf8');
console.log(`[research-catalog] Wrote ${rows.length} public article records.`);
