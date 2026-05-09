/**
 * filter.ts
 * Artifact removal for raw R-R interval streams.
 * Pure functions — no React, no browser APIs.
 */

// Remove physiologically impossible values (HR 30–220 BPM → RR 273–2000ms)
export function filterPhysiological(rr: number[]): number[] {
  return rr.filter(v => v >= 273 && v <= 2000)
}

// Remove values that deviate >20% from local window median (motion artifact)
export function filterArtifacts(rr: number[], threshold = 0.20): number[] {
  return rr.filter((v, i, arr) => {
    const window = arr.slice(Math.max(0, i - 5), i + 6).slice().sort((a, b) => a - b)
    const median = window[Math.floor(window.length / 2)]
    return Math.abs(v - median) / median < threshold
  })
}

export function cleanRR(rr: number[]): number[] {
  return filterArtifacts(filterPhysiological(rr))
}
