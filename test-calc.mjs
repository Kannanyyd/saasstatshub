// 用 playwright 验证计算器实际行为
import { chromium } from 'playwright';

const URL = 'https://saasstatshub.com/saas-pricing-calculator/';
const URL_EMBED = 'https://saasstatshub.com/saas-pricing-calculator/?embed=1';

const errors = [];
const pass = [];

function check(name, condition, detail = '') {
  if (condition) {
    pass.push(`✅ ${name}`);
  } else {
    errors.push(`❌ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

const browser = await chromium.launch();

// ===== Test 1: Normal mode =====
console.log('\n===== Normal mode =====');
const page = await browser.newPage();

// Capture console errors
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));

await page.goto(URL, { waitUntil: 'networkidle' });

// Default values render
const arrText = await page.locator('#out-arr').textContent();
check('Default ARR computed', arrText && arrText.includes('$'), `got "${arrText}"`);

const ltvCacText = await page.locator('#out-ltv-cac').textContent();
check('Default LTV:CAC computed', ltvCacText && ltvCacText.includes(':'), `got "${ltvCacText}"`);

// Change MRR to 10000 — should update ARR to $120K
await page.locator('#input-mrr').fill('10000');
await page.waitForTimeout(200);
const newArr = await page.locator('#out-arr').textContent();
check('ARR updates on input change', newArr.includes('120') || newArr.includes('$120'), `got "${newArr}"`);

// Set very low CAC → very high LTV:CAC → should be green tier
await page.locator('#input-mrr').fill('50000');
await page.locator('#input-cac').fill('100');
await page.waitForTimeout(200);
const tierAttr = await page.locator('#out-ltv-cac').getAttribute('data-tier');
check('LTV:CAC green tier with low CAC', tierAttr === 'good', `got data-tier="${tierAttr}"`);

// CTA 1 should be HIDDEN now (LTV:CAC > 3)
const cta1Hidden = await page.locator('#cta-low-ltvcac').evaluate((el) => el.classList.contains('hidden'));
check('CTA 1 hidden when LTV:CAC > 3', cta1Hidden);

// Set very high CAC → low LTV:CAC → CTA 1 should SHOW
await page.locator('#input-cac').fill('99999');
await page.waitForTimeout(200);
const cta1Visible = await page.locator('#cta-low-ltvcac').evaluate((el) => !el.classList.contains('hidden'));
check('CTA 1 shows when LTV:CAC < 3', cta1Visible);

// Reset button works
await page.locator('#btn-reset').click();
await page.waitForTimeout(200);
const mrrAfterReset = await page.locator('#input-mrr').inputValue();
check('Reset button restores defaults', mrrAfterReset === '50000', `got "${mrrAfterReset}"`);

// Benchmark rows visible (5 rows)
const benchCount = await page.locator('[data-bench-id]').count();
check('5 benchmark rows', benchCount === 5, `got ${benchCount}`);

// Benchmark tier label populated
const benchTierText = await page.locator('[data-bench-id="ltvcac"] [data-bench-tier]').textContent();
check('Benchmark tier label populated', benchTierText && benchTierText.length > 3 && benchTierText !== '—', `got "${benchTierText}"`);

// CTA buttons present
const cta3Hubspot = await page.locator('a[data-affiliate="hubspot"]').count();
const cta3Salesforce = await page.locator('a[data-affiliate="salesforce"]').count();
check('CTA 3 HubSpot button', cta3Hubspot === 1);
check('CTA 3 Salesforce button', cta3Salesforce === 1);

// PDF download button present
const pdfBtn = await page.locator('#btn-download-pdf').count();
check('PDF download button', pdfBtn === 1);

// Embed code textarea
const embedCode = await page.locator('#embed-code').inputValue();
check('Embed code present', embedCode.includes('iframe') && embedCode.includes('saasstatshub.com'));

// Copy button
const copyBtn = await page.locator('#btn-copy-embed').count();
check('Copy embed button', copyBtn === 1);

// CSV button
const csvBtn = await page.locator('#btn-export-csv').count();
check('CSV export button', csvBtn === 1);

// Console errors check
check('No JS console errors', consoleErrors.length === 0, consoleErrors.length > 0 ? consoleErrors.slice(0, 2).join(' | ') : '');

await page.close();

// ===== Test 2: Embed mode =====
console.log('\n===== Embed mode =====');
const embedPage = await browser.newPage();
const embedConsoleErrors = [];
embedPage.on('console', (msg) => { if (msg.type() === 'error') embedConsoleErrors.push(msg.text()); });
embedPage.on('pageerror', (err) => embedConsoleErrors.push('PAGEERROR: ' + err.message));

await embedPage.goto(URL_EMBED, { waitUntil: 'networkidle' });

// Header should be hidden
const headerVisible = await embedPage.locator('header').first().isVisible().catch(() => false);
check('Embed mode: site header hidden', !headerVisible);

// Footer should be hidden
const footerVisible = await embedPage.locator('footer').first().isVisible().catch(() => false);
check('Embed mode: site footer hidden', !footerVisible);

// CTA 3 affiliate banner hidden
const cta3Visible = await embedPage.locator('a[data-affiliate="hubspot"]').first().isVisible().catch(() => false);
check('Embed mode: CTA 3 affiliate hidden', !cta3Visible);

// Calculator inputs still functional
const embedMrr = await embedPage.locator('#input-mrr').inputValue();
check('Embed mode: input field functional', embedMrr === '50000', `got "${embedMrr}"`);

// "Powered by" backlink present and visible
const poweredByText = await embedPage.locator('.embed-only').last().textContent();
check('Embed mode: "Powered by" backlink visible', poweredByText && poweredByText.includes('Powered by'), `got "${poweredByText?.trim()}"`);

// Console errors
check('Embed mode: no JS console errors', embedConsoleErrors.length === 0, embedConsoleErrors.slice(0, 2).join(' | '));

await embedPage.close();

await browser.close();

console.log(`\n===== Results =====`);
console.log(`✅ Pass: ${pass.length}`);
console.log(`❌ Fail: ${errors.length}`);
console.log('');
for (const p of pass) console.log(p);
console.log('');
for (const e of errors) console.log(e);

if (errors.length > 0) process.exit(1);
