// Shared TypeScript types — mirrors backend Pydantic models
// Keep in sync with backend/app/models/

export interface Workout {
  id: string
  user_id: string
  activity_type: string
  started_at: string
  ended_at: string | null
  source: 'in_app' | 'whoop' | 'garmin'
  created_at: string
}

export interface DeviceTrace {
  id: string
  workout_id: string
  provider: 'whoop' | 'garmin' | 'ble_whoop' | 'ble_garmin'
  started_at: string
  ended_at: string | null
  raw_rr_intervals: RRSample[] | null
  raw_accelerometer: AccelSample[] | null
  raw_spo2: SpO2Sample[] | null
  raw_gps: GPSSample[] | null
  confidence: ConfidenceReport | null
}

export interface WorkoutDetail extends Workout {
  traces: DeviceTrace[]
}

export interface RRSample { ts: number; rr_ms: number }
export interface AccelSample { ts: number; x: number; y: number; z: number }
export interface SpO2Sample { ts: number; value: number }
export interface GPSSample { ts: number; lat: number; lng: number; alt: number }

export interface ConfidenceReport {
  overall: 'high' | 'medium' | 'low'
  hr_coverage: number
  gps_available: boolean
  sensor_type: string
  notes: string
}

export interface DailyScores {
  date: string
  provider_source: 'whoop_api' | 'our_algo' // what backend is currently showing
  recovery: number | null
  hrv_rmssd: number | null
  resting_hr: number | null
  strain: number | null
  sleep_score: number | null
}

export interface HubMetrics {
  today: DailyScores
  last_7_days: DailyScores[]
}

export interface WearableConnection {
  provider: 'whoop' | 'garmin'
  status: 'active' | 'error' | 'revoked'
  last_synced_at: string | null
}

export interface MetricPrefs {
  home: string[]
  workout_overlay: string[]
}

export interface UserProfile {
  id: string
  display_name: string | null
  metric_prefs: MetricPrefs
  algo_phase: 'whoop_primary' | 'our_primary'
}
