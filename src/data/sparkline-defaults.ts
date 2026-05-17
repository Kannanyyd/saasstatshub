/**
 * Hardcoded sparkline series for the 8 default Hero_Stat_Card cards.
 *
 * Used only when WPGraphQL `sparklineData` is absent (Req 2.10/2.11
 * fallback chain: WP response → this map → decorative curve from `trend`).
 *
 * Series semantics:
 *   - 12 points each (mid-density in the 8–16 valid band; looks best at
 *     ~140×32 px which is the default Sparkline render size).
 *   - Trend direction CHOSEN to match each card's narrative (e.g. SaaS
 *     market is rising, so s1 trends up).
 *   - Magnitudes are dimensionless from the renderer's perspective —
 *     pointsToPath normalizes them — so only slope sign matters for color.
 *
 * Card-id → narrative + computed slope class (against ±0.01 threshold):
 *   s1 — Global SaaS Market $232B           (positive, slope ≈ 0.023)
 *   s2 — CAGR 14.2%                          (positive, slope ≈ 0.021)
 *   s3 — 30,000+ companies                   (positive, slope ≈ 0.027)
 *   s4 — Enterprise adoption 78%             (positive, slope ≈ 0.020)
 *   s5 — Cloud adoption 94% (near-saturation) (NEUTRAL, slope ≈ 0.006)
 *        — by design: 88→94 over 12 ticks reflects a flattening curve;
 *          the chart correctly renders neutral grey, not green.
 *   s6 — Mobile SaaS usage 68%               (positive, slope ≈ 0.020)
 *   s7 — Cybersecurity spend $188B           (positive, slope ≈ 0.020)
 *   s8 — AI-powered SaaS tools 12,400        (positive, slope ≈ 0.042)
 */
export const SPARKLINE_DEFAULTS: Readonly<Record<string, readonly number[]>> = {
  s1: [180, 184, 191, 198, 203, 209, 214, 219, 223, 226, 229, 232],
  s2: [11.0, 11.8, 12.1, 12.6, 12.9, 13.4, 13.7, 13.5, 13.9, 14.0, 14.1, 14.2],
  s3: [22000, 23200, 24100, 25000, 25800, 26600, 27400, 28100, 28700, 29200, 29600, 30000],
  s4: [62, 64, 66, 68, 70, 72, 73, 74, 75, 76, 77, 78],
  s5: [88, 89, 90, 90.5, 91, 91.6, 92, 92.5, 93, 93.4, 93.7, 94],
  s6: [54, 56, 58, 59, 60, 62, 63, 64, 65, 66, 67, 68],
  s7: [150, 154, 158, 162, 166, 170, 173, 176, 179, 182, 185, 188],
  s8: [7800, 8200, 8800, 9300, 9900, 10400, 10900, 11300, 11700, 12000, 12200, 12400],
};

/** Lookup helper: returns a mutable copy so callers can pass to `validateSeries`. */
export function defaultSeriesFor(cardId: string): number[] | undefined {
  const series = SPARKLINE_DEFAULTS[cardId];
  return series ? [...series] : undefined;
}
