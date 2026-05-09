/**
 * connections.service.ts
 * Wearable connection management — connect, disconnect, status.
 */
import { apiClient } from '@/lib/api-client'
import type { WearableConnection } from '@/types'

export async function fetchConnections(): Promise<WearableConnection[]> {
  return apiClient.get<WearableConnection[]>('/connections')
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
