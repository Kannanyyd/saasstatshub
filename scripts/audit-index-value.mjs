import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteDir = path.resolve(process.argv[2] || 'dist');
const csvPath = path.resolve(
  process.argv[3] || 'docs/seo/index-value-audit-2026-07-30.csv',
);
const summaryPath = path.resolve(
  process.argv[4] || 'docs/seo/index-value-audit-2026-07-30.md',
);
const catalogPath = path.resolve('public/research-catalog.csv');
const priorityPath = path.resolve('docs/seo/search-priority-pages-2026-07.csv');
const siteOrigin = 'https://saasstatshub.com';

const contentPattern =
  /^\/(?!categories\/|tools\/|about\/?$|contact\/?$|privacy-policy\/?$|terms-of-service\/?$|affiliate-disclosure\/?$|cookie-policy\/?$|editorial-policy\/?$|research-data\/?$|research-desk\/?$|write-for-us\/?$|signals\/?$|saas-pricing-calculator\/?$)[^/]+\/[^/]+\/$/;
const evidenceTypes = new Set(['statistics', 'comparison', 'buyers-guide', 'report']);
const titleStopWords = new Set([
  'a', 'an', 'and', 'are', 'best', 'complete', 'for', 'guide', 'in', 'is',
  'of', 'or', 'the', 'to', 'vs', 'what', 'which', 'with',
]);

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listHtmlFiles(absolute));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function pageUrl(file) {
  const relative = path.relative(siteDir, file).replaceAll('\\', '/');
  if (relative === 'index.html') return '/';
  return `/${relative.replace(/index\.html$/, '')}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])),
  );
}

function decodeText(value = '') {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return null;
  }
  try {
    const url = new URL(href, siteOrigin);
    if (url.origin !== siteOrigin) return null;
    let pathname = url.pathname.replace(/\/+/g, '/');
    if (!path.extname(pathname) && !pathname.endsWith('/')) pathname += '/';
    return pathname;
  } catch {
    return null;
  }
}

function inferType(slug) {
  if (slug.includes('statistics')) return 'statistics';
  if (slug.startsWith('what-is-')) return 'glossary';
  if (slug.includes('-vs-')) return 'comparison';
  if (slug.startsWith('best-') || slug.includes('-alternatives')) return 'buyers-guide';
  if (slug.includes('report')) return 'report';
  if (slug.includes('checklist') || slug.includes('template')) return 'template';
  if (slug.includes('guide') || slug.startsWith('how-to-')) return 'guide';
  return 'article';
}

function normalizeParagraph(value) {
  return decodeText(value)
    .toLowerCase()
    .replace(/\b20\d{2}\b/g, 'year')
    .replace(/\b\d+(?:\.\d+)?%?\b/g, 'number')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokens(title) {
  return new Set(
    decodeText(title)
      .toLowerCase()
      .replace(/\b20\d{2}\b/g, ' ')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1 && !titleStopWords.has(token)),
  );
}

function jaccard(left, right) {
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function csv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const [files, catalogText, priorityText] = await Promise.all([
  listHtmlFiles(siteDir),
  readFile(catalogPath, 'utf8'),
  readFile(priorityPath, 'utf8'),
]);
const catalog = new Map(
  parseCsv(catalogText).map((row) => [new URL(row.url).pathname, row]),
);
const priorities = new Map(parseCsv(priorityText).map((row) => [row.url, row]));
const pages = new Map(
  files
    .map((file) => [pageUrl(file), { file, incoming: new Set(), outgoing: new Set() }])
    .filter(([url]) => contentPattern.test(url)),
);
const paragraphFrequency = new Map();

for (const [url, page] of pages) {
  const html = await readFile(page.file, 'utf8');
  const articleHtml =
    html.match(/<article\b[^>]*data-pagefind-body[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html;
  const mainText = decodeText(articleHtml);
  const title = decodeText(
    articleHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
      || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1],
  ).replace(/\s+\|\s+SaaSStatsHub$/, '');
  const sourceBlock = html.match(/<ol\b[^>]*class="[^"]*sources-list[^"]*"[^>]*>([\s\S]*?)<\/ol>/i)?.[1] || '';
  const sourceItems = [...sourceBlock.matchAll(/<li\b/gi)].length;
  const sourceUrls = new Set(
    [...sourceBlock.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((href) => {
        try {
          return new URL(href, siteOrigin).origin !== siteOrigin;
        } catch {
          return false;
        }
      }),
  );
  const paragraphs = [...articleHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => normalizeParagraph(match[1]))
    .filter((paragraph) => paragraph.length >= 100);
  for (const paragraph of new Set(paragraphs)) {
    paragraphFrequency.set(paragraph, (paragraphFrequency.get(paragraph) || 0) + 1);
  }
  const slug = url.split('/').filter(Boolean).at(-1);
  Object.assign(page, {
    url,
    html,
    title,
    slug,
    category: url.split('/').filter(Boolean)[0],
    type: inferType(slug),
    wordCount: (mainText.match(/\b[A-Za-z0-9][A-Za-z0-9'-]*\b/g) || []).length,
    h2Count: [...articleHtml.matchAll(/<h2\b/gi)].length,
    faqCount: [...html.matchAll(/"@type":"Question"/g)].length,
    sourceItems,
    sourceUrlCount: sourceUrls.size,
    paragraphs,
    modified: catalog.get(url)?.last_modified || '',
  });
}

for (const [sourceUrl, page] of pages) {
  for (const match of page.html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const target = normalizeHref(match[1]);
    if (!target || target === sourceUrl) continue;
    page.outgoing.add(target);
    pages.get(target)?.incoming.add(sourceUrl);
  }
}

const byCategory = Map.groupBy([...pages.values()], (page) => page.category);
const duplicateCandidates = new Map();
for (const categoryPages of byCategory.values()) {
  for (let leftIndex = 0; leftIndex < categoryPages.length; leftIndex += 1) {
    const left = categoryPages[leftIndex];
    const leftTokens = titleTokens(left.title);
    if (leftTokens.size < 3) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < categoryPages.length; rightIndex += 1) {
      const right = categoryPages[rightIndex];
      // Similar wording across different intents (for example, a glossary
      // definition and a buyer's guide) is not a consolidation signal.
      if (left.type !== right.type) continue;
      const rightTokens = titleTokens(right.title);
      if (rightTokens.size < 3) continue;
      const similarity = jaccard(leftTokens, rightTokens);
      if (similarity < 0.84) continue;
      const pair = `${right.url} (${similarity.toFixed(2)})`;
      duplicateCandidates.set(left.url, [...(duplicateCandidates.get(left.url) || []), pair]);
      const reversePair = `${left.url} (${similarity.toFixed(2)})`;
      duplicateCandidates.set(right.url, [...(duplicateCandidates.get(right.url) || []), reversePair]);
    }
  }
}

const results = [...pages.values()].map((page) => {
  const repeatedParagraphs = page.paragraphs.filter(
    (paragraph) => (paragraphFrequency.get(paragraph) || 0) >= 5,
  ).length;
  const repeatedRatio = page.paragraphs.length
    ? repeatedParagraphs / page.paragraphs.length
    : 0;
  const priority = priorities.get(page.url);
  const impressions = Number(priority?.impressions || 0);
  const position = Number(priority?.position || 0);
  const nearDuplicates = duplicateCandidates.get(page.url) || [];
  const reasons = [];
  let classification = 'keep';
  let confidence = 'medium';

  if (impressions >= 20 || (impressions > 0 && position > 0 && position <= 20)) {
    classification = 'enhance';
    confidence = 'high';
    reasons.push(`GSC demand: ${impressions} impressions at position ${position || 'n/a'}`);
  } else if (nearDuplicates.length > 0) {
    classification = 'consolidate_review';
    confidence = 'medium';
    reasons.push(`near-duplicate title: ${nearDuplicates.join('; ')}`);
  } else if (
    page.wordCount < 450
    || (page.wordCount < 600 && page.sourceUrlCount === 0)
    || (page.paragraphs.length >= 3 && repeatedRatio >= 0.6)
  ) {
    classification = 'noindex_review';
    confidence = page.wordCount < 450 || repeatedRatio >= 0.8 ? 'high' : 'medium';
    if (page.wordCount < 450) reasons.push(`thin body: ${page.wordCount} words`);
    if (page.wordCount < 600 && page.sourceUrlCount === 0) {
      reasons.push('short body with no linked sources');
    }
    if (repeatedRatio >= 0.6) {
      reasons.push(`high repeated-paragraph ratio: ${repeatedRatio.toFixed(2)}`);
    }
  } else if (
    page.wordCount < 750
    || (evidenceTypes.has(page.type) && page.sourceUrlCount < 2)
    || (page.paragraphs.length >= 3 && repeatedRatio >= 0.3)
  ) {
    classification = 'enhance';
    confidence = 'medium';
    if (page.wordCount < 750) reasons.push(`body below 750 words: ${page.wordCount}`);
    if (evidenceTypes.has(page.type) && page.sourceUrlCount < 2) {
      reasons.push(`evidence-led page has ${page.sourceUrlCount} linked sources`);
    }
    if (repeatedRatio >= 0.3) {
      reasons.push(`repeated-paragraph ratio: ${repeatedRatio.toFixed(2)}`);
    }
  } else {
    confidence = page.wordCount >= 800 && page.sourceUrlCount >= 2 ? 'high' : 'medium';
    reasons.push('no current quality or duplication threshold triggered');
  }

  return {
    url: page.url,
    title: page.title,
    category: page.category,
    type: page.type,
    classification,
    confidence,
    word_count: page.wordCount,
    linked_sources: page.sourceUrlCount,
    source_items: page.sourceItems,
    h2_count: page.h2Count,
    faq_count: page.faqCount,
    incoming_links: page.incoming.size,
    repeated_paragraph_ratio: repeatedRatio.toFixed(2),
    gsc_impressions: impressions,
    gsc_position: position || '',
    last_modified: page.modified,
    reason: reasons.join(' | '),
    automatic_action: 'none',
  };
}).sort((left, right) =>
  left.classification.localeCompare(right.classification)
  || Number(right.gsc_impressions) - Number(left.gsc_impressions)
  || left.url.localeCompare(right.url),
);

const headers = Object.keys(results[0]);
const csvLines = [
  headers.map(csv).join(','),
  ...results.map((row) => headers.map((header) => csv(row[header])).join(',')),
];
const totals = Object.fromEntries(
  ['keep', 'enhance', 'consolidate_review', 'noindex_review']
    .map((classification) => [
      classification,
      results.filter((row) => row.classification === classification).length,
    ]),
);
const highConfidenceNoindex = results.filter(
  (row) => row.classification === 'noindex_review' && row.confidence === 'high',
);
const duplicatePages = results.filter((row) => row.classification === 'consolidate_review');
const evidenceWithoutLinkedSources = results.filter(
  (row) => evidenceTypes.has(row.type) && row.linked_sources < 2,
);
const demandPages = results.filter((row) => Number(row.gsc_impressions) > 0);
const highConfidenceByCategory = Object.entries(
  Object.groupBy(highConfidenceNoindex, (row) => row.category),
)
  .map(([category, rows]) => ({ category, count: rows.length }))
  .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category));
const highConfidenceCategoryRows = highConfidenceByCategory
  .slice(0, 10)
  .map((row) => `| ${row.category} | ${row.count} |`)
  .join('\n');
const summary = `# Index Value Audit - 2026-07-30

## Scope

This audit evaluates ${results.length} built content pages. It uses rendered word count,
linked source count, heading and FAQ presence, incoming internal links, normalized
paragraph reuse, title similarity, and the current GSC priority manifest.

It does not change publication state, sitemap inclusion, canonical tags, or robots
directives. Every recommendation requires editorial review.

## Results

| Classification | Pages | Meaning |
| --- | ---: | --- |
| Keep | ${totals.keep} | No current quality or duplication threshold triggered |
| Enhance | ${totals.enhance} | Search demand or a remediable quality/evidence gap |
| Consolidate review | ${totals.consolidate_review} | Possible same-category topic overlap |
| Noindex review | ${totals.noindex_review} | Thin or highly repeated page requiring manual review |

High-confidence noindex-review candidates: ${highConfidenceNoindex.length}.
Possible consolidation candidates: ${duplicatePages.length}.

## Important findings

- ${demandPages.length} pages have recorded demand in the current GSC priority manifest.
- ${evidenceWithoutLinkedSources.length} statistics, comparison, buyer-guide, or report pages have fewer than two linked sources.
- ${highConfidenceNoindex.length} pages have a body below 450 words or normalized paragraph reuse of at least 80%.
- ${duplicatePages.length} pages belong to possible same-intent consolidation pairs.

### High-confidence review candidates by category

| Category | Pages |
| --- | ---: |
${highConfidenceCategoryRows || '| None | 0 |'}

## Safe execution order

1. Enhance GSC-demand pages first; do not change their URLs.
2. Manually compare every consolidation pair before selecting a canonical page.
3. Review high-confidence noindex candidates for useful facts, links, or backlinks.
4. Only after review, merge or noindex pages in small batches and monitor GSC.

## Guardrails

- No URL is automatically deleted, redirected, or marked noindex.
- A low word count alone is not treated as proof of low value.
- A title-similarity match is a review lead, not a duplicate-content verdict.
- IndexNow should only receive URLs that are actually changed after review.

Full row-level evidence is in \`${path.basename(csvPath)}\`.
`;

await Promise.all([
  writeFile(csvPath, `${csvLines.join('\n')}\n`, 'utf8'),
  writeFile(summaryPath, summary, 'utf8'),
]);
console.log(JSON.stringify({ pages: results.length, ...totals, highConfidenceNoindex: highConfidenceNoindex.length }));
