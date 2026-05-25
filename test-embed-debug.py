"""Debug embed mode hiding"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page()
    page.goto('https://saasstatshub.com/saas-pricing-calculator/?embed=1', wait_until='networkidle')

    # Check html class
    html_class = page.locator('html').get_attribute('class')
    print(f'<html> class: "{html_class}"')

    # Check if embed-mode applied
    has_embed_class = page.evaluate("document.documentElement.classList.contains('embed-mode')")
    print(f'has embed-mode class: {has_embed_class}')

    # Check header display
    header_display = page.locator('header').first.evaluate("el => window.getComputedStyle(el).display")
    print(f'header display: "{header_display}"')

    # Check footer
    footer_display = page.locator('footer').first.evaluate("el => window.getComputedStyle(el).display")
    print(f'footer display: "{footer_display}"')

    # Check CSS rule
    css_text = page.evaluate("""() => {
      const rules = [];
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.cssText && rule.cssText.includes('embed-mode')) {
              rules.push(rule.cssText.substring(0, 200));
            }
          }
        } catch (e) { /* CORS */ }
      }
      return rules;
    }""")
    print(f'\nCSS rules with embed-mode:')
    for r in css_text:
        print(f'  {r}')

    browser.close()
