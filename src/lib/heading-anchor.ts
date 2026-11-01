/**
 * Heading anchors + TOC extraction for article pages.
 *
 * Moved from src/pages/[category]/[slug].astro (tech fix 2026-11-01,
 * anomaly A3) so the pipeline is unit-testable.
 *
 * Pipeline order is the fix itself: ids are injected into <h2>s FIRST,
 * then TOC items are extracted from that html — the TOC therefore reuses
 * the body's final ids verbatim (the 575 dead anchors came from TOC and
 * injector slugging the same heading differently: "&amp;" kept the letters
 * "amp" inside the injected id but vanished from the TOC slug).
 *
 * Explicit ids on <h2>s are preserved. Auto-generated ids are deduplicated
 * against every id already present in the document (and each other) with
 * -2/-3 suffixes, so repeated headings and slug/explicit-id collisions can
 * no longer produce duplicate DOM ids.
 */

export interface TocItem {
  id: string;
  text: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&apos;/g, "'");
}

export function buildArticleAnchors(content: string, hasTakeaways: boolean, sourceCount: number): { html: string; tocItems: TocItem[] } {
  const html = injectH2Ids(content);
  const tocItems = extractTocItems(html, hasTakeaways, sourceCount);
  return { html, tocItems };
}

export function extractTocItems(html: string, hasTakeaways: boolean, sourceCount: number): TocItem[] {
  const items: TocItem[] = [];
  // Match all <h2> tags — with or without id attribute
  const regex = /<h2(?:\s+[^>]*)?>([^<]*)<\/h2>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = decodeHtmlEntities(match[1].trim());
    if (!text) continue;
    // Extract existing id if present, otherwise generate a slug
    const idMatch = match[0].match(/id="([^"]*)"/);
    const id = idMatch ? idMatch[1] : text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    items.push({ id, text });
  }
  if (hasTakeaways) items.push({ id: 'key-takeaways', text: 'Key Takeaways' });
  if (sourceCount > 0) items.push({ id: 'sources', text: 'Sources' });
  return items;
}

/** Inject id attributes into <h2> tags that don't have one, so TOC anchor links work. */
export function injectH2Ids(html: string): string {
  const seen = new Set<string>();
  for (const m of html.matchAll(/\bid="([^"]*)"/g)) {
    seen.add(m[1]);
  }
  return html.replace(/<h2(?![^>]*\bid=)([^>]*)>([^<]*)<\/h2>/g, (match, attrs, text) => {
    const base = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let id = base;
    let n = 2;
    while (seen.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    seen.add(id);
    return `<h2 id="${id}"${attrs}>${text}</h2>`;
  });
}
