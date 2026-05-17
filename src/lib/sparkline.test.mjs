// Unit tests for src/lib/sparkline.ts
//
// Run with:  node --test --experimental-strip-types src/lib/sparkline.test.mjs
// or via the npm script:  npm run test:phase1
//
// Tests cover:
//   - validateSeries: 8-16 finite numbers; rejects out-of-range, non-array,
//     non-finite values
//   - computeSlope: rising → +, falling → -, flat → ~0; mean-zero edge case
//   - classifyTrend: ±0.01 boundary, including exact 0.01 (neutral)
//   - decorativeCurve: deterministic, finite, length-respecting, slope sign
//     matches direction
//   - percentChange: first-zero guard, single-element guard
//   - formatAriaLabel: format string contract (Req 2.14)
//   - pointsToPath: produces valid SVG path strings, last point coords match,
//     constant series doesn't divide by zero

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateSeries,
  computeSlope,
  classifyTrend,
  trendClassToDirection,
  pointsToPath,
  decorativeCurve,
  percentChange,
  formatAriaLabel,
} from './sparkline.ts';

// ---------- validateSeries ----------

test('validateSeries accepts 8 finite numbers', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual(validateSeries(arr), arr);
});

test('validateSeries accepts 16 finite numbers', () => {
  const arr = Array.from({ length: 16 }, (_, i) => i + 1);
  assert.deepEqual(validateSeries(arr), arr);
});

test('validateSeries rejects 7 numbers (below min)', () => {
  assert.equal(validateSeries([1, 2, 3, 4, 5, 6, 7]), null);
});

test('validateSeries rejects 17 numbers (above max)', () => {
  assert.equal(validateSeries(Array.from({ length: 17 }, (_, i) => i)), null);
});

test('validateSeries rejects non-array input', () => {
  assert.equal(validateSeries('not an array'), null);
  assert.equal(validateSeries(null), null);
  assert.equal(validateSeries(undefined), null);
  assert.equal(validateSeries({}), null);
});

test('validateSeries rejects array with NaN', () => {
  assert.equal(validateSeries([1, 2, 3, NaN, 5, 6, 7, 8]), null);
});

test('validateSeries rejects array with Infinity', () => {
  assert.equal(validateSeries([1, 2, 3, Infinity, 5, 6, 7, 8]), null);
  assert.equal(validateSeries([1, 2, 3, -Infinity, 5, 6, 7, 8]), null);
});

test('validateSeries rejects array with non-numbers', () => {
  assert.equal(validateSeries([1, 2, 3, '4', 5, 6, 7, 8]), null);
  assert.equal(validateSeries([1, 2, 3, null, 5, 6, 7, 8]), null);
});

// ---------- computeSlope ----------

test('computeSlope: rising series → positive slope', () => {
  const s = [10, 11, 12, 13, 14, 15, 16, 17];
  assert.ok(computeSlope(s) > 0.01, `expected > 0.01, got ${computeSlope(s)}`);
});

test('computeSlope: falling series → negative slope', () => {
  const s = [17, 16, 15, 14, 13, 12, 11, 10];
  assert.ok(computeSlope(s) < -0.01, `expected < -0.01, got ${computeSlope(s)}`);
});

test('computeSlope: flat (all same) → 0', () => {
  const s = [42, 42, 42, 42, 42, 42, 42, 42];
  assert.equal(computeSlope(s), 0);
});

test('computeSlope: mean-zero edge case → 0 (treated as neutral)', () => {
  const s = [-3, -1, 1, 3, -3, -1, 1, 3];
  // mean is 0 → guard returns 0
  assert.equal(computeSlope(s), 0);
});

test('computeSlope: empty array → 0', () => {
  assert.equal(computeSlope([]), 0);
});

// ---------- classifyTrend ----------

test('classifyTrend: 0.05 → positive', () => {
  assert.equal(classifyTrend(0.05), 'positive');
});

test('classifyTrend: -0.05 → negative', () => {
  assert.equal(classifyTrend(-0.05), 'negative');
});

test('classifyTrend: 0.005 (within ±0.01) → neutral', () => {
  assert.equal(classifyTrend(0.005), 'neutral');
});

test('classifyTrend: -0.005 (within ±0.01) → neutral', () => {
  assert.equal(classifyTrend(-0.005), 'neutral');
});

test('classifyTrend: 0 → neutral', () => {
  assert.equal(classifyTrend(0), 'neutral');
});

test('classifyTrend: exactly +0.01 boundary → neutral (inclusive)', () => {
  assert.equal(classifyTrend(0.01), 'neutral');
});

test('classifyTrend: exactly -0.01 boundary → neutral (inclusive)', () => {
  assert.equal(classifyTrend(-0.01), 'neutral');
});

test('classifyTrend: 0.0101 (just above threshold) → positive', () => {
  assert.equal(classifyTrend(0.0101), 'positive');
});

// ---------- trendClassToDirection ----------

test('trendClassToDirection: positive → up', () => {
  assert.equal(trendClassToDirection('positive'), 'up');
});

test('trendClassToDirection: negative → down', () => {
  assert.equal(trendClassToDirection('negative'), 'down');
});

test('trendClassToDirection: neutral → flat', () => {
  assert.equal(trendClassToDirection('neutral'), 'flat');
});

// ---------- decorativeCurve ----------

test('decorativeCurve: up returns 12 finite numbers with positive slope', () => {
  const c = decorativeCurve('up');
  assert.equal(c.length, 12);
  assert.ok(c.every((n) => Number.isFinite(n)));
  assert.ok(computeSlope(c) > 0.01);
});

test('decorativeCurve: down returns negative slope', () => {
  const c = decorativeCurve('down');
  assert.ok(computeSlope(c) < -0.01);
});

test('decorativeCurve: flat returns near-zero slope', () => {
  const c = decorativeCurve('flat');
  const slope = computeSlope(c);
  assert.ok(Math.abs(slope) <= 0.01, `expected |slope| <= 0.01, got ${slope}`);
});

test('decorativeCurve: respects custom length', () => {
  assert.equal(decorativeCurve('up', 8).length, 8);
  assert.equal(decorativeCurve('up', 16).length, 16);
});

test('decorativeCurve: deterministic — two calls produce identical arrays', () => {
  assert.deepEqual(decorativeCurve('up'), decorativeCurve('up'));
  assert.deepEqual(decorativeCurve('down'), decorativeCurve('down'));
  assert.deepEqual(decorativeCurve('flat'), decorativeCurve('flat'));
});

// ---------- percentChange ----------

test('percentChange: 100 → 200 = 100%', () => {
  assert.equal(percentChange([100, 200]), 100);
});

test('percentChange: 200 → 100 = -50%', () => {
  assert.equal(percentChange([200, 100]), -50);
});

test('percentChange: first === 0 → 0 (no Infinity)', () => {
  assert.equal(percentChange([0, 100]), 0);
});

test('percentChange: single value → 0', () => {
  assert.equal(percentChange([100]), 0);
});

test('percentChange: empty → 0', () => {
  assert.equal(percentChange([]), 0);
});

// ---------- formatAriaLabel ----------

test('formatAriaLabel: with positive percent', () => {
  assert.equal(formatAriaLabel('up', 14.2), 'Trend: up 14.2% over period');
});

test('formatAriaLabel: with negative percent (uses absolute value)', () => {
  assert.equal(formatAriaLabel('down', -28.7), 'Trend: down 28.7% over period');
});

test('formatAriaLabel: rounds to 1 decimal', () => {
  assert.equal(formatAriaLabel('up', 14.2333), 'Trend: up 14.2% over period');
});

test('formatAriaLabel: percentChange === null → decorative-only label', () => {
  assert.equal(formatAriaLabel('up', null), 'Trend: up');
  assert.equal(formatAriaLabel('flat', null), 'Trend: flat');
});

// ---------- pointsToPath ----------

test('pointsToPath: rising series produces M..L path with correct endpoints', () => {
  const s = [10, 20, 30];
  const { line, fill, lastX, lastY } = pointsToPath(s, 100, 32);
  assert.ok(line.startsWith('M 0.00'), `line should start at x=0, got: ${line}`);
  assert.ok(line.includes('L 100.00'), 'last L should be at x=100');
  assert.equal(lastX, 100);
  // last value (30) is the max, so y should be at top (= padY = 2)
  assert.equal(lastY, 2);
  // fill should close the path
  assert.ok(fill.startsWith('M 0 32'));
  assert.ok(fill.endsWith('L 100 32 Z'));
});

test('pointsToPath: constant series does not divide by zero', () => {
  const s = [5, 5, 5, 5, 5, 5, 5, 5];
  const { line, lastY } = pointsToPath(s, 100, 32);
  assert.ok(Number.isFinite(lastY));
  assert.ok(!line.includes('NaN'));
  assert.ok(!line.includes('Infinity'));
});

test('pointsToPath: lastY is within [padY, h - padY] for any input', () => {
  const cases = [
    [10, 20, 30, 40, 50, 60, 70, 80],
    [80, 70, 60, 50, 40, 30, 20, 10],
    [100, 100, 100, 100, 100, 100, 100, 100],
    [-5, 0, 5, 10, 15, 20, 25, 30],
  ];
  for (const s of cases) {
    const { lastY } = pointsToPath(s, 140, 32);
    assert.ok(lastY >= 2 && lastY <= 30, `lastY=${lastY} out of range for ${JSON.stringify(s)}`);
  }
});
