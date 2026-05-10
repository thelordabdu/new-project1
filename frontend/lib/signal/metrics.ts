/**
 * metrics.ts
 * Compute health metrics from clean R-R interval arrays.
 * Pure functions — no side effects, no browser APIs.
 */

// RMSSD pooled across multiple packets — diffs only within each packet, never across boundaries.
// Caller must pass pre-cleaned arrays (use cleanRR from filter.ts per packet before calling).
export function computeRMSSD(packets: number[][]): number {
  const squaredDiffs: number[] = []
  for (const rr of packets) {
    for (let i = 1; i < rr.length; i++) {
      squaredDiffs.push(Math.pow(rr[i] - rr[i - 1], 2))
    }
  }
  if (squaredDiffs.length < 2) return 0
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length)
}

// RMSSD for a single packet. Returns null if fewer than 2 intervals.
export function packetRMSSD(rr: number[]): number | null {
  if (rr.length < 2) return null
  const diffs = rr.slice(1).map((v, i) => Math.pow(v - rr[i], 2))
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
