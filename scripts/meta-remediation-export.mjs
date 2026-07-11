#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function option(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const endpoint = option('--endpoint', process.env.WP_API_URL ?? '');
const output = option('--output', 'meta-remediation-snapshot.json');
if (!endpoint) throw new Error('Provide --endpoint or WP_API_URL. This exporter is read-only.');

const query = `query MetaRemediationSnapshot($after: String) {
  posts(first: 100, after: $after, where: { status: PUBLISH }) {
    pageInfo { hasNextPage endCursor }
    nodes {
      databaseId slug title modifiedGmt
      content
      excerpt(format: RAW)
      categories { nodes { slug } }
    }
  }
}`;

const records = [];
let after = null;
do {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { after } }),
  });
  if (!response.ok) throw new Error(`GraphQL HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(JSON.stringify(payload.errors));
  const connection = payload.data.posts;
  for (const post of connection.nodes) {
    records.push({
      databaseId: post.databaseId,
      slug: post.slug,
      title: post.title,
      modifiedGmt: post.modifiedGmt,
      content: post.content ?? '',
      oldExcerptRaw: post.excerpt ?? '',
      categorySlugs: post.categories?.nodes?.map((category) => category.slug) ?? [],
    });
  }
  after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
} while (after);

const snapshot = { schemaVersion: 1, exportedAt: new Date().toISOString(), endpoint, records };
await writeFile(resolve(output), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: resolve(output), records: records.length }, null, 2));
