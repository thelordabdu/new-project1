/**
 * filter.ts
 * Artifact removal for raw R-R interval streams.
 * Pure functions — no React, no browser APIs.
 */

// Remove physiologically impossible values (HR 30–180 BPM → RR 333–2000ms)
// Upper HR cap is 180 BPM for resting/recovery context. Workout mode may need adjustment.
export function filterPhysiological(rr: number[]): number[] {
  return rr.filter(v => v >= 333 && v <= 2000)
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
