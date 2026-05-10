/**
 * scores.service.ts
 * Fetches hub metrics + daily scores from the backend.
 * Backend decides which source (api_* or our_*) based on algo_phase.
 * Frontend never knows — it just displays what it receives.
 */
import { apiClient } from '@/lib/api-client'
import type { DailyScores, HubMetrics } from '@/types'

export async function fetchHubMetrics(): Promise<HubMetrics> {
  return apiClient.get<HubMetrics>('/scores/hub')
}

export async function fetchDailyScores(date: string): Promise<DailyScores> {
  return apiClient.get<DailyScores>(`/scores/daily?date=${date}`)
}
