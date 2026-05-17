/**
 * Pure sparkline math helpers. SSG-friendly — no DOM, no window.
 *
 * Used by `Sparkline.astro` (Phase 1 Task 12) and consumed at build time
 * during the Hot Stats homepage section render.
 *
 * Specification:
 *   - Series validity: 8–16 finite numbers (Req 2.3).
 *   - Slope-based color: positive / negative / neutral at ±0.01 normalized
 *     linear-regression slope threshold (Req 2.7).
 *   - Decorative fallback when no series: deterministic curve from
 *     `'up' | 'down' | 'flat'` (Req 2.4–2.5).
 *   - aria-label format: "Trend: <direction> <%>% over period" or
 *     "Trend: <direction>" for decorative-only mode (Req 2.14).
 */

export type TrendDirection = 'up' | 'down' | 'flat';
export type TrendClass = 'positive' | 'negative' | 'neutral';

/** Slope threshold for the neutral classification. ±0.01 inclusive. */
const SLOPE_NEUTRAL_THRESHOLD = 0.01;

/** Validity bounds for a series, per Req 2.3. */
const SERIES_MIN_LENGTH = 8;
const SERIES_MAX_LENGTH = 16;

/**
 * Validate per Req 2.3: an array of 8–16 finite numbers.
 * Returns the input as a number[] on success, or null on any violation.
 *
 * Failure modes that return null:
 *   - input is not an array
 *   - length < SERIES_MIN_LENGTH or > SERIES_MAX_LENGTH
 *   - any element is not a finite number (NaN, Infinity, -Infinity, non-number)
 */
export function validateSeries(input: unknown): number[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length < SERIES_MIN_LENGTH || input.length > SERIES_MAX_LENGTH) return null;
  for (const v of input) {
    if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  }
  return input as number[];
}

/**
 * Normalized linear-regression slope.
 *
 * Each value is divided by the series mean (so the slope is dimensionless
 * and comparable across series of different magnitudes), then a least-
 * squares slope is computed against the index axis [0..n-1].
 *
 * Edge cases:
 *   - mean === 0 → returns 0 (treated as neutral by classifyTrend)
 *   - all values equal → den === 0 → returns 0 (flat)
 */
export function computeSlope(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (mean === 0) return 0;

  const ys = values.map((v) => v / mean);
  const xMean = (n - 1) / 2;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (ys[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/**
 * Classify a normalized slope into 'positive' | 'negative' | 'neutral'.
 * Threshold ±0.01 inclusive of the neutral band per Req 2.7.
 */
export function classifyTrend(slope: number): TrendClass {
  if (slope > SLOPE_NEUTRAL_THRESHOLD) return 'positive';
  if (slope < -SLOPE_NEUTRAL_THRESHOLD) return 'negative';
  return 'neutral';
}

/** Convert TrendClass to user-facing direction word. */
export function trendClassToDirection(c: TrendClass): TrendDirection {
  if (c === 'positive') return 'up';
  if (c === 'negative') return 'down';
  return 'flat';
}

/**
 * Convert a 1-D numeric series to two SVG path strings (line + gradient
 * fill) plus the position of the final data point for marker placement.
 *
 * Coordinate space:
 *   x: 0 (first point) → w (last point), evenly spaced
 *   y: 0 (max value, top) → h (min value, bottom), padded 2px top/bottom
 *
 * The fill path closes to (w, h) → (0, h) so it renders as an area chart
 * beneath the line.
 */
export function pointsToPath(
  values: number[],
  w: number,
  h: number,
): { line: string; fill: string; lastX: number; lastY: number } {
  const padY = 2;
  const innerH = h - padY * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = padY + (1 - (v - min) / range) * innerH;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) =>
      i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(' ');

  const fillPath =
    `M 0 ${h} ` +
    points.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') +
    ` L ${w} ${h} Z`;

  const [lastX, lastY] = points[points.length - 1];
  return { line: linePath, fill: fillPath, lastX, lastY };
}

/**
 * Decorative curve for cards without a real series.
 *
 * Returns a smooth-ish series of `length` finite numbers whose slope
 * matches the requested direction. Deterministic — no randomness.
 *
 * Default `length` is 12, in the middle of the 8–16 valid band so
 * pointsToPath gives a nicely balanced sparkline.
 */
export function decorativeCurve(trend: TrendDirection, length = 12): number[] {
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const t = i / (length - 1); // 0 → 1
    const wobble = Math.sin(i * 1.3) * 0.06; // small organic bump
    let value: number;
    if (trend === 'up') value = 0.4 + 0.6 * t + wobble;
    else if (trend === 'down') value = 1.0 - 0.6 * t + wobble;
    else value = 0.7 + wobble * 1.2; // flat with subtle ripple
    out.push(Number(value.toFixed(4)));
  }
  return out;
}

/**
 * Percent change from first value to last value.
 *
 * Edge case: if the first value is 0, returns 0 to avoid Infinity.
 */
export function percentChange(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

/**
 * Compose the aria-label per Req 2.14.
 *   - With a series:        "Trend: up 14.2% over period"
 *   - Decorative-only mode: "Trend: up"  (percentChange === null)
 */
export function formatAriaLabel(
  direction: TrendDirection,
  percentChangeValue: number | null,
): string {
  if (percentChangeValue === null) return `Trend: ${direction}`;
  return `Trend: ${direction} ${Math.abs(percentChangeValue).toFixed(1)}% over period`;
}
