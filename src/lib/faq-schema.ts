/**
 * Phase 2.2 — Schema.org FAQPage JSON-LD builder.
 *
 * Pure helper. SSG-friendly: no DOM, no I/O, fully deterministic.
 * Implements requirements.md §2.3-2.7 conditional emission rules and
 * §2.11 determinism.
 *
 * Reference:
 *   - https://schema.org/FAQPage
 *   - https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqPageSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }>;
}

/**
 * Filter FAQ items: keep only items whose question and answer are both
 * non-empty after trim. Returns the trimmed and filtered list.
 *
 * Exported so FaqSection.astro can apply the exact same filter,
 * guaranteeing visible-section ↔ JSON-LD byte parity (Req 3.8).
 */
export function filterFaqItems(items: unknown): FaqItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it: any) => ({
      question: typeof it?.question === 'string' ? it.question.trim() : '',
      answer: typeof it?.answer === 'string' ? it.answer.trim() : '',
    }))
    .filter((it) => it.question.length > 0 && it.answer.length > 0);
}

/**
 * Build a FAQPage JSON-LD object. Returns null when no valid items
 * remain after filtering, so the caller can skip emitting the
 * <script> entirely (Req 3.2 caller-side empty-state).
 */
export function buildFaqPageSchema(items: FaqItem[]): FaqPageSchema | null {
  const valid = filterFaqItems(items);
  if (valid.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((it) => ({
      '@type': 'Question' as const,
      name: it.question,
      acceptedAnswer: { '@type': 'Answer' as const, text: it.answer },
    })),
  };
}
