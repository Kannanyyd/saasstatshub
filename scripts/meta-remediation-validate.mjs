#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decodeHtml, jaccard, normalizedFingerprint, sha256 } from './meta-remediation-core.mjs';

function option(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const manifestPath = option('--manifest');
const graphqlEndpoint = option('--graphql', '');
const distPath = option('--dist', '');
if (!manifestPath) throw new Error('Provide --manifest. Optional: --graphql URL --dist dist');

const manifest = JSON.parse(await readFile(resolve(manifestPath), 'utf8'));
const failures = [];
const ready = manifest.records.filter((record) => record.status === 'ready');

async function indexRenderedPages(root) {
  const index = new Map();
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name === 'index.html') {
        const parts = directory.replace(/\\/g, '/').split('/');
        index.set(parts.at(-1), path);
      }
    }
  }
  await visit(resolve(root));
  return index;
}

function metaContent(html, key, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  return tags.filter((tag) => new RegExp(`\\b${key}=["']${value}["']`, 'i').test(tag)).map((tag) => {
    const content = tag.match(/\bcontent=(["'])([\s\S]*?)\1/i)?.[2] ?? '';
    return decodeHtml(content);
  });
}

for (const record of ready) {
  if (record.candidate.length < 145 || record.candidate.length > 160) failures.push(`${record.slug}:length`);
  if (!/^[\x20-\x7E]+$/.test(record.candidate)) failures.push(`${record.slug}:non_ascii`);
  if (sha256(record.candidate) !== record.candidateHash) failures.push(`${record.slug}:candidate_hash`);
}
for (let i = 0; i < ready.length; i += 1) {
  for (let j = i + 1; j < ready.length; j += 1) {
    if (normalizedFingerprint(ready[i].candidate) === normalizedFingerprint(ready[j].candidate)) failures.push(`${ready[i].slug}/${ready[j].slug}:duplicate`);
    if (jaccard(ready[i].candidate, ready[j].candidate) >= 0.85) failures.push(`${ready[i].slug}/${ready[j].slug}:near_duplicate`);
  }
}

if (graphqlEndpoint) {
  const query = `query VerifyMeta($id: ID!) { post(id: $id, idType: DATABASE_ID) { databaseId modifiedGmt excerpt(format: RAW) } }`;
  for (const record of ready) {
    const response = await fetch(graphqlEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables: { id: String(record.databaseId) } }) });
    const payload = await response.json();
    const post = payload.data?.post;
    if (!post) failures.push(`${record.slug}:graphql_missing`);
    else if (String(post.excerpt ?? '') !== record.candidate) failures.push(`${record.slug}:graphql_excerpt_mismatch`);
  }
}

if (distPath) {
  const renderedPages = await indexRenderedPages(distPath);
  for (const record of ready) {
    const renderedPath = renderedPages.get(record.slug);
    const html = renderedPath ? await readFile(renderedPath, 'utf8') : '';
    if (!html) { failures.push(`${record.slug}:render_missing`); continue; }
    const descriptions = metaContent(html, 'name', 'description');
    const og = metaContent(html, 'property', 'og:description')[0];
    const twitter = metaContent(html, 'name', 'twitter:description')[0];
    if (descriptions.length !== 1) failures.push(`${record.slug}:render_description_count`);
    if (descriptions[0] !== record.candidate || og !== record.candidate || twitter !== record.candidate) failures.push(`${record.slug}:render_meta_mismatch`);
  }
}

console.log(JSON.stringify({ total: manifest.records.length, ready: ready.length, manualReview: manifest.records.length - ready.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
