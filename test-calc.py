"""端到端验证 SaaS Pricing Calculator (Day 1-3)"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

URL = 'https://saasstatshub.com/saas-pricing-calculator/'
URL_EMBED = 'https://saasstatshub.com/saas-pricing-calculator/?embed=1'

passes = []
fails = []

def check(name, condition, detail=''):
    if condition:
        passes.append('OK    ' + name)
    else:
        fails.append('FAIL  ' + name + (' -- ' + detail if detail else ''))


with sync_playwright() as pw:
    browser = pw.chromium.launch()

    # ===== Test 1: Normal mode =====
    print('===== Normal mode =====')
    page = browser.new_page()
    console_errors = []
    page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
    page.on('pageerror', lambda err: console_errors.append('PAGEERROR: ' + str(err)))

    page.goto(URL, wait_until='networkidle')

    # Default ARR computed
    arr_text = page.locator('#out-arr').text_content()
    check('Default ARR computed', arr_text and '$' in arr_text, f'got "{arr_text}"')

    # LTV:CAC computed
    ltvcac_text = page.locator('#out-ltv-cac').text_content()
    check('Default LTV:CAC computed', ltvcac_text and ':' in ltvcac_text, f'got "{ltvcac_text}"')

    # Change MRR — ARR updates
    page.locator('#input-mrr').fill('10000')
    page.wait_for_timeout(300)
    new_arr = page.locator('#out-arr').text_content()
    check('ARR updates on MRR change', '120' in new_arr or '$120' in new_arr, f'got "{new_arr}"')

    # Low CAC → green tier
    page.locator('#input-mrr').fill('50000')
    page.locator('#input-cac').fill('100')
    page.wait_for_timeout(300)
    tier_attr = page.locator('#out-ltv-cac').get_attribute('data-tier')
    check('LTV:CAC tier=good with low CAC', tier_attr == 'good', f'got data-tier="{tier_attr}"')

    # CTA 1 hidden when ratio > 3
    cta1_hidden = page.locator('#cta-low-ltvcac').evaluate("el => el.classList.contains('hidden')")
    check('CTA 1 hidden when LTV:CAC > 3', cta1_hidden)

    # High CAC → CTA 1 shows
    page.locator('#input-cac').fill('99999')
    page.wait_for_timeout(300)
    cta1_visible = page.locator('#cta-low-ltvcac').evaluate("el => !el.classList.contains('hidden')")
    check('CTA 1 shows when LTV:CAC < 3', cta1_visible)

    # Reset button
    page.locator('#btn-reset').click()
    page.wait_for_timeout(300)
    mrr_reset = page.locator('#input-mrr').input_value()
    check('Reset restores defaults', mrr_reset == '50000', f'got "{mrr_reset}"')

    # 5 benchmark rows
    bench_count = page.locator('[data-bench-id]').count()
    check('5 benchmark rows present', bench_count == 5, f'got {bench_count}')

    # Benchmark tier label populated (non-em-dash)
    bench_tier_text = page.locator('[data-bench-id="ltvcac"] [data-bench-tier]').text_content()
    check('Benchmark tier label populated', bench_tier_text and len(bench_tier_text.strip()) > 3 and bench_tier_text.strip() != '—', f'got "{bench_tier_text.strip() if bench_tier_text else "None"}"')

    # CTA 3 affiliate
    hubspot_count = page.locator('a[data-affiliate="hubspot"]').count()
    salesforce_count = page.locator('a[data-affiliate="salesforce"]').count()
    check('CTA 3 HubSpot button', hubspot_count == 1)
    check('CTA 3 Salesforce button', salesforce_count == 1)

    # Buttons
    check('PDF download button', page.locator('#btn-download-pdf').count() == 1)
    check('CSV export button', page.locator('#btn-export-csv').count() == 1)
    check('Copy embed button', page.locator('#btn-copy-embed').count() == 1)

    # Embed code
    embed_code = page.locator('#embed-code').input_value()
    check('Embed code valid', 'iframe' in embed_code and 'saasstatshub.com' in embed_code)

    # Console errors
    check('No JS console errors', len(console_errors) == 0, ' | '.join(console_errors[:2]) if console_errors else '')

    page.close()

    # ===== Test 2: Embed mode =====
    print('===== Embed mode =====')
    embed_page = browser.new_page()
    embed_console_errors = []
    embed_page.on('console', lambda msg: embed_console_errors.append(msg.text) if msg.type == 'error' else None)
    embed_page.on('pageerror', lambda err: embed_console_errors.append('PAGEERROR: ' + str(err)))

    embed_page.goto(URL_EMBED, wait_until='networkidle')

    # Header / footer hidden
    try:
        header_visible = embed_page.locator('header').first.is_visible()
    except:
        header_visible = False
    check('Embed mode: header hidden', not header_visible)

    try:
        footer_visible = embed_page.locator('footer').first.is_visible()
    except:
        footer_visible = False
    check('Embed mode: footer hidden', not footer_visible)

    # CTA 3 hidden
    try:
        cta3_visible = embed_page.locator('a[data-affiliate="hubspot"]').first.is_visible()
    except:
        cta3_visible = False
    check('Embed mode: CTA 3 affiliate hidden', not cta3_visible)

    # Calculator still works
    embed_mrr = embed_page.locator('#input-mrr').input_value()
    check('Embed mode: input functional', embed_mrr == '50000', f'got "{embed_mrr}"')

    # "Powered by" backlink visible
    powered_text = embed_page.locator('.embed-only').last.text_content()
    check('Embed mode: "Powered by" attribution visible',
          powered_text and 'Powered by' in powered_text,
          f'got "{powered_text.strip() if powered_text else "None"}"')

    # No JS errors
    check('Embed mode: no JS console errors', len(embed_console_errors) == 0, ' | '.join(embed_console_errors[:2]) if embed_console_errors else '')

    # ===== Test 3: PDF generation =====
    print('===== PDF generation =====')
    page2 = browser.new_page()
    page2_errors = []
    page2.on('pageerror', lambda err: page2_errors.append('PAGEERROR: ' + str(err)))
    page2.goto(URL, wait_until='networkidle')

    # Click PDF button — listen for download
    with page2.expect_download(timeout=15000) as download_info:
        page2.locator('#btn-download-pdf').click()
    download = download_info.value
    suggested_name = download.suggested_filename
    check('PDF download triggered', suggested_name.startswith('saas-pricing-calculator-report-') and suggested_name.endswith('.pdf'), f'got "{suggested_name}"')
    check('PDF generation: no errors', len(page2_errors) == 0, ' | '.join(page2_errors[:2]) if page2_errors else '')
    page2.close()

    # ===== Test 4: CSV export =====
    print('===== CSV export =====')
    page3 = browser.new_page()
    page3.goto(URL, wait_until='networkidle')
    with page3.expect_download(timeout=10000) as download_info:
        page3.locator('#btn-export-csv').click()
    csv_download = download_info.value
    csv_name = csv_download.suggested_filename
    check('CSV download triggered', csv_name.startswith('saas-pricing-calculator-') and csv_name.endswith('.csv'), f'got "{csv_name}"')
    page3.close()

    browser.close()

# Print results
print('\n===== Results =====')
print('Pass: {}'.format(len(passes)))
print('Fail: {}'.format(len(fails)))
print('')
for p in passes:
    print('  ' + p)
print('')
for f in fails:
    print('  ' + f)

sys.exit(0 if not fails else 1)
