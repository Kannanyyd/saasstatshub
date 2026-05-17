/**
 * Drop-cap helper for article body HTML.
 *
 * Why a helper instead of pure CSS `::first-letter`?
 *   ::first-letter has two well-known limitations on variable fonts:
 *     1. font-feature-settings (e.g. 'opsz' 144) is not always honored on
 *        the pseudo-element across engines.
 *     2. The browser's built-in heuristic for "first letter" can grab a
 *        leading quote, list marker, or punctuation in unexpected ways.
 *   Wrapping the first letter in a real <span class="drop-cap"> gives us
 *   deterministic styling (font, opsz, color, float) and works everywhere.
 *
 * Behavior:
 *   - Finds the first <p>...</p> in the input HTML.
 *   - Wraps the first non-whitespace letter or digit in
 *     `<span class="drop-cap">X</span>`.
 *   - If no <p> exists, or the first <p> doesn't start with a letter/digit,
 *     returns the input unchanged. The caller can safely chain.
 *   - Idempotent: a paragraph already containing `<span class="drop-cap">`
 *     near its start is left alone.
 *
 * Pairs with the `.drop-cap` CSS rule in `src/styles/global.css`.
 */

const DROP_CAP_RE = /<p(\s[^>]*)?>(\s*)([\p{L}\p{N}])/u;
const ALREADY_WRAPPED_RE = /<p(\s[^>]*)?>\s*<span\s+class="drop-cap"/u;

export function withDropCap(html: string): string {
  if (!html) return html;
  if (ALREADY_WRAPPED_RE.test(html)) return html;

  return html.replace(
    DROP_CAP_RE,
    (_match, attrs, ws, char) =>
      `<p${attrs ?? ''}>${ws}<span class="drop-cap">${char}</span>`,
  );
}
