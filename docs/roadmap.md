# Roadmap — multi-wearable-tracker

> Checklist format. Tick items off as they're completed. Update status in `docs/CONTEXT.md` after each session.
>
> Naming: `v0` = epic, `v0.3` = version, `v0.3.1` = sub-task. One branch per sub-task.
> Branch format: `feat/v0.3.1/short-description` or `fix/v0.3.1/short-description`.

---

## v0 — Foundation

**Objective:** Build and wire every layer of the system (BLE → signal processing → DB → API → UI → auth) so the pipeline is real, data flows end-to-end, and the comparator has something meaningful to run against. v0 is not about validation — it's about having a correct, working structure to validate against.

**Done when:** A logged-in user can connect Whoop, see their real recovery/HRV/sleep metrics on the hub, and the comparator is running nightly diffs in the background.

---

- [x] **v0.0 — BLE proof of concept**
  - [x] v0.0.1 — Connect to Whoop over Web Bluetooth, stream R-R intervals to browser console
  - Findings: `docs/v0/v0.0.md`

- [x] **v0.1 — Signal processing**
  - [x] v0.1.1 — Fix RMSSD (per-packet only), wire `cleanRR()`, add gap detection
  - [x] v0.1.2 — Signal quality %, rolling RMSSD avg, JSON export, auto-reconnect on BLE drop
  - Findings: `docs/v0/v0.1-findings.md`
  - Note for v0.6: physiological floor raised to 333 ms (HR 180). Must be context-aware in workout mode.

- [x] **v0.2 — Whoop OAuth + data sync**
  - [x] v0.2.1 — OAuth wiring, env fixes (Fernet key, `API_BASE_URL`), DB fix (`prepare_threshold=None`), FK insert
  - [x] v0.2.2 — `daily_snapshots` Alembic migration, `GET /scores` route (phase-aware), settings page with Connect Whoop button
  - [x] follow-up — Tech stack config cleanup (`fix/v0.2.1/tech-stack-config`)
  - Findings: `docs/v0/v0.2.md`
  - State: 41 `health_score` rows, 45 `event_record` rows for dev user

- [ ] **v0.3 — Populate daily_snapshots** ← ACTIVE
  - [ ] v0.3.1 — Inspect `health_score` + `event_record` models, document field mapping to `daily_snapshots.api_*`
  - [ ] v0.3.2 — Write `snapshot_service.py`: read fork's tables, upsert into `daily_snapshots` with `api_*` populated
  - [ ] v0.3.3 — Add `POST /api/v1/snapshots/backfill` route, trigger for dev user, verify `GET /scores` returns real data
  - [ ] v0.3.4 — Hook Whoop webhooks (`recovery.updated`, `sleep.updated`) to call snapshot service automatically
  - Plan: `docs/v0/v0.3.md` (not yet written — write before coding)

- [ ] **v0.4 — Comparator**
  - [ ] v0.4.1 — Assess `our_*` data path: how does BLE data get from browser into `daily_snapshots.our_*`
  - [ ] v0.4.2 — Implement `comparator/diff.py`: reads `api_*` + `our_*`, writes `delta_*` + `within_threshold`
  - [ ] v0.4.3 — Celery beat task: runs comparator nightly for all users
  - Plan: `docs/v0/v0.4.md` (write before coding)

- [ ] **v0.5 — Hub UI**
  - [ ] v0.5.1 — Hub page + `MetricCard` + `HubGrid`, fetches from `scores.service.ts`
  - [ ] v0.5.2 — Date picker: browse past dates, passes `score_date` to `GET /scores`
  - [ ] v0.5.3 — Empty, loading, and error states
  - Plan: `docs/v0/v0.5.md` (write before coding)

- [ ] **v0.6 — Workout view**
  - [ ] v0.6.1 — Workout list page, fetches from `workouts.service.ts`
  - [ ] v0.6.2 — Workout detail + `DualTraceChart`: BLE R-R HR trace overlaid with Whoop API HR
  - [ ] v0.6.3 — `ConfidenceBadge`: signal quality from `device_traces.confidence`
  - Note: revisit physiological floor (333 ms) for workout mode — see `docs/v0/v0.1-findings.md`
  - Plan: `docs/v0/v0.6.md` (write before coding)

- [ ] **v0.7 — GPS overlay**
  - [ ] v0.7.1 — Collect GPS via Browser Geolocation API during active session, store in `device_traces.raw_gps`
  - [ ] v0.7.2 — Overlay GPS trace (pace/distance) on workout detail chart
  - Plan: `docs/v0/v0.7.md` (write before coding)

- [ ] **v0.8 — Migration system**
  - [ ] v0.8.1 — Streak detection in `comparator/migration.py`: 14 consecutive `within_threshold = true` → set `flagged_for_review`, log to `algo_migration_log`
  - [ ] v0.8.2 — Admin endpoint `POST /api/admin/algo-review`: approve flips `algo_phase`, reject logs event
  - [ ] v0.8.3 — Post-migration divergence watch: 3+ divergences in 7 days → re-flag for admin review
  - Plan: `docs/v0/v0.8.md` (write before coding)

- [ ] **v0.9 — Auth + settings**
  - [ ] v0.9.1 — Supabase Auth magic link login, session middleware, replace `NEXT_PUBLIC_DEV_USER_ID` hardcode
  - [ ] v0.9.2 — Connections UI: connect/disconnect Whoop, show status + last synced
  - [ ] v0.9.3 — Row Level Security on all Supabase tables
  - Plan: `docs/v0/v0.9.md` (write before coding)

---

## v1 — Full MVP

> Plan to be written when v0.9 is complete. See `docs/plan.md` for the MoSCoW feature list.

- [ ] **v1.0 — Production-ready MVP**
  - Garmin BLE support (same pipeline as Whoop)
  - Vercel deployment + Vercel Cron for nightly comparator
  - All error states, edge cases, rate limiting handled
  - Admin dashboard for migration review

---

## Never in scope

- Apple Health integration
- Garmin API (Garmin = BLE only)
- Streaks, coaching, AI assistant, payments
- Route/map filters, data export, delete-all
- User-facing "what we show and why" page
- Any feature not in `docs/plan.md` MoSCoW Must/Should list
