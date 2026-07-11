#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { buildCandidate, GENERATOR_VERSION, jaccard, normalizedFingerprint, sha256, validateRecord } from './meta-remediation-core.mjs';

function option(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const inputPath = option('--input');
const outputPath = option('--output', 'meta-remediation-manifest.json');
const reviewOutputPath = option('--review-output', outputPath.replace(/\.json$/i, '') + '.manual-review.json');
if (!inputPath) throw new Error('Usage: node scripts/meta-remediation-generate.mjs --input snapshot.json --output manifest.json');

const input = JSON.parse(await readFile(resolve(inputPath), 'utf8'));
const sourceRecords = Array.isArray(input) ? input : input.records;
if (!Array.isArray(sourceRecords)) throw new Error('Input must be an array or an object with a records array.');

const runId = `meta-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
const records = sourceRecords.map((source) => {
  const generated = buildCandidate(source);
  const record = {
    databaseId: Number(source.databaseId),
    slug: String(source.slug ?? ''),
    title: String(source.title ?? ''),
    modifiedGmt: String(source.modifiedGmt ?? ''),
    oldExcerptRaw: source.oldExcerptRaw == null ? '' : String(source.oldExcerptRaw),
    oldExcerptHash: sha256(source.oldExcerptRaw ?? ''),
    contentHash: sha256(source.content ?? ''),
    candidate: generated.candidate,
    candidateHash: sha256(generated.candidate),
    sourceHash: generated.sourceHash,
    sourceSentenceHashes: generated.sourceSentenceHashes,
    generationMode: generated.generationMode,
    candidateAlternatives: generated.alternatives ?? [],
    status: generated.status,
    errors: generated.status === 'ready' ? validateRecord({ ...source, candidate: generated.candidate }) : generated.reasons,
  };
  if (record.errors.length) record.status = 'manual_review';
  return record;
});

const ready = records.filter((record) => record.status === 'ready');
const accepted = [];
for (const record of ready) {
  const candidates = record.generationMode === 'structural_fallback' ? record.candidateAlternatives : [record.candidate];
  const replacement = candidates.find((candidate) => accepted.every((other) => (
    normalizedFingerprint(candidate) !== normalizedFingerprint(other.candidate)
    && jaccard(candidate, other.candidate) < 0.85
  )));
  if (replacement) {
    record.candidate = replacement;
    record.candidateHash = sha256(replacement);
    accepted.push(record);
  } else {
    record.status = 'manual_review';
    record.errors.push('duplicate_or_near_duplicate:no_safe_alternative');
  }
}
for (const record of records) delete record.candidateAlternatives;

const manifest = {
  schemaVersion: 1,
  generatorVersion: GENERATOR_VERSION,
  runId,
  generatedAt: new Date().toISOString(),
  sourceFile: basename(inputPath),
  counts: {
    total: records.length,
    ready: records.filter((record) => record.status === 'ready').length,
    manualReview: records.filter((record) => record.status !== 'ready').length,
  },
  records,
};

await writeFile(resolve(outputPath), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const reviewQueue = {
  schemaVersion: 1,
  runId,
  generatedAt: manifest.generatedAt,
  records: records.filter((record) => record.status !== 'ready'),
};
await writeFile(resolve(reviewOutputPath), `${JSON.stringify(reviewQueue, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: resolve(outputPath), reviewOutput: resolve(reviewOutputPath), runId, ...manifest.counts }, null, 2));
