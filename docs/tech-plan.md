# Technical plan: multi-wearable-tracker (web MVP)

**Agent:** Technical Planning  
**Inputs:** `docs/brief.md`, `docs/business.md`, `docs/plan.md`, stakeholder clarifications.  
**Scope:** Web MVP (Next.js) — precedes iOS app.

---

## Core architecture philosophy

This is not an API wrapper. The product has two parallel data systems running simultaneously:

1. **Display layer** — Whoop API data shown to the user. Fast to ship, familiar numbers, trusted by users.
2. **Learning layer** — our own metric engine running silently on raw BLE data, computing the same metrics independently, comparing against Whoop's output, and improving over time.

Once the learning layer matches Whoop within a defined threshold for enough consecutive days, it gets flagged for manual review. On approval, it becomes the primary display layer. Whoop's data moves to a hidden DB column — still ingested, still used for ongoing comparison, never shown to users again.

The APIs are **training data and a validation tool**, not the product.

```
┌─────────────────────────────────────────────────────┐
│                    USER SEES                        │
│         Whoop API metrics (Phase 1)                 │
│         Our algo metrics  (Phase 2+)                │
└─────────────────────────────────────────────────────┘
              ▲                        ▲
              │                        │
     ┌────────────────┐    ┌───────────────────────┐
     │   Whoop API    │    │   Our Metric Engine   │
     │ (cloud, post-  │    │ (BLE raw → compute)   │
     │    sync)       │    │  runs silently always  │
     └────────────────┘    └───────────────────────┘
              │                        │
              └──────────┬─────────────┘
                         │
                  ┌──────────────┐
                  │  Comparator  │
                  │  auto-flags  │
                  │  divergence  │
                  └──────────────┘
                         │
                  ┌──────────────┐
                  │ Admin review │
                  │ approve flip │
                  └──────────────┘
```

---

## 1. Stack decisions

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Full-stack in one repo — UI, API routes, OAuth callbacks, webhook handlers. |
| Language | **TypeScript** | Type safety critical for signal processing and health data mapping. |
| Database | **Supabase (hosted Postgres)** | Managed Postgres + Row Level Security + built-in Auth. |
| User auth | **Supabase Auth — magic link** | Passwordless, no password management overhead. |
| ORM | **Prisma** | Type-safe queries, schema-as-code migrations. |
| Styling | **Tailwind CSS** | Fast iteration, no context switching. |
| Deployment | **Vercel** | Native Next.js hosting, Vercel Cron for background jobs. |
| BLE | **Web Bluetooth API** (web) → **React Native BLE** (app later) | Direct device connection, no API dependency for raw data. |
| Signal processing | **Custom TypeScript** (simple) → **Python microservice** (if needed) | Start simple, extract to a service if DSP gets complex. |
| iPhone GPS | **Core Location** (iOS app later) / **Browser Geolocation API** (web) | Overlaid on HR data for outdoor workouts — replaces GPS-less Whoop. |

---

## 2. Repository structure

```
new-project1/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # home / hub
│   │   ├── workouts/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx           # workout detail — dual trace view
│   │   └── settings/
│   │       └── connections/page.tsx
│   └── api/
│       ├── auth/callback/route.ts
│       ├── connect/
│       │   ├── whoop/route.ts
│       │   └── whoop/callback/route.ts
│       ├── webhooks/
│       │   └── whoop/route.ts
│       ├── sync/
│       │   └── whoop/route.ts
│       └── admin/
│           └── algo-review/route.ts    # migration approval endpoint
├── lib/
│   ├── ble/
│   │   ├── connect.ts                  # BLE device connection + GATT
│   │   ├── whoop-ble.ts               # Whoop-specific BLE parsing
│   │   └── garmin-ble.ts              # Garmin BLE heart rate profile
│   ├── signal/
│   │   ├── filter.ts                  # noise filtering, artifact removal
│   │   ├── rr-intervals.ts            # R-R interval extraction
│   │   └── metrics.ts                 # HRV, respiratory rate, etc.
│   ├── algo/
│   │   ├── recovery.ts                # our recovery score formula
│   │   ├── strain.ts                  # our strain formula
│   │   ├── sleep.ts                   # our sleep staging
│   │   ├── comparator.ts              # diff our output vs Whoop API output
│   │   └── migration.ts               # threshold detection + flag logic
│   ├── integrations/
│   │   └── whoop.ts                   # Whoop API v2 client
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── db/
│       └── queries.ts
├── prisma/
│   └── schema.prisma
├── components/
│   ├── hub/
│   ├── workout/
│   └── ui/
└── docs/
```

---

## 3. Data models

### 3.1 `profiles`
```sql
profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name  text,
  metric_prefs  jsonb,        -- user's selected metrics for home + workout views
  algo_phase    text DEFAULT 'whoop_primary',  -- 'whoop_primary' | 'our_primary'
  created_at    timestamptz DEFAULT now()
)
```

**`metric_prefs` shape:**
```json
{
  "home": ["recovery", "hrv", "sleep_score", "strain"],
  "workout_overlay": ["heart_rate", "heart_rate_zones"]
}
```

---

### 3.2 `wearable_connections`
```sql
wearable_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE,
  provider          text NOT NULL,           -- 'whoop' | 'garmin'
  access_token      text,                    -- OAuth token (encrypted)
  refresh_token     text,
  token_expires_at  timestamptz,
  provider_user_id  text,
  ble_device_id     text,                    -- BLE device identifier for reconnection
  status            text DEFAULT 'active',   -- 'active' | 'error' | 'revoked'
  last_synced_at    timestamptz,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
)
```

---

### 3.3 `workouts`
One logical workout. Multiple `device_traces` attach to it.

```sql
workouts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type  text NOT NULL,
  started_at     timestamptz NOT NULL,
  ended_at       timestamptz,
  source         text NOT NULL,    -- 'in_app' | 'whoop' | 'garmin'
  created_at     timestamptz DEFAULT now()
)
```

---

### 3.4 `device_traces`
Raw sensor data per device per workout.

```sql
device_traces (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id            uuid REFERENCES workouts(id) ON DELETE CASCADE,
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE,
  provider              text NOT NULL,         -- 'whoop' | 'garmin' | 'ble_whoop' | 'ble_garmin'
  provider_workout_id   text,
  started_at            timestamptz NOT NULL,
  ended_at              timestamptz,
  raw_rr_intervals      jsonb,                 -- [{ts, rr_ms}] — raw R-R intervals from BLE
  raw_accelerometer     jsonb,                 -- [{ts, x, y, z}]
  raw_spo2              jsonb,                 -- [{ts, value}]
  raw_skin_temp         jsonb,                 -- [{ts, value_c}] — Whoop only
  raw_gps               jsonb,                 -- [{ts, lat, lng, alt}] — from phone GPS
  raw_api_summary       jsonb,                 -- full Whoop/Garmin API response (validation source)
  confidence            jsonb,                 -- signal quality heuristics
  created_at            timestamptz DEFAULT now(),
  UNIQUE (provider, provider_workout_id)
)
```

---

### 3.5 `daily_snapshots`
Per-day hub metrics. Stores both our computed values and the API values side by side.

```sql
daily_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date                  date NOT NULL,
  provider              text NOT NULL,          -- 'whoop' | 'garmin'

  -- API values (display layer, Phase 1 / validation source Phase 2+)
  api_recovery          numeric,
  api_hrv_rmssd         numeric,
  api_resting_hr        numeric,
  api_strain            numeric,
  api_sleep_score       numeric,
  api_raw               jsonb,                  -- full raw API response

  -- Our computed values (learning layer → display layer Phase 2+)
  our_recovery          numeric,
  our_hrv_rmssd         numeric,
  our_resting_hr        numeric,
  our_strain            numeric,
  our_sleep_score       numeric,
  our_algo_version      text,                   -- which version of our algo produced this

  -- Comparison
  delta_recovery        numeric,                -- api_recovery - our_recovery
  delta_hrv             numeric,
  delta_strain          numeric,
  within_threshold      boolean,                -- true if all deltas within acceptable range
  flagged_for_review    boolean DEFAULT false,

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (user_id, provider, date)
)
```

---

### 3.6 `algo_migration_log`
Tracks the migration state and approval history.

```sql
algo_migration_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id),
  event             text NOT NULL,    -- 'threshold_hit' | 'approved' | 'rejected' | 'reverted'
  consecutive_days  int,              -- days within threshold when flagged
  avg_delta         numeric,          -- average delta across all metrics at flag time
  approved_by       text,             -- admin user who approved
  notes             text,
  created_at        timestamptz DEFAULT now()
)
```

---

### 3.7 `sync_log`
```sql
sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES profiles(id),
  provider        text NOT NULL,
  sync_type       text NOT NULL,     -- 'ble' | 'webhook' | 'poll' | 'manual'
  status          text NOT NULL,     -- 'success' | 'error' | 'rate_limited'
  records_written int,
  error_detail    text,
  started_at      timestamptz DEFAULT now(),
  finished_at     timestamptz
)
```

---

## 4. BLE data collection

### 4.1 Whoop BLE

Whoop exposes a custom GATT service. When HR Broadcast is enabled in the Whoop app:

- **Standard BLE HR profile** (UUID `180D`) — broadcasts HR + R-R intervals. Any BLE-capable device can read this.
- **Custom GATT service** (UUID `61080000-8d6d-82b8-614a-1c8cb0f8dcc6`) — raw PPG + accelerometer packets. Requires reverse-engineering (see `whoop-reader` on GitHub).

**For v0:** Use the standard HR profile — HR + R-R intervals. This is enough to compute HRV, respiratory rate, and strain.

**R-R interval data from standard BLE HR profile:**
```typescript
// BLE Heart Rate Measurement characteristic (0x2A37)
// If bit 4 of flags byte is set, R-R intervals follow
// Each R-R value is uint16, units: 1/1024 seconds
// Convert: rr_ms = (rr_raw / 1024) * 1000
```

### 4.2 Garmin BLE

Garmin watches broadcast the standard BLE HR profile when HR broadcast is enabled. Same as Whoop — you get HR + R-R intervals. Some Garmin models also broadcast cadence.

### 4.3 Web Bluetooth API (for web MVP)

```typescript
// lib/ble/connect.ts
async function connectToHRM() {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['heart_rate'] }],
    optionalServices: ['battery_service']
  });

  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService('heart_rate');
  const characteristic = await service.getCharacteristic('heart_rate_measurement');

  await characteristic.startNotifications();
  characteristic.addEventListener('characteristicvaluechanged', handleHRMData);

  return device;
}

function handleHRMData(event: Event) {
  const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
  const flags = value.getUint8(0);
  const hr = flags & 0x1 ? value.getUint16(1, true) : value.getUint8(1);

  const rrIntervals: number[] = [];
  if (flags & 0x10) { // R-R intervals present
    let offset = (flags & 0x1) ? 3 : 2;
    if (flags & 0x8) offset += 2; // skip energy expended
    while (offset + 1 < value.byteLength) {
      const rr_raw = value.getUint16(offset, true);
      rrIntervals.push((rr_raw / 1024) * 1000); // convert to ms
      offset += 2;
    }
  }

  // write to local buffer → process → store
  ingestSample({ hr, rrIntervals, ts: Date.now() });
}
```

**Note:** Web Bluetooth requires HTTPS and a user gesture to trigger. Works in Chrome/Edge. Not supported in Firefox or Safari — this is a known limitation for the web MVP. iOS app will use a proper React Native BLE library.

---

## 5. Signal processing pipeline

### 5.1 Artifact filtering

Raw R-R intervals contain noise — missed beats, motion artifacts, poor contact. Filter before computing metrics:

```typescript
// lib/signal/filter.ts

// Remove physiologically impossible values
// Human HR range: ~30–220 BPM → R-R range: ~273ms–2000ms
function filterPhysiological(rr: number[]): number[] {
  return rr.filter(v => v >= 273 && v <= 2000);
}

// Remove values that deviate too much from local median (motion artifact)
function filterArtifacts(rr: number[], threshold = 0.20): number[] {
  return rr.filter((v, i, arr) => {
    const window = arr.slice(Math.max(0, i-5), i+5);
    const median = window.sort()[Math.floor(window.length/2)];
    return Math.abs(v - median) / median < threshold;
  });
}
```

### 5.2 HRV computation

```typescript
// lib/signal/metrics.ts

// RMSSD — same method Whoop uses
function computeRMSSD(rr: number[]): number {
  if (rr.length < 2) return 0;
  const diffs = rr.slice(1).map((v, i) => Math.pow(v - rr[i], 2));
  return Math.sqrt(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

// SDNN — standard deviation of all R-R intervals
function computeSDNN(rr: number[]): number {
  const mean = rr.reduce((a, b) => a + b, 0) / rr.length;
  const variance = rr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rr.length;
  return Math.sqrt(variance);
}

// Respiratory rate — HRV frequency band analysis (RSA)
// Simplified: count R-R modulation cycles in 0.15–0.4 Hz band
function estimateRespiratoryRate(rr: number[]): number {
  // Implementation: FFT on R-R series, find dominant frequency in respiratory band
  // Returns breaths per minute
}
```

### 5.3 Recovery score (our algorithm — v0.1)

Starting formula — will be refined via comparison with Whoop API output:

```typescript
// lib/algo/recovery.ts
// v0.1 — simple weighted formula, will be tuned over time

function computeRecovery(inputs: {
  hrv_rmssd: number,      // higher = better
  resting_hr: number,     // lower = better
  sleep_hours: number,    // more = better (up to ~9)
  spo2: number,           // higher = better
  skin_temp_delta: number // deviation from baseline — higher = worse
}): number {
  // Normalize each input to 0–1 range (based on population norms)
  // Weight and combine
  // Return 0–100 score
}
```

### 5.4 Strain score (our algorithm — v0.1)

```typescript
// lib/algo/strain.ts
// Based on time in HR zones, weighted by zone intensity

function computeStrain(hrZoneDurations: {
  zone1_ms: number,  // 50–60% max HR
  zone2_ms: number,  // 60–70%
  zone3_ms: number,  // 70–80%
  zone4_ms: number,  // 80–90%
  zone5_ms: number,  // 90–100%
}): number {
  // Whoop uses a 0–21 scale
  // Zone time is weighted exponentially by zone (zone 5 >> zone 1)
  // We use same scale for direct comparison
}
```

---

## 6. Whoop API integration (display + validation)

### 6.1 OAuth 2.0 flow

**Important: Use Whoop API v2. v1 is deprecated, removal after October 2025.**

```
Auth URL:   https://api.prod.whoop.com/oauth/oauth2/auth
Token URL:  https://api.prod.whoop.com/oauth/oauth2/token
Base URL:   https://api.prod.whoop.com/developer/v1/
```

Required scopes: `read:recovery read:sleep read:workout read:body_measurement read:profile`

### 6.2 Key endpoints (MVP)

| Endpoint | Data |
|---|---|
| `GET /user/profile/basic` | User ID, name |
| `GET /user/measurement/body` | Max HR, height, weight (for zone calc) |
| `GET /recovery?limit=N` | Recovery score, HRV, RHR, SpO2, skin temp |
| `GET /activity/sleep?limit=N` | Sleep stages, duration, performance score |
| `GET /activity/workout?limit=N` | Strain, avg HR, max HR, zone durations, calories |
| `GET /cycle?limit=N` | Physiological cycle (links recovery + sleep + workouts) |

### 6.3 Webhook events (v2)

Register at developer.whoop.com dashboard. Endpoint: `POST /api/webhooks/whoop`

Events to handle:
- `workout.updated` → fetch workout → upsert `device_traces.raw_api_summary`
- `recovery.updated` → fetch recovery → upsert `daily_snapshots.api_*` fields
- `sleep.updated` → fetch sleep → upsert `daily_snapshots.api_sleep_score`

Always validate HMAC signature. Return 200 immediately or Whoop retries.

---

## 7. Comparator + migration system

### 7.1 Comparator (runs nightly after both data sources are populated)

```typescript
// lib/algo/comparator.ts

interface ComparisonResult {
  date: string;
  deltas: {
    recovery: number;    // api_recovery - our_recovery
    hrv: number;
    strain: number;
    sleep_score: number;
  };
  within_threshold: boolean;
  pct_error: {
    recovery: number;    // abs(delta) / api_value * 100
    hrv: number;
    strain: number;
  };
}

const THRESHOLD_PCT = 5; // within 5% = "matched"

function compare(snapshot: DailySnapshot): ComparisonResult {
  // compute deltas
  // check if all within THRESHOLD_PCT
  // return result
}
```

### 7.2 Migration trigger

```typescript
// lib/algo/migration.ts

const CONSECUTIVE_DAYS_REQUIRED = 14; // 2 weeks within threshold

async function checkMigrationEligibility(userId: string): Promise<void> {
  // Query last N daily_snapshots ordered by date
  // Count consecutive days where within_threshold = true
  // If >= CONSECUTIVE_DAYS_REQUIRED:
  //   → set flagged_for_review = true on latest snapshot
  //   → insert 'threshold_hit' event into algo_migration_log
  //   → (future: send notification to admin)
}
```

### 7.3 Admin approval

`POST /api/admin/algo-review` with `{ userId, action: 'approve' | 'reject' }`

On approve:
- Set `profiles.algo_phase = 'our_primary'` for that user
- Log `'approved'` event to `algo_migration_log`
- From this point, UI reads `our_*` fields. `api_*` fields still populated but never shown.

On reject:
- Log `'rejected'` event
- System keeps learning, will re-flag after another N consecutive days

### 7.4 Post-migration divergence handling

Even after migration, the comparator keeps running. If a day shows delta > threshold:
- Log it, but don't auto-revert
- Increment a `divergence_count` on the user
- If 3+ divergences in 7 days → auto-flag for admin review again
- Admin can investigate via DB and decide whether to revert or update algorithm

---

## 8. API route reference

| Method | Route | Purpose | Auth |
|---|---|---|---|
| GET | `/api/connect/whoop` | Initiate Whoop OAuth | User session |
| GET | `/api/connect/whoop/callback` | Whoop OAuth callback | — |
| POST | `/api/webhooks/whoop` | Receive Whoop push events | HMAC sig |
| POST | `/api/sync/whoop` | Manual / on-demand Whoop pull | User session |
| GET | `/api/workouts` | List workouts | User session |
| GET | `/api/workouts/[id]` | Single workout + traces | User session |
| GET | `/api/hub` | Daily hub metrics (reads phase-appropriate source) | User session |
| PATCH | `/api/profile/metrics` | Update metric_prefs | User session |
| DELETE | `/api/connect/[provider]` | Disconnect wearable | User session |
| POST | `/api/admin/algo-review` | Approve/reject migration | Admin only |

**`/api/hub` logic:**
```typescript
// If user.algo_phase === 'whoop_primary': return api_* fields
// If user.algo_phase === 'our_primary':   return our_* fields
// Always: never expose the non-primary source to the client response
```

---

## 9. GPS integration

Whoop has no GPS. For outdoor workouts on the web MVP, use the browser Geolocation API. On iOS app, use Core Location.

```typescript
// Collect GPS alongside BLE HR during an active workout session
// Store as raw_gps on device_traces: [{ts, lat, lng, alt, accuracy}]
// Derive: distance, pace, elevation gain — same as Garmin would provide
// This means our app can show distance + pace for Whoop users that Whoop's own app cannot
```

This is a genuine feature advantage over the Whoop app, not just parity.

---

## 10. Environment variables

```bash
# Whoop
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
WHOOP_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
CRON_SECRET=

# Admin
ADMIN_USER_IDS=   # comma-separated Supabase user IDs with admin access
```

---

## 11. Security notes

- OAuth tokens encrypted at rest via Supabase Vault or pgcrypto
- RLS on all tables — users can only access their own rows
- Webhook HMAC validation — reject without valid signature
- Admin routes check `ADMIN_USER_IDS` env var — no user can self-elevate
- Never log raw health payloads or tokens
- `our_*` and `api_*` fields in `daily_snapshots` — never expose both to the same client response

---

## 12. MVP build order

1. **BLE proof of concept** — connect to Whoop/Garmin over BLE, capture R-R intervals, log to console. (v0)
2. **Signal processing** — filter artifacts, compute RMSSD, compare to Whoop app's HRV display manually. (v0.1)
3. **Supabase setup** — schema, RLS, Prisma. (v0.2)
4. **Whoop OAuth + API pull** — connect flow, backfill, populate `api_*` fields. (v0.3)
5. **Comparator** — run nightly diff, populate `delta_*` and `within_threshold`. (v0.4)
6. **Hub UI** — show Whoop API metrics. Metric selection. (v0.5)
7. **Workout view** — dual trace (BLE raw + API summary). (v0.6)
8. **Migration system** — threshold detection, admin approval flow. (v0.7)
9. **GPS overlay** — phone GPS during active workout session. (v0.8)
10. **Auth + connections management** — magic link, disconnect/reconnect, error states. (v0.9)
11. **Full MVP** — all flows per `docs/plan.md`. (v1.0)

---

## 13. Open questions

| Question | Owner | Blocking? |
|---|---|---|
| Whoop developer account + client credentials | Abdullah | Yes — apply at developer.whoop.com |
| Web Bluetooth Safari/Firefox limitation — acceptable for web MVP? | PM | No — Chrome-only is fine for internal testing |
| Consecutive days threshold (14 days) — adjust up or down? | Abdullah | No — can change in config |
| Algorithm versioning strategy — how to handle algo updates retroactively? | Tech | No (future problem) |
