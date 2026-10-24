/**
 * Decide whether the page needs a generated anchor target for the Key
 * Takeaways TOC link.
 *
 * TOC entries for "Key Takeaways" and "Sources" are added whenever the ACF
 * repeater fields are non-empty (see pages/[category]/[slug].astro
 * buildTocItems). For posts whose takeaways live ONLY in the custom field
 * (no in-content "Key Takeaways" H2), nothing on the page carries
 * id="key-takeaways", so the TOC link is dead. When the article body has
 * its own H2, injectH2Ids() already provides the anchor — generating
 * another one would create a duplicate id.
 */
export function needsTakeawaysAnchor(content: string, takeawaysCount: number): boolean {
  if (takeawaysCount <= 0) return false;
  if (typeof content !== 'string' || content.length === 0) return true;
  // Body already provides the anchor: either an explicit id on any tag or a
  // "Key Takeaways" H2 that injectH2Ids() will slugify to key-takeaways.
  if (/id=["']key-takeaways["']/i.test(content)) return false;
  return !/<h2[^>]*>\s*Key\s+Takeaways\s*<\/h2>/i.test(content);
}
