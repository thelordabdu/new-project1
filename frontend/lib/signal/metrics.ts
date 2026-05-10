/**
 * metrics.ts
 * Compute health metrics from clean R-R interval arrays.
 * Pure functions — no side effects, no browser APIs.
 */

import { cleanRR } from './filter'

// RMSSD — standard HRV metric (same method Whoop uses)
export function computeRMSSD(rr: number[]): number {
  const clean = cleanRR(rr)
  if (clean.length < 2) return 0
  const diffs = clean.slice(1).map((v, i) => Math.pow(v - clean[i], 2))
  return Math.sqrt(diffs.reduce((a, b) => a + b, 0) / diffs.length)
}

// Average HR from R-R intervals
export function rrToHR(rr: number[]): number {
  if (rr.length === 0) return 0
  const mean = rr.reduce((a, b) => a + b, 0) / rr.length
  return Math.round(60000 / mean)
}

// HR zone (1–5) from a single HR value and max HR
export function hrZone(hr: number, maxHR: number): 1 | 2 | 3 | 4 | 5 {
  const pct = hr / maxHR
  if (pct < 0.5) return 1
  if (pct < 0.6) return 2
  if (pct < 0.7) return 3
  if (pct < 0.8) return 4
  return 5
}
