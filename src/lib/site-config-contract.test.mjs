/**
 * Site-config contract tests (trust remediation A-phase, 2026-10-24).
 *
 * Layer 1 — real query field contract: asserts on the literal SITE_CONFIG_QUERY
 *   source in wp-api.ts (the exact text sent to WPGraphQL at build time).
 *   The backend ACF group (group_site_config → layout_hot_stats → cards)
 *   registers exactly: cardId icon number label source gradient enabled.
 *   Selecting any field the backend has not registered makes WPGraphQL
 *   reject the WHOLE siteConfig query, which would silently drop all CMS
 *   homepage config to defaults — so the phase-1 release MUST NOT select
 *   sourceUrl/period. Phase 2 (backend ACF registration) must flip that
 *   negative assertion in the same commit that extends the query.
 *
 * Layer 2 — defaults gate: the shipped defaultSiteConfig must be the
 *   neutral first-release state (all stat cards disabled, no unprovable
 *   claims anywhere in the defaults).
 *
 * Layer 3 — merge behavior: partial WP configs must not resurrect values
 *   the editor cleared (stripUndefined), and section types absent from WP
 *   are dropped, not filled from defaults.
 *
 * getSiteConfig()'s network/GraphQL-error fallback to defaultSiteConfig is
 * NOT unit-tested here (wp-api.ts pulls import.meta.env and a JSON import
 * that node --test cannot load); it is covered end-to-end by the S3/S6
 * build scenarios in docs/seo/trust-remediation-review-2026-10-24.md.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { defaultSiteConfig, mergeSiteConfig } from './site-config.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const wpApiSource = readFileSync(path.join(here, 'wp-api.ts'), 'utf8');

function siteConfigQuery() {
  const m = wpApiSource.match(/const SITE_CONFIG_QUERY = `([\s\S]*?)`;/);
  assert.ok(m, 'SITE_CONFIG_QUERY not found in wp-api.ts');
  return m[1];
}

function hotStatsFragment() {
  const q = siteConfigQuery();
  const m = q.match(
    /\.\.\. on SiteConfigHomepageSectionsHotStatsLayout \{([\s\S]*?)\n {6}\}/,
  );
  assert.ok(m, 'HotStatsLayout fragment not found in SITE_CONFIG_QUERY');
  return m[1];
}

test('SITE_CONFIG_QUERY selects every card field the backend ACF group registers', () => {
  const frag = hotStatsFragment();
  for (const f of ['cardId', 'icon', 'number', 'label', 'source', 'gradient', 'enabled']) {
    assert.match(
      frag,
      new RegExp(`\\b${f}\\b`),
      `HotStatsLayout fragment must select ${f} (registered ACF sub-field)`,
    );
  }
});

test('SITE_CONFIG_QUERY must NOT select sourceUrl/period until the backend registers them', () => {
  // Phase-1 gate. Querying an unregistered field fails the entire siteConfig
  // query → getSiteConfig catch → whole homepage silently falls back to
  // defaults. Phase 2 updates this assertion in the same commit as the query.
  const frag = hotStatsFragment();
  assert.doesNotMatch(
    frag,
    /\bsourceUrl\b/,
    'sourceUrl selected before ACF registration would fail the whole query',
  );
  assert.doesNotMatch(
    frag,
    /\bperiod\b/,
    'period selected before ACF registration would fail the whole query',
  );
});

test('RawAcfHomeSection card type declares optional sourceUrl/period (phase-2 readiness)', () => {
  const m = wpApiSource.match(/cards\?: Array<\{([\s\S]*?)\}>;/);
  assert.ok(m, 'RawAcfHomeSection.cards type not found');
  assert.match(m[1], /\bsourceUrl\?: string;/);
  assert.match(m[1], /\bperiod\?: string;/);
});

test('defaultSiteConfig ships the neutral first-release hero (no unprovable claims)', () => {
  const hero = defaultSiteConfig.homepageSections.find((s) => s.type === 'hero');
  assert.ok(hero, 'hero default missing');
  assert.equal(hero.headlineLine1, 'Independent');
  assert.equal(hero.trustBadge, 'Sourced statistics · Named references');
  const serialized = JSON.stringify(defaultSiteConfig);
  for (const banned of ['50,000', '#1 Source', '12,000', '30,000+', '$232B', 'Trusted by']) {
    assert.ok(
      !serialized.includes(banned),
      `defaultSiteConfig must not contain unverifiable claim "${banned}"`,
    );
  }
});

test('defaultSiteConfig disables all 8 default stat cards (first-release: cards hidden)', () => {
  const hot = defaultSiteConfig.homepageSections.find((s) => s.type === 'hot-stats');
  assert.ok(hot, 'hot-stats default missing');
  assert.equal(hot.cards.length, 8);
  for (const c of hot.cards) {
    assert.equal(c.enabled, false, `default card ${c.id} must ship disabled`);
  }
});

test('defaultSiteConfig newsletter carries no weekly promise and no subscriber count', () => {
  const nl = defaultSiteConfig.homepageSections.find((s) => s.type === 'newsletter-cta');
  assert.ok(nl, 'newsletter default missing');
  assert.equal(nl.socialProof, '');
  assert.ok(!/every week|weekly/i.test(nl.description), 'description must not promise a frequency');
});

test('mergeSiteConfig drops section types absent from the WP response', () => {
  const partial = {
    homepageSections: [
      {
        id: 'hero',
        type: 'hero',
        enabled: true,
        headlineLine1: 'Independent',
        headlineHighlight: 'SaaS Statistics',
        headlineLine2: '& Market Data',
        trustBadge: 'Sourced statistics · Named references',
        searchPlaceholder: 'Search SaaS statistics, trends, data...',
        taglinePhrases: ['Numbers scoped by period, geography, and source.'],
        pillCount: 3,
      },
    ],
  };
  const cfg = mergeSiteConfig(partial);
  assert.ok(!cfg.homepageSections.some((s) => s.type === 'hot-stats'));
  assert.equal(cfg.homepageSections.length, 1);
});

test('mergeSiteConfig keeps an empty-string override (cleared social proof stays cleared)', () => {
  // Editor cleared the newsletter social proof in WP: the transform passes
  // socialProof: '' (empty string, kept by stripUndefined) and the section
  // renders nothing. A value REMOVED from the WP payload (undefined) must
  // fall back to the default — that fallback is the neutral '' too.
  const partial = {
    homepageSections: [
      {
        id: 'newsletter-cta',
        type: 'newsletter-cta',
        enabled: true,
        pillText: '📧 SaaS research updates',
        description: 'SaaS research updates. No spam, unsubscribe anytime.',
        emailPlaceholder: 'you@company.com',
        buttonLabel: 'Subscribe',
        socialProof: '',
      },
    ],
  };
  const cfg = mergeSiteConfig(partial);
  const nl = cfg.homepageSections.find((s) => s.type === 'newsletter-cta');
  assert.equal(nl.socialProof, '');
});

test('mergeSiteConfig keeps WP hot-stats cards as delivered (component filters disabled ones)', () => {
  const partial = {
    homepageSections: [
      {
        id: 'hot-stats',
        type: 'hot-stats',
        enabled: true,
        maxCards: 8,
        cards: [
          {
            id: 's1',
            icon: '📊',
            number: '$299.1B',
            label: 'SaaS spending, 2025 (forecast)',
            source: 'Gartner',
            enabled: false,
          },
        ],
      },
    ],
  };
  const cfg = mergeSiteConfig(partial);
  const hot = cfg.homepageSections.find((s) => s.type === 'hot-stats');
  assert.equal(hot.cards.length, 1);
  assert.equal(hot.cards[0].enabled, false);
  assert.equal(hot.cards[0].number, '$299.1B');
});
