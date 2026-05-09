/**
 * user.service.ts
 * User profile + metric preferences.
 */
import { apiClient } from '@/lib/api-client'
import type { UserProfile, MetricPrefs } from '@/types'

export async function fetchProfile(): Promise<UserProfile> {
  return apiClient.get<UserProfile>('/users/me')
}

export async function updateMetricPrefs(prefs: MetricPrefs): Promise<UserProfile> {
  return apiClient.patch<UserProfile>('/users/me/metric-prefs', prefs)
}
