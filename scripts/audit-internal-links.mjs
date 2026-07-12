import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteDir = path.resolve(process.argv[2] || 'dist');
const reportPath = path.resolve(process.argv[3] || 'artifacts/internal-link-audit.json');

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

function normalizeHref(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  try {
    const url = new URL(href, 'https://saasstatshub.com');
    if (url.hostname !== 'saasstatshub.com') return null;
    let pathname = url.pathname.replace(/\/+/g, '/');
    if (!path.extname(pathname) && !pathname.endsWith('/')) pathname += '/';
    return pathname;
  } catch {
    return null;
  }
}

const files = await listHtmlFiles(siteDir);
const pages = new Map(files.map((file) => [pageUrl(file), { file, incoming: new Set(), outgoing: new Set() }]));

for (const [sourceUrl, page] of pages) {
  const html = await readFile(page.file, 'utf8');
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const targetUrl = normalizeHref(match[1]);
    if (!targetUrl || targetUrl === sourceUrl) continue;
    page.outgoing.add(targetUrl);
    pages.get(targetUrl)?.incoming.add(sourceUrl);
  }
}

const contentPattern = /^\/(?!categories\/|tools\/|about\/?$|contact\/?$|privacy-policy\/?$|terms-of-service\/?$|affiliate-disclosure\/?$|cookie-policy\/?$|editorial-policy\/?$|write-for-us\/?$|signals\/?$|saas-pricing-calculator\/?$)[^/]+\/[^/]+\/$/;
const contentPages = [...pages.entries()].filter(([url]) => contentPattern.test(url));
const orphans = contentPages
  .filter(([, page]) => page.incoming.size === 0)
  .map(([url, page]) => ({ url, outgoingCount: page.outgoing.size }));
const weaklyLinked = contentPages
  .filter(([, page]) => page.incoming.size > 0 && page.incoming.size < 3)
  .map(([url, page]) => ({ url, incomingCount: page.incoming.size, outgoingCount: page.outgoing.size }))
  .sort((a, b) => a.incomingCount - b.incomingCount || a.url.localeCompare(b.url));

const report = {
  generatedAt: new Date().toISOString(),
  siteDir,
  totals: {
    htmlPages: pages.size,
    contentPages: contentPages.length,
    orphanPages: orphans.length,
    weaklyLinkedPages: weaklyLinked.length,
  },
  orphans,
  weaklyLinked,
};

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.totals));
if (orphans.length) console.log(`Orphans: ${orphans.length}. See ${reportPath}`);
