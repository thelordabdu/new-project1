# CONTEXT.md — Agent Reference

> **Read this first, every session, no exceptions.**
> This is the single source of truth for all agents (Claude, Cursor, etc.) working in this repo.
> Before ending any session where you wrote code, fixed a bug, or learned something new — update the "Where we stopped" section. Keep it current, not historical.

---

## Where we stopped

**Last updated:** 2026-05-12

**Active epic:** v0 — Foundation
**Active version:** v0.3 — Populate daily_snapshots
**Status:** v0.2 complete. v0.3 not started. No blockers. All services running.

**What was just finished (v0.2):**
- Whoop OAuth works end-to-end
- Historical sync (30 days) runs cleanly via Celery worker
- 41 rows in `health_score`, 45 rows in `event_record` for dev user `64278722-3f20-479e-8010-0b9afbb16ba0`
- `daily_snapshots` table exists in DB but is empty — that's v0.3's job
- All worker errors fixed (`prepare_threshold=None`, `after_commit` hook)

**What to do next (v0.3):**
1. Read `docs/v0/v0.3.md` — write it first if it doesn't exist
2. Inspect `health_score` + `event_record` models and document field mapping (v0.3.1)
3. Write `snapshot_service.py` to upsert `daily_snapshots.api_*` from fork's tables (v0.3.2)
4. Add backfill endpoint, trigger for dev user, verify `GET /scores` returns real data (v0.3.3)
5. Hook Whoop webhooks to call snapshot service automatically (v0.3.4)

Full checklist: `docs/roadmap.md`

---

## What this project is

A **web app** (Next.js, later iOS) that is a single hub for wearable metrics from Whoop and Garmin. Users connect devices and see recovery, sleep, HRV, and workout data in one place with device traces overlaid on the same charts.

**The two-layer architecture:**

| Layer | What it does |
|---|---|
| Display | Shows Whoop API metrics to the user (Phase 1). Shows our computed metrics post-migration (Phase 2+). |
| Learning | Runs our algorithms silently on raw BLE data. Compares our output vs Whoop's daily. When we match within 5% for 14 consecutive days → flag for admin review → admin approves → our metrics become primary. |

Whoop's API is training data, not the product. Full strategy: `docs/algo-strategy.md`.

---

## Docs index

| Doc | What it covers |
|---|---|
| `docs/CONTEXT.md` | **This file.** Start here every session. |
| `docs/roadmap.md` | Full version checklist v0→v1. Current status of every sub-task. |
| `docs/brief.md` | Product brief, audience, value prop, success metrics |
| `docs/plan.md` | Full product plan, user flows, MoSCoW feature list |
| `docs/tech-plan.md` | Full technical architecture — read before writing product code |
| `docs/algo-strategy.md` | Algorithm learning pipeline, comparator, migration logic |
| `docs/business.md` | Business analysis and viability |
| `docs/v0/v0.0.md` | v0.0 BLE findings |
| `docs/v0/v0.1.md` | v0.1 signal processing plan |
| `docs/v0/v0.1-findings.md` | v0.1 findings + RMSSD bug fix |
| `docs/v0/v0.2.md` | v0.2 OAuth wiring, bugs fixed, DB state |
| `docs/v0/v0.3.md` | v0.3 plan (write before coding v0.3) |

---

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI (Python), fork of open-wearables |
| Database | PostgreSQL via Supabase, PgBouncer pooler port **6543** |
| Background jobs | Celery + Redis |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Auth (frontend) | Supabase Auth — magic link (wired in v0.9) |
| Auth (backend API) | JWT (developer login) + API key (sync endpoints) |
| Tunneling | ngrok → port 3000 (frontend only, NOT 8000) |

---

## Local dev — start everything

```bash
# Backend + worker + beat
cd new-project1
docker compose up -d

# Frontend
cd frontend && npm run dev

# Backend API:  http://localhost:8000
# Frontend:     http://localhost:3000
# API docs:     http://localhost:8000/docs
```

**After changing `database.py` or any file the worker image bundles — restart is NOT enough:**
```bash
docker compose build --no-cache worker && docker compose up -d worker
```
`docker compose restart worker` does not rebuild the image. Code changes are not picked up.

---

## Auth — getting credentials each session

### Developer JWT (expires in 1 hour — re-fetch every session)
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=kutbiamf@gmail.com&password=admin123"
# → access_token in response
```

### API key (persistent — already exists)
- Header: `X-Open-Wearables-API-Key`
- Value: `sk-e027b7f8172594fb13bd2254347e2a73`

---

## Key IDs

| Thing | Value |
|---|---|
| Dev/test user (Supabase + fork `user` table) | `64278722-3f20-479e-8010-0b9afbb16ba0` |
| Developer account (fork `developer` table) | `66e5f15b-bed1-418a-a3c4-42dc87c807b7` |
| Developer login | `kutbiamf@gmail.com` / `admin123` |

---

## Database — critical gotcha

PgBouncer runs in **transaction mode**. Prepared statements cached per-connection are invalidated between transactions.

**Symptom:** `InvalidSqlStatementName: prepared statement "_pg3_N" does not exist`

**Fix in `backend/app/database.py`:**
```python
connect_args={"prepare_threshold": None}  # None = disabled. 0 ≠ disabled (wrong).
```

`prepare_threshold=0` means "prepare on first use" — it does NOT disable prepared statements. `None` does.

---

## DB table overview

| Table | Purpose |
|---|---|
| `user` | Fork's user table. Needs a row for every Supabase auth user. |
| `developer` | Backend admin accounts (JWT login, API key creation). |
| `api_key` | Persistent API keys for sync endpoints. |
| `user_connection` | OAuth tokens per user per provider (whoop, garmin). |
| `data_source` | Device/provider source per user. Bridge between user and event_record. |
| `health_score` | Per-user health metrics (recovery, HRV, sleep score, etc.) from Whoop API. |
| `event_record` | Activity records (sleep sessions, workouts). Linked via `data_source_id` — NOT directly via `user_id`. |
| `event_record_detail` | Detailed data per event_record (e.g. HR timeseries). |
| `daily_snapshots` | Our table. One row per user per day. `api_*`, `our_*`, `delta_*` columns. Currently empty. |

**Query event_record for a user** (no direct `user_id` — must join):
```sql
SELECT COUNT(*) FROM event_record er
JOIN data_source ds ON ds.id = er.data_source_id
WHERE ds.user_id = '64278722-3f20-479e-8010-0b9afbb16ba0';
```

**Check daily_snapshots:**
```sql
SELECT date, api_recovery_score, api_hrv_rmssd, api_sleep_score
FROM daily_snapshots
WHERE user_id = '64278722-3f20-479e-8010-0b9afbb16ba0'
ORDER BY date DESC LIMIT 10;
```

---

## daily_snapshots schema

```
id                     uuid
user_id                uuid
date                   date
api_recovery_score     float   ← populated in v0.3
api_hrv_rmssd          float   ← populated in v0.3
api_resting_hr         float   ← populated in v0.3
api_strain             float   ← populated in v0.3
api_sleep_score        float   ← populated in v0.3
api_sleep_duration_hrs float   ← populated in v0.3
our_recovery_score     float   ← NULL until v0.4
our_hrv_rmssd          float   ← NULL until v0.4
our_resting_hr         float   ← NULL until v0.4
our_strain             float   ← NULL until v0.4
our_sleep_score        float   ← NULL until v0.4
delta_recovery         float   ← NULL until v0.4
delta_hrv              float   ← NULL until v0.4
delta_strain           float   ← NULL until v0.4
delta_sleep            float   ← NULL until v0.4
within_threshold       boolean ← NULL until v0.4
our_algo_version       text
flagged_for_review     boolean
raw_whoop_recovery     jsonb
raw_whoop_sleep        jsonb
raw_whoop_workout      jsonb
created_at             timestamptz
updated_at             timestamptz
```

Unique constraint: `(user_id, date)` — one row per user per day, upsert on conflict.

---

## Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| `InvalidSqlStatementName: prepared statement "_pg3_N"` | PgBouncer transaction mode | `prepare_threshold=None` in `database.py`. Rebuild worker. |
| `FernetDecryptorField` validation error on startup | `MASTER_KEY` wrong length/format | Must be 44-char base64 ending in `=`. Regenerate with `Fernet.generate_key()`. |
| Worker not picking up code changes | `restart` doesn't rebuild image | `docker compose build --no-cache worker && docker compose up -d worker` |
| `redirect_uri does not match` on Whoop OAuth | `API_BASE_URL` wrong or missing | Set to ngrok URL in `backend/config/.env`. Restart backend. |
| `foreign key violation` on OAuth callback | No row in `user` table for this auth user | `INSERT INTO "user" (id) VALUES ('<uuid>');` |
| `InvalidRequestError` in `after_commit` hook | ORM lazy-load after session commit | Extract scalars before registering listener (fixed in `event_record_service.py`). |

---

## ngrok setup

ngrok tunnels **port 3000 (frontend only)**. Backend (8000) is not tunneled.

Whoop OAuth callback registered at:
`https://polygraph-could-liqueur.ngrok-free.dev/api/v1/oauth/whoop/callback`

This hits Next.js → proxied to backend via `frontend/app/api/v1/oauth/whoop/callback/route.ts`.

If the ngrok URL changes (free tier restart), update:
1. Whoop developer app → redirect URLs
2. `API_BASE_URL` in `backend/config/.env`
3. `allowedDevOrigins` in `frontend/next.config.ts`

---

## Whoop sync — how to trigger manually

```bash
# 1. Get JWT (expires in 1 hour)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=kutbiamf@gmail.com&password=admin123"

# 2. Trigger 30-day historical sync
curl -X POST "http://localhost:8000/api/v1/providers/whoop/users/64278722-3f20-479e-8010-0b9afbb16ba0/sync/historical?days=30" \
  -H "X-Open-Wearables-API-Key: sk-e027b7f8172594fb13bd2254347e2a73"
```

---

## Code rules (non-negotiable)

**Backend:**
- Route handlers call services. Services call repositories. Never skip layers.
- Store raw API responses always (`raw_whoop_*` jsonb columns). Derive metrics at read time.
- Never blend metrics from two providers into one number.
- `algorithms/` files are pure functions — input raw data, output a number. No DB calls inside.
- After any backend change: lint with `uv run ruff check . --fix && uv run ruff format .`

**Frontend:**
- Never call `fetch()` directly in a component or page. Always go through a `services/` file.
- Service files return typed objects. No `any`. No raw `Response` objects passed to components.
- Components in `components/` are never async. Data fetching happens in pages or server components.
- `app/api/` routes are thin proxies — no business logic, no DB calls.

**algo_phase rule:**
- Every user has `algo_phase`: `'whoop_primary'` or `'our_primary'`
- `GET /scores` returns `api_*` fields when `whoop_primary`, `our_*` when `our_primary`
- Frontend never receives both sets simultaneously
- Frontend never knows which phase it's in — it just renders what the backend returns
- Only `POST /api/admin/algo-review` can change `algo_phase`
