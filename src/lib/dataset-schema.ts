/**
 * Phase 2.1 — Schema.org Dataset JSON-LD builder.
 *
 * Pure helper that builds a Schema.org Dataset JSON-LD object for an
 * Article_Page. SSG-friendly: no DOM, no I/O, fully deterministic.
 *
 * Implements requirements.md §3.2–3.13 conditional emission rules and
 * §3.16 determinism.
 *
 * Reference:
 *   - https://schema.org/Dataset
 *   - https://developers.google.com/search/docs/appearance/structured-data/dataset
 *
 * Dataset_License_URL is locked at https://creativecommons.org/licenses/by-nc/4.0/
 * per requirements.md decision lock.
 */

const DATASET_LICENSE_URL =
  'https://creativecommons.org/licenses/by-nc/4.0/' as const;
const ORG_NAME = 'SaaSStatsHub' as const;

export interface DatasetSchemaProps {
  /** Article title — Dataset.name (Req 3.3). */
  title: string;
  /** Cleaned excerpt — Dataset.description (Req 3.4); falls back to title when empty (Req 3.5). */
  cleanExcerpt: string;
  /** Canonical absolute URL of the Article_Page — Dataset.distribution.contentUrl (Req 3.10). */
  canonicalURL: string;
  /** Site origin (e.g. https://saasstatshub.com) for Dataset.creator.url (Req 3.8). */
  siteOrigin: string;
  /** Raw articleMeta.focusKeywords. Comma-separated string. (Req 3.6, 3.7) */
  focusKeywords?: string;
  /** Raw articleMeta.lastUpdated. Pass-through string. Empty/absent → omit (Req 3.11). */
  lastUpdated?: string;
  /** Quick overview items. 0 → omit variableMeasured (Req 3.12, 3.13). */
  quickOverview?: Array<{ statLabel: string; statValue: string }>;
}

export interface DatasetSchema {
  '@context': 'https://schema.org';
  '@type': 'Dataset';
  name: string;
  description: string;
  creator: { '@type': 'Organization'; name: string; url: string };
  license: typeof DATASET_LICENSE_URL;
  distribution: {
    '@type': 'DataDownload';
    encodingFormat: 'text/html';
    contentUrl: string;
  };
  keywords?: string[];
  temporalCoverage?: string;
  variableMeasured?: Array<{
    '@type': 'PropertyValue';
    name: string;
    description: string;
  }>;
}

/**
 * Build a Dataset JSON-LD object. Field order is deterministic so two
 * consecutive Builds against the same source produce byte-identical JSON
 * after JSON.stringify (Req 3.16).
 */
export function buildDatasetSchema(props: DatasetSchemaProps): DatasetSchema {
  const description =
    props.cleanExcerpt && props.cleanExcerpt.length > 0
      ? props.cleanExcerpt
      : props.title; // Req 3.5 fallback

  const out: DatasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: props.title,
    description,
    creator: { '@type': 'Organization', name: ORG_NAME, url: props.siteOrigin },
    license: DATASET_LICENSE_URL,
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'text/html',
      contentUrl: props.canonicalURL,
    },
  };

  // Req 3.6: keywords array from focus-keywords string
  // Req 3.7: omit when empty / absent
  const keywordList = parseKeywords(props.focusKeywords);
  if (keywordList.length > 0) out.keywords = keywordList;

  // Req 3.11: temporalCoverage pass-through, omit when empty
  if (props.lastUpdated && props.lastUpdated.trim().length > 0) {
    out.temporalCoverage = props.lastUpdated.trim();
  }

  // Req 3.12 / 3.13: variableMeasured from quickOverview, omit when empty
  if (props.quickOverview && props.quickOverview.length > 0) {
    out.variableMeasured = props.quickOverview.map((item) => ({
      '@type': 'PropertyValue',
      name: item.statLabel,
      description: item.statValue,
    }));
  }

  return out;
}

/**
 * Split a comma-separated focus-keywords string into a clean array.
 * Trim whitespace per segment. Drop empties. Returns [] when the input
 * is falsy or contains only empty segments.
 */
function parseKeywords(raw: string | undefined): string[] {
  if (typeof raw !== 'string' || raw.trim().length === 0) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
