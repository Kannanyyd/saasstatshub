import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.resolve(
  process.argv[2] || 'docs/seo/search-priority-pages-2026-07.csv',
);
const reportPath = path.resolve(
  process.argv[3] || 'artifacts/search-priority-audit.json',
);
const baseUrl = new URL(process.env.SEO_AUDIT_BASE_URL || 'https://saasstatshub.com');
const requestTimeoutMs = Number(process.env.SEO_AUDIT_TIMEOUT_MS || 20000);
const expectedHeaders = [
  'url',
  'window',
  'clicks',
  'impressions',
  'position',
  'http_status',
  'priority',
  'action',
  'review_after',
];

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
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('Manifest contains an unterminated quoted value.');
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function parseManifest(text) {
  const [headers, ...values] = parseCsv(text.trim());
  if (!headers || headers.join(',') !== expectedHeaders.join(',')) {
    throw new Error(`Manifest headers must be: ${expectedHeaders.join(',')}`);
  }

  const rows = values.map((cells, index) => {
    if (cells.length !== headers.length) {
      throw new Error(`Manifest row ${index + 2} has ${cells.length} fields; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]]));
  });

  if (rows.length !== 30) {
    throw new Error(`Manifest must contain exactly 30 data rows; found ${rows.length}.`);
  }
  if (new Set(rows.map((row) => row.url)).size !== rows.length) {
    throw new Error('Manifest contains duplicate URLs.');
  }

  return rows;
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
      .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '']),
  );
}

function decodeText(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function pageMetadata(html) {
  const title = decodeText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  let description = '';
  let canonical = '';

  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if ((attrs.name || '').toLowerCase() === 'description') {
      description = decodeText(attrs.content);
      break;
    }
  }

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const rels = (attrs.rel || '').toLowerCase().split(/\s+/);
    if (rels.includes('canonical')) {
      canonical = attrs.href || '';
      break;
    }
  }

  return {
    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    canonical,
  };
}

function normalizeUrl(value, relativeTo = baseUrl) {
  const url = new URL(value, relativeTo);
  url.hash = '';
  return url.href;
}

async function request(url, redirect) {
  const response = await fetch(url, {
    redirect,
    signal: AbortSignal.timeout(requestTimeoutMs),
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'SaaSStatsHub-Search-Priority-Audit/1.0',
    },
  });
  const html = response.headers.get('content-type')?.includes('text/html')
    ? await response.text()
    : '';
  return { response, html };
}

async function auditRow(row) {
  const requestUrl = normalizeUrl(row.url);
  const expectedStatus = Number(row.http_status);
  const failures = [];
  const initial = await request(requestUrl, 'manual');
  const location = initial.response.headers.get('location') || '';
  const isRedirect = expectedStatus >= 300 && expectedStatus < 400;

  if (initial.response.status !== expectedStatus) {
    failures.push(`expected HTTP ${expectedStatus}, received ${initial.response.status}`);
  }
  if (initial.response.status >= 400) {
    failures.push(`priority URL returned HTTP ${initial.response.status}`);
  }

  let finalResponse = initial.response;
  let finalHtml = initial.html;
  let expectedFinalUrl = requestUrl;

  if (isRedirect) {
    const actionPrefix = 'redirect_to:';
    if (!row.action.startsWith(actionPrefix)) {
      failures.push('redirect row does not declare redirect_to:<path>');
    } else {
      expectedFinalUrl = normalizeUrl(row.action.slice(actionPrefix.length));
      if (!location) {
        failures.push('redirect response has no Location header');
      } else if (normalizeUrl(location, requestUrl) !== expectedFinalUrl) {
        failures.push(`expected Location ${expectedFinalUrl}, received ${normalizeUrl(location, requestUrl)}`);
      }
    }

    const followed = await request(requestUrl, 'follow');
    finalResponse = followed.response;
    finalHtml = followed.html;
    if (finalResponse.status !== 200) {
      failures.push(`redirect destination returned HTTP ${finalResponse.status}`);
    }
    if (normalizeUrl(finalResponse.url) !== expectedFinalUrl) {
      failures.push(`expected final URL ${expectedFinalUrl}, received ${normalizeUrl(finalResponse.url)}`);
    }
  }

  const metadata = pageMetadata(finalHtml);
  const finalUrl = normalizeUrl(finalResponse.url || requestUrl);
  if (finalResponse.status === 200) {
    if (!metadata.canonical) {
      failures.push('final page has no canonical URL');
    } else if (normalizeUrl(metadata.canonical, finalUrl) !== finalUrl) {
      failures.push(`canonical mismatch: ${normalizeUrl(metadata.canonical, finalUrl)}`);
    }
  }

  return {
    ...row,
    expectedStatus,
    requestUrl,
    status: initial.response.status,
    location: location ? normalizeUrl(location, requestUrl) : '',
    finalUrl,
    finalStatus: finalResponse.status,
    titleLength: metadata.titleLength,
    descriptionLength: metadata.descriptionLength,
    canonical: metadata.canonical,
    passed: failures.length === 0,
    failures,
  };
}

const manifest = parseManifest(await readFile(manifestPath, 'utf8'));
const results = [];

for (const row of manifest) {
  try {
    results.push(await auditRow(row));
  } catch (error) {
    results.push({
      ...row,
      expectedStatus: Number(row.http_status),
      requestUrl: normalizeUrl(row.url),
      status: null,
      location: '',
      finalUrl: '',
      finalStatus: null,
      titleLength: 0,
      descriptionLength: 0,
      canonical: '',
      passed: false,
      failures: [error instanceof Error ? error.message : String(error)],
    });
  }
}

const failed = results.filter((result) => !result.passed);
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: baseUrl.href,
  manifestPath,
  totals: {
    pages: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
  },
  results,
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report.totals));
for (const result of failed) {
  console.error(`${result.url}: ${result.failures.join('; ')}`);
}
if (failed.length > 0) process.exitCode = 1;
