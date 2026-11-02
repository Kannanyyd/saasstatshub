/**
 * Pre-release artifact guard.
 *
 * Runs at the END of `npm run build` (see package.json), with a non-zero
 * exit on a bad artifact. Pages coverage is conditional on its actual build
 * command using this entrypoint; verify that configuration before publishing.
 *
 * Rule classes and maintenance:
 *   1. STRUCTURAL (do not remove): unique ids, TOC anchors resolve site-wide,
 *      no mock/demo signatures anywhere, category index pages exist for every
 *      slug in src/lib/constants.ts, sitemap/rss present. These only break if
 *      the build pipeline itself is broken — fix the pipeline, not the rule.
 *   2. APPROVED-CONTENT MARKERS (update WITH the content change): homepage
 *      neutral H1/badge, C02/C01/C04 CSV attachment links, 106/142 in-content
 *      takeaways. When a future approved content pass changes one of these,
 *      update the marker in the same commit; the guard failing is the signal
 *      that a page changed without its check being reviewed.
 *   3. ABSENCE RULES (never regress): FAQPage on 142/106/C02/C01, templated
 *      FAQ strings on 575, field-sourced abbreviated takeaway strings outside
 *      approved contexts. Remove only with a recorded decision.
 *   Deliberately NOT checked: article counts, prices, guidance figures,
 *      takeaway counts — these update normally and must not be pinned here.
 *
 * Usage: node scripts/artifact-guard.mjs [distDir]
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] || 'dist');
const read = (p) => fs.readFileSync(path.join(dist, p), 'utf8');
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures += 1;
};

// ---- 106: approved in-content takeaways stay; field-sourced abbreviated
// strings from the pre-release backup (keyTakeaways a:5) must never render.
const s106raw = read('crm/salesforce-statistics-2026/index.html');
// Abbreviated figures legitimately live in the approved overview cards and the
// Dataset JSON-LD they feed — strip those contexts before testing for the
// pre-release FIELD takeaway strings (which used the same abbreviations).
const s106 = s106raw
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
  .replace(/<table class="quick-overview">[\s\S]*?<\/table>/g, '');
check('106 approved in-content takeaways present', s106.includes('Salesforce reported $41.525 billion in FY2026 revenue'));
check('106 no field-sourced abbreviated takeaway strings', !/\$41\.525B\b/.test(s106) && !/\$14\.402B\b/.test(s106) && !/\$11\.133B\b/.test(s106));
check('106 quick-overview table present', /<table class="quick-overview">/.test(s106raw));

// ---- 142: approved in-content takeaways (incl. the editorial sentence —
// content change is OUT of scope for this batch and tracked separately).
const s142 = read('ecommerce/ecommerce-statistics-2026/index.html');
check('142 approved in-content takeaways present', s142.includes('The strongest 2026 e-commerce claims should be based on reported sales'));
check('142 no field-rendered takeaway block', !/class="key-takeaways"/.test(s142));

// ---- 575: A2 (templated FAQ gone) + A3 (TOC anchors resolve) + takeaways.
const s575 = read('project-management/jira-vs-notion-vs-trello/index.html');
check('575 FAQPage removed', !s575.includes('FAQPage'));
check('575 templated questions removed', !s575.includes('in 2026?') && !s575.includes('How much does Jira cost compared to Notion?'));
{
  const ids = new Set([...s575.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]));
  const tocHrefs = [...s575.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  const dead = [...new Set(tocHrefs.filter((h) => !ids.has(h)))];
  check('575 all TOC anchors resolve', dead.length === 0, dead.length ? `dead: ${dead.join(', ')}` : '');
  const dup = [...s575.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]);
  const dups = dup.filter((id, i) => dup.indexOf(id) !== i);
  check('575 no duplicate ids', dups.length === 0, dups.length ? [...new Set(dups)].join(', ') : '');
  const kt575 = s575.match(/<span id="key-takeaways"><\/span>[\s\S]*?<\/ul>/) || [''];
  check('575 approved takeaways section present', s575.includes('built-in sprint tracking') && kt575[0].includes('<li>'));
}

// ---- C02 / C01: untouched batch neighbors keep their approved shape.
const c02 = read('crm/crm-data-migration-guide/index.html');
check('C02 unique H1 + FAQPage still absent', (c02.match(/<h1[^>]*>/g) || []).length === 1 && !c02.includes('FAQPage'));
check('C02 two CSV links intact', new Set([...c02.matchAll(/href="([^"]*uploads\/2026\/10\/(?:field-mapping-template|migration-acceptance-checklist)\.csv)"/g)].map((m) => m[1])).size === 2);
const c01 = read('crm/crm-entry-level-pricing-5-person-team/index.html');
check('C01 H1 + CSV + FAQPage still absent', (c01.match(/<h1[^>]*>/g) || []).length === 1 && c01.includes('crm-entry-level-pricing-5-person-team-data.csv') && !c01.includes('FAQPage'));

// C04's attachment contract changes only with an approved asset replacement.
const c04 = read('crm/best-crm-for-small-business/index.html');
check('C04 unique H1 + FAQPage still absent', (c04.match(/<h1[^>]*>/g) || []).length === 1 && !c04.includes('FAQPage'));
check('C04 trial-scorecard attachment linked', /href="https:\/\/cms\.saasstatshub\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/trial-scorecard\.csv"/.test(c04));

// ---- homepage: phase-1 remediation intact.
const home = read('index.html');
check('homepage neutral H1/badge, no cards, no claims', home.includes('Independent') && home.includes('Sourced statistics · Named references') && !home.includes('hero-stat-card') && !home.includes("50,000") && !home.includes('#1 Source'));

// ---- site-wide: TOC anchors resolve on every page that has any (A3 regression net).
{
  let pages = 0;
  const bad = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html') {
        const raw = fs.readFileSync(p, 'utf8');
        const hrefs = [...raw.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
        if (hrefs.length === 0) continue;
        pages += 1;
        const ids = new Set([...raw.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1]));
        const dead = [...new Set(hrefs.filter((h) => !ids.has(h)))];
        if (dead.length > 0) bad.push(`${path.relative(dist, p)}: ${dead.slice(0, 3).join(', ')}`);
      }
    }
  };
  walk(dist);
  check(`site-wide TOC anchors resolve (${pages} pages with anchors)`, bad.length === 0, bad.slice(0, 5).join(' | '));
}

// ---- collection completeness (no fixed article counts) ----
{
  const constantsSrc = fs.readFileSync(path.resolve(dist, '..', 'src', 'lib', 'constants.ts'), 'utf8');
  // Only the CATEGORIES array counts — the file also carries FALLBACK_META
  // (slug 'uncategorized') which is deliberately not rendered as a category.
  const catBlock = constantsSrc.match(/export const CATEGORIES[^=]*= \[[\s\S]*?\n\];/);
  const slugs = catBlock ? [...catBlock[0].matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => m[1]) : [];
  check('category slugs parsed from CATEGORIES array', slugs.length >= 5, `${slugs.length} slugs`);
  const missing = slugs.filter((slug) => !fs.existsSync(path.join(dist, 'categories', slug, 'index.html')));
  check('every category index page exists', missing.length === 0, missing.join(', '));
  const articlesRoots = fs.readdirSync(dist, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'categories' && e.name !== '_astro');
  let articlePages = 0;
  for (const cat of articlesRoots) {
    const catDir = path.join(dist, cat.name);
    for (const e of fs.readdirSync(catDir, { withFileTypes: true })) {
      if (e.isDirectory() && fs.existsSync(path.join(catDir, e.name, 'index.html'))) articlePages += 1;
    }
  }
  check('article pages exist', articlePages > 0, `${articlePages} article pages`);
  for (const f of ['sitemap-0.xml', 'rss.xml']) {
    check(`${f} present`, fs.existsSync(path.join(dist, f)));
  }
}

// ---- no demo/mock content anywhere in the artifact ----
{
  const signatures = ['SaaS Market Size Statistics 2026: 50+ Key Data Points', 'saas-market-size-statistics/'];
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html') {
        const raw = fs.readFileSync(p, 'utf8');
        for (const sig of signatures) {
          if (raw.includes(sig)) hits.push(`${path.relative(dist, p)}: ${sig}`);
        }
      }
    }
  };
  walk(dist);
  check('no mock/demo signatures in dist', hits.length === 0, hits.slice(0, 4).join(' | '));
}

console.log(failures === 0 ? 'ARTIFACT GUARD: ALL PASS' : `ARTIFACT GUARD: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
