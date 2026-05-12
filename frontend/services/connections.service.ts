/**
 * connections.service.ts
 * Wearable connection management — connect, disconnect, status.
 */
import { apiClient } from '@/lib/api-client'
import type { WearableConnection } from '@/types'

export async function fetchConnections(): Promise<WearableConnection[]> {
  return apiClient.get<WearableConnection[]>('/connections')
}

export async function connectWhoop(userId: string): Promise<void> {
  const { authorization_url } = await apiClient.get<{ authorization_url: string }>(
    `/oauth/whoop/authorize?user_id=${encodeURIComponent(userId)}`
  )
  // authorization_url is built by the backend using api_base_url.
  // In dev the backend returns http://localhost:8000 as the base, but
  // Whoop requires the ngrok redirect URI. Replace the base if needed.
  window.location.href = authorization_url
}

export async function initiateWhoopConnect(): Promise<{ auth_url: string }> {
  return apiClient.get<{ auth_url: string }>('/connect/whoop')
}

export async function initiateGarminConnect(): Promise<{ auth_url: string }> {
  return apiClient.get<{ auth_url: string }>('/connect/garmin')
}

export async function disconnectProvider(provider: 'whoop' | 'garmin'): Promise<void> {
  return apiClient.delete(`/connect/${provider}`)
}
