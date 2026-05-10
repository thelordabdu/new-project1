/**
 * workouts.service.ts
 * All workout API calls go through here.
 * Never call fetch() directly in a component — always use these functions.
 */
import { apiClient } from '@/lib/api-client'
import type { Workout, WorkoutDetail, DeviceTrace } from '@/types'

export async function fetchWorkouts(limit = 20): Promise<Workout[]> {
  return apiClient.get<Workout[]>(`/workouts?limit=${limit}`)
}

export async function fetchWorkout(id: string): Promise<WorkoutDetail> {
  return apiClient.get<WorkoutDetail>(`/workouts/${id}`)
}

export async function fetchWorkoutTraces(id: string): Promise<DeviceTrace[]> {
  return apiClient.get<DeviceTrace[]>(`/workouts/${id}/traces`)
}
