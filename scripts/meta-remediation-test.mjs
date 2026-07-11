import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { buildCandidate, buildStructuralFallback, completeClause, extractSubstantiveSentences, hasUnsafeEnding, jaccard, sha256, validateRecord } from './meta-remediation-core.mjs';

const execFileAsync = promisify(execFile);

const title = 'Acme CRM Statistics 2026';
const fact = 'Acme CRM helps sales teams organize customer records, pipeline stages, follow-up tasks, and reporting workflows across one shared workspace for managers and representatives.';
const content = `<p>Disclosure: Some links on this page are affiliate links.</p><h2>Quick Overview</h2><ul><li>Ignore this list.</li></ul><h2>Adoption</h2><p>${fact}</p><h2>Sources</h2><p>Source text must not appear.</p>`;

test('extractor excludes disclosure, overview, and sources sections', () => {
  const sentences = extractSubstantiveSentences(content);
  assert.deepEqual(sentences, [fact]);
});

test('generator emits an evidence-backed ASCII candidate or review status', () => {
  const result = buildCandidate({ title, content });
  assert.equal(result.status, 'ready');
  assert.equal(validateRecord({ title, content, candidate: result.candidate }).length, 0);
  assert.ok(result.candidate.length >= 145 && result.candidate.length <= 160);
});

test('hash and near-duplicate checks are deterministic', () => {
  assert.equal(sha256('same'), sha256('same'));
  assert.equal(jaccard('one two three four five', 'one two three four five'), 1);
  assert.ok(jaccard('one two three four five', 'different words entirely here') < 0.85);
});

test('unsupported numbers cannot pass the evidence gate', () => {
  const candidate = 'Acme CRM Statistics 2026 reports 99% adoption across sales teams, with verified workflow coverage for managers and representatives worldwide.';
  assert.ok(validateRecord({ title, content, candidate }).includes('unsupported_number'));
});

test('completeClause rejects dangling and arbitrary word truncation', () => {
  const dangling = 'A'.repeat(144) + ' less developed than in.';
  assert.equal(completeClause(dangling), '');
  assert.equal(hasUnsafeEnding('The evidence is less developed than in.'), true);
  const longWithoutSentenceBoundary = `${'A complete introductory phrase '.repeat(8)}continues beyond the available character window without a valid ending.`;
  assert.equal(completeClause(longWithoutSentenceBoundary), '');
});

test('known generic AI phrases are excluded from extractive candidates', () => {
  const phrases = [
    'This remains a critical focus area for every team reviewing the subject.',
    'Looking ahead, the market may continue to change for many participants.',
    'Organizations implement these systems through a standard planning process.',
    'If your organization handles sensitive data, additional controls may be needed.',
  ];
  const html = phrases.map((phrase) => `<p>${phrase}</p>`).join('');
  assert.deepEqual(extractSubstantiveSentences(html), []);
});

test('structural fallback is natural, bounded, and contains no unsupported numbers', () => {
  const records = [
    { slug: 'acme-crm-statistics-2026', title: 'Acme CRM Statistics 2026' },
    { slug: 'what-is-revenue-operations', title: 'What Is Revenue Operations?' },
    { slug: 'alpha-vs-beta', title: 'Alpha vs Beta' },
    { slug: 'acme-alternatives', title: 'Acme Alternatives' },
    { slug: 'how-to-review-saas-costs', title: 'How to Review SaaS Costs' },
  ];
  for (const record of records) {
    const fallback = buildStructuralFallback(record)[0];
    assert.ok(fallback, record.slug);
    assert.ok(fallback.length >= 145 && fallback.length <= 160, `${record.slug}:${fallback.length}`);
    assert.equal(hasUnsafeEnding(fallback), false);
    assert.equal(validateRecord({ ...record, content: '', candidate: fallback }).length, 0);
  }
});

test('CLI writes a hashed manifest and a separate manual-review queue', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'meta-remediation-'));
  const input = join(directory, 'snapshot.json');
  const output = join(directory, 'manifest.json');
  const review = join(directory, 'review.json');
  await writeFile(input, JSON.stringify({ records: [
    { databaseId: 1, slug: 'acme-crm-statistics-2026', title, modifiedGmt: '2026-07-11T00:00:00', content, oldExcerptRaw: '' },
    { databaseId: 3, slug: 'beta-crm-statistics-2026', title: 'Beta CRM Statistics 2026', modifiedGmt: '2026-07-11T00:00:00', content: '<p>Too short.</p>', oldExcerptRaw: '' },
    { databaseId: 4, slug: 'gamma-crm-statistics-2026', title: 'Gamma CRM Statistics 2026', modifiedGmt: '2026-07-11T00:00:00', content: '<p>Too short.</p>', oldExcerptRaw: '' },
    { databaseId: 5, slug: 'delta-crm-statistics-2026', title: 'Delta CRM Statistics 2026', modifiedGmt: '2026-07-11T00:00:00', content: '<p>Too short.</p>', oldExcerptRaw: '' },
    { databaseId: 2, slug: 'thin-page', title: 'X'.repeat(200), modifiedGmt: '2026-07-11T00:00:00', content: '<p>Too short.</p>', oldExcerptRaw: '' },
  ] }));
  await execFileAsync(process.execPath, [
    fileURLToPath(new URL('./meta-remediation-generate.mjs', import.meta.url)),
    '--input', input, '--output', output, '--review-output', review,
  ]);
  const manifest = JSON.parse(await readFile(output, 'utf8'));
  const queue = JSON.parse(await readFile(review, 'utf8'));
  assert.equal(manifest.counts.ready, 4, JSON.stringify(manifest.records.map((record) => [record.slug, record.status, record.errors])));
  assert.equal(manifest.counts.manualReview, 1);
  assert.equal(queue.records[0].slug, 'thin-page');
  assert.equal(manifest.records[0].oldExcerptHash, sha256(''));
  const ready = manifest.records.filter((record) => record.status === 'ready');
  for (let i = 0; i < ready.length; i += 1) {
    for (let j = i + 1; j < ready.length; j += 1) assert.ok(jaccard(ready[i].candidate, ready[j].candidate) < 0.85);
  }
  const validation = await execFileAsync(process.execPath, [
    fileURLToPath(new URL('./meta-remediation-validate.mjs', import.meta.url)),
    '--manifest', output,
  ]);
  assert.deepEqual(JSON.parse(validation.stdout).failures, []);
});
