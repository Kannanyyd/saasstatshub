// Extract <head>...</head> contents from the captured baseline HTMLs
// and write them to *.head.html for diffing against post-phase output.
import { readFileSync, writeFileSync } from 'node:fs';

function extractHead(htmlPath, outPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!m) {
    console.error(`No <head> in ${htmlPath}`);
    process.exit(1);
  }
  // Normalize line endings, then write each meta/link/script/title on its own line for clean diffs
  const head = m[1]
    .replace(/\r\n/g, '\n')
    .replace(/>\s*</g, '>\n<')
    .trim();
  writeFileSync(outPath, head + '\n');
  // Count meta/link/script/title for a quick summary
  const tags = head.match(/<(meta|link|script|title)\b/gi) || [];
  const counts = tags.reduce((acc, t) => {
    const k = t.replace(/^</, '').toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  console.log(`${outPath}: ${head.length} chars, tag counts:`, counts);
}

extractHead('baseline/baseline-home.html', 'baseline/baseline-home.head.html');
extractHead('baseline/baseline-article.html', 'baseline/baseline-article.head.html');
