# Algorithm strategy: learning pipeline + migration

**Agent:** Technical Planning  
**Purpose:** Defines how our metric engine learns, how it gets validated against Whoop's API, and how and when it replaces Whoop's numbers as the primary display source.

---

## Philosophy

Whoop's algorithms are a black box. We don't know their exact formulas, weights, or calibration. But we have the same raw inputs (R-R intervals, accelerometer, SpO2, skin temp) and we know the outputs (their API).

We use their outputs as a **labeled dataset** to train and validate our own algorithms — then progressively replace them once we've proven our numbers are trustworthy.

This is an unusual approach for a consumer app. It's also the core technical moat: once we've built a validated, transparent metric engine that we understand end-to-end, we're not dependent on any vendor's API, approval process, or pricing.

---

## The three phases

### Phase 1 — Whoop primary (launch state)
- User sees Whoop API metrics on all screens
- Our algorithms run silently in the background
- Both outputs stored in DB — only API output shown to users
- Comparator runs nightly, logs deltas

### Phase 2 — Our metrics primary (post-migration)
- Our computed metrics shown to users
- Whoop API still pulled, stored in hidden `api_*` columns
- Comparator still runs — monitors for drift
- Users never know a migration happened

### Phase 3 — Ongoing (forever)
- Both systems run indefinitely
- Divergences trigger investigation, not panic
- Our algorithm updates are version-stamped — can replay history with new algo versions

---

## What we compute vs what Whoop computes

| Metric | Our input | Whoop input | Notes |
|---|---|---|---|
| HRV (RMSSD) | R-R intervals from BLE | Same sensors, same formula | Should match closely |
| Resting HR | R-R intervals overnight | Same | Should match closely |
| Respiratory rate | R-R interval modulation (RSA) | PPG + accelerometer | May differ slightly |
| Recovery score | HRV + RHR + sleep + SpO2 + skin temp | Same inputs, proprietary weights | Will differ initially — this is what we tune |
| Strain score | HR zone durations from R-R | Same inputs, different scale calibration | Calibrate to 0–21 scale for comparison |
| Sleep stages | Accelerometer + HR patterns | Same sensors + proprietary classifier | Hardest to match — start simple |
| SpO2 | Raw BLE SpO2 characteristic | Same sensor | Should match |
| Skin temp delta | BLE skin temp characteristic (Whoop only) | Same sensor | Should match |

---

## Algorithm versions

Every time we update an algorithm, increment the version string. Store it on each `daily_snapshots` row in `our_algo_version`.

Algorithm files live in `backend/app/algorithms/`. Each version bump should be reflected in the `our_algo_version` column on `daily_snapshots` rows.

```
v0.1.0 — open-wearables baseline (resilience.py + sleep.py as-is)
v0.2.0 — tuned weights after first 30 days of comparison data
v0.3.0 — improved sleep staging
...
```

This lets us retroactively recompute historical snapshots with newer algorithm versions and see if they would have been within threshold earlier.

---

## Comparator: how it works

Runs nightly via Vercel Cron after both BLE data and Whoop API data are available for the day.

### Metrics compared

| Metric | Threshold (% error) | Weight in overall score |
|---|---|---|
| Recovery score | ±5% | 40% |
| HRV (RMSSD) | ±5% | 30% |
| Strain | ±8% | 20% |
| Sleep score | ±10% | 10% |

Sleep gets more tolerance because sleep staging is the hardest signal to classify accurately.

### Per-day result

```typescript
interface DailyComparison {
  date: string;
  metrics: {
    recovery: { api: number; ours: number; delta_pct: number; within: boolean };
    hrv:      { api: number; ours: number; delta_pct: number; within: boolean };
    strain:   { api: number; ours: number; delta_pct: number; within: boolean };
    sleep:    { api: number; ours: number; delta_pct: number; within: boolean };
  };
  weighted_score: number;   // 0–1, weighted average of within scores
  within_threshold: boolean; // true if weighted_score >= 0.9
}
```

`within_threshold = true` means we're close enough on that day. We need 14 consecutive of these to trigger a migration flag.

---

## Migration trigger logic

```
Every night after comparator runs:
  Query last 14 daily_snapshots for this user ordered by date DESC
  
  If all 14 have within_threshold = true:
    → This is the first time we've hit 14 consecutive? 
      (check algo_migration_log for recent 'threshold_hit')
    → If yes: insert 'threshold_hit' into algo_migration_log
    → Set flagged_for_review = true on today's snapshot
    → (future: ping admin via email/Slack)
    → Do nothing else — wait for admin approval
  
  If streak is broken:
    → Reset. Wait for next 14-day streak.
    → Log the break day for analysis.
```

---

## Admin approval flow

Admin sees a dashboard (internal only, not user-facing) showing:
- Users flagged for migration
- Their 14-day comparison charts
- Average delta per metric over those 14 days
- Algo version that produced the results

Admin actions:
- **Approve** → `profiles.algo_phase = 'our_primary'`, log event
- **Reject** → log event with notes, system resets streak counter, keeps learning

After approval, users' hub and workout pages read from `our_*` columns automatically. No UI change — same numbers, different source.

---

## Post-migration divergence monitoring

After migration, comparator keeps running silently.

If a day has `within_threshold = false` post-migration:
- Log it
- Increment `divergence_count` on user record (7-day rolling window)
- If `divergence_count >= 3` in 7 days → set `re_flagged_for_review = true`
- Admin investigates: is it a bad day (illness, travel, bad BLE contact)? Or an algo drift?

Admin options:
- **Do nothing** — it was a one-off, algo is still good
- **Revert** → `profiles.algo_phase = 'whoop_primary'`, restart learning
- **Investigate** → look at raw data for those days, identify the failure mode, update algo, bump version

---

## Learning feedback loop

After each day's comparison:

1. Compute delta per metric
2. If delta is consistently biased in one direction (e.g. we always compute recovery 3% higher than Whoop):
   - This is a systematic offset → adjust our formula's scaling factor
3. If delta is random noise (sometimes +5%, sometimes -3%):
   - This is likely signal quality variation → improve artifact filtering
4. If delta is large on specific activity types (e.g. swimming, strength training):
   - Activity-specific calibration needed → branch our algorithm by activity type

This feedback doesn't happen automatically in v0. It's a human review process — you look at the data, identify patterns, update the algorithm, bump the version.

**Future:** Once enough data exists, a simple regression or LLM-assisted analysis could suggest weight adjustments automatically. The LLM sees: `[our_output, whoop_output, raw_rr_data, activity_type, delta]` and proposes formula tweaks. You review and apply.

---

## What Whoop's API gives us (as training labels)

These are the ground truth labels we're training against:

| Field | Whoop API endpoint | Our corresponding output |
|---|---|---|
| `score.recovery_score` | `GET /recovery` | `our_recovery` |
| `score.hrv_rmssd_milli` | `GET /recovery` | `our_hrv_rmssd` |
| `score.resting_heart_rate` | `GET /recovery` | `our_resting_hr` |
| `score.strain` | `GET /activity/workout` | `our_strain` |
| `score.sleep_performance_percentage` | `GET /activity/sleep` | `our_sleep_score` |

We never tell users we're using Whoop's data as training labels. This is an internal engineering detail.

---

## Garmin (future)

When Garmin API access is obtained, the same system applies:
- Pull Garmin's metrics (Body Battery, HRV Status, Training Readiness)
- Add `garmin_*` columns to `daily_snapshots`
- Run a second comparator against Garmin's output
- Our single algo should converge on both — if it doesn't, that's a signal our algo is wrong
- Two independent validation sources is stronger than one

---

## Milestone definitions

| Milestone | Definition |
|---|---|
| v0 complete | R-R intervals streaming from BLE device |
| v0.1 complete | RMSSD within 10% of Whoop app HRV display (manual check) |
| Comparator live | Nightly diff running, `daily_snapshots` populating both columns |
| First flag | System detects first 14-day streak within threshold |
| First migration | Admin approves first user migration to our metrics |
| Stable | 30+ days post-migration with <3 divergences per user per month |
