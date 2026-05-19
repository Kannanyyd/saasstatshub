// Phase 2.2 — FAQ Schema + visible accordion verification.
//
// For every article in dist/, asserts:
//   - When the article has FAQ items: <section class="faq-section"> exists,
//     <h2>Frequently Asked Questions</h2> present, ld+json FAQPage block
//     present with mainEntity matching the visible <details> elements.
//   - When the article has no FAQ items: no faq-section, no FAQPage block.
//   - Visible question/answer text matches FAQPage mainEntity byte-for-byte
//     (after the same trim/skip rules from filterFaqItems).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

let passed = 0;
let failed = 0;
function check(name, cond, detail = '') {
  if (cond) { console.log(`  ✅ ${name}${detail ? '  (' + detail + ')' : ''}`); passed++; }
  else { console.log(`  ❌ ${name}${detail ? '  — ' + detail : ''}`); failed++; }
}

function findAllArticles() {
  const out = [];
  for (const cat of readdirSync('dist')) {
    const p = join('dist', cat);
    if (!statSync(p).isDirectory()) continue;
    if (['_astro', 'pagefind', 'categories', 'fonts'].includes(cat)) continue;
    for (const slug of readdirSync(p)) {
      const sp = join(p, slug);
      if (!statSync(sp).isDirectory()) continue;
      const idx = join(sp, 'index.html');
      if (existsSync(idx)) out.push({ category: cat, slug, path: idx });
    }
  }
  return out;
}

function extractFaqPageBlock(html) {
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of blocks) {
    try {
      const o = JSON.parse(m[1].trim());
      if (o['@type'] === 'FAQPage') return o;
    } catch {}
  }
  return null;
}

function extractFaqSection(html) {
  const m = html.match(/<section[^>]*class="faq-section[^"]*"[^>]*>([\s\S]*?)<\/section>/);
  return m ? m[0] : null;
}

function extractVisibleFaqItems(sectionHtml) {
  const items = [];
  const detailsMatches = [...sectionHtml.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/g)];
  for (const dm of detailsMatches) {
    const inner = dm[1];
    const sm = inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const dvm = inner.match(/<div[^>]*class="[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    items.push({
      question: sm ? sm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '',
      answer: dvm ? dvm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '',
    });
  }
  return items;
}

const articles = findAllArticles();
console.log(`Scanning ${articles.length} article HTML files for FAQ data...\n`);

let withFaq = 0;
let withoutFaq = 0;
let totalQuestions = 0;

for (const a of articles) {
  const html = readFileSync(a.path, 'utf8');
  const faqBlock = extractFaqPageBlock(html);
  const faqSection = extractFaqSection(html);
  const hasFaqHeading = /<h2[^>]*id="faq-section-heading"[^>]*>\s*Frequently Asked Questions\s*<\/h2>/.test(html);

  if (faqBlock) {
    withFaq++;
    totalQuestions += faqBlock.mainEntity.length;

    check(
      `[${a.category}/${a.slug}] FAQPage block present and has mainEntity array`,
      Array.isArray(faqBlock.mainEntity) && faqBlock.mainEntity.length > 0,
      `${faqBlock.mainEntity.length} questions`,
    );
    check(
      `[${a.category}/${a.slug}] FAQ section + heading rendered`,
      faqSection !== null && hasFaqHeading,
    );

    // Byte match: visible accordion content == JSON-LD content
    const visible = extractVisibleFaqItems(faqSection || '');
    check(
      `[${a.category}/${a.slug}] Visible details count matches FAQPage mainEntity count`,
      visible.length === faqBlock.mainEntity.length,
      `visible ${visible.length}, schema ${faqBlock.mainEntity.length}`,
    );

    let allMatch = true;
    for (let i = 0; i < Math.min(visible.length, faqBlock.mainEntity.length); i++) {
      const schemaQ = faqBlock.mainEntity[i].name.replace(/\s+/g, ' ').trim();
      const schemaA = faqBlock.mainEntity[i].acceptedAnswer.text.replace(/\s+/g, ' ').trim();
      if (visible[i].question !== schemaQ || visible[i].answer !== schemaA) {
        allMatch = false;
        break;
      }
    }
    check(
      `[${a.category}/${a.slug}] Visible question/answer text matches JSON-LD byte-for-byte`,
      allMatch,
    );
  } else {
    withoutFaq++;
    check(
      `[${a.category}/${a.slug}] No FAQPage block AND no faq-section (article has no FAQ items)`,
      faqSection === null && !hasFaqHeading,
    );
  }
}

console.log('\n=== Summary ===');
console.log(`Articles with FAQ:    ${withFaq}`);
console.log(`Articles without FAQ: ${withoutFaq}`);
console.log(`Total Question entries: ${totalQuestions}`);
console.log(`Passed: ${passed}   Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
