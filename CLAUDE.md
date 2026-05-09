# multi-wearable-tracker — Agent context

> Read this before touching any code. This is the authoritative reference for all agents (Claude, Cursor, etc.) working in this repo.

---

## What this project is

A web app (and later iOS app) that acts as a single hub for wearable metrics from Whoop and Garmin. Users connect their devices, see recovery, sleep, HRV, and workout data in one place, with both device traces overlaid on the same charts.

**The core technical approach:**
1. Show Whoop API data to users (Phase 1 — now)
2. Run our own metric algorithms silently on raw BLE data in parallel
3. Compare our output vs Whoop's daily — when we match within 5% for 14 consecutive days, flag for admin review
4. On approval, our metrics become primary. Whoop data stays hidden in DB for ongoing validation.

Full product spec: `docs/brief.md`, `docs/plan.md`  
Full tech spec: `docs/tech-plan.md`  
Algorithm strategy: `docs/algo-strategy.md`  
v0 plan: `docs/v0/`

---

## Repo structure

```
new-project1/
├── backend/          ← Fork of open-wearables (FastAPI + Python)
├── frontend/         ← Next.js 14 app (TypeScript)
├── docs/             ← All planning docs — read before coding
├── docker-compose.yml
└── .env.example
```

---

## Backend (`backend/`)

**Stack:** FastAPI, Python, PostgreSQL, Redis, Celery  
**Base:** Fork of [open-wearables](https://github.com/the-momentum/open-wearables). Their code is the foundation — don't rewrite what already works.

```
backend/app/
├── api/              ← Route handlers only. No business logic here.
├── services/
│   └── providers/
│       ├── whoop/    ← Whoop OAuth, webhooks, data sync (from fork)
│       └── garmin/   ← Garmin OAuth, data sync (from fork)
├── algorithms/       ← Metric algorithms. open-wearables' HRV + sleep code lives here.
│   │                   We extend this as we build our own versions. No DB calls inside.
│   ├── resilience.py ← RMSSD, SDNN, HRV coefficient of variation
│   ├── sleep.py      ← 4-pillar sleep score (duration, stages, consistency, interruptions)
│   └── scoring_primitives.py ← shared sigmoid + scoring utils
├── comparator/       ← Our addition. Diff our algo output vs Whoop API output.
│   ├── diff.py       ← Nightly comparison logic (THRESHOLD_PCT=5%, weighted metrics)
│   └── migration.py  ← 14-day streak detection + migration flag logic
├── tasks/            ← Celery background tasks (from fork + our additions)
├── models/           ← SQLAlchemy models
└── core/             ← Config, DB connection, security utils
```

### Algorithm layer (`algorithms/`)

open-wearables wrote their own independent HRV and sleep algorithms — these are NOT Whoop's proprietary code. They are open-source implementations using the same raw inputs (R-R intervals, accelerometer, HR) that Whoop uses.

**Our strategy:**
- Phase 1: Show users Whoop API scores directly.
- Background: Run `algorithms/` on raw BLE data, store output in `our_*` columns.
- Nightly: `comparator/diff.py` diffs `our_*` vs `api_*` (Whoop's output).
- When we match within 5% for 14 consecutive days → flag for admin review → migrate.

Do NOT add new algorithm files to `algorithms/` until you have a specific metric to implement and real BLE data to test against.

### Backend rules
- Route handlers call services. Services call models. Never skip layers.
- Store raw API responses always. Derive metrics at read time.
- Never blend metrics from two providers into one number.
- `algorithms/` files are pure functions — input raw data, output a number. No DB calls inside.
- `comparator/diff.py` reads `api_*` and `our_*` columns, writes `delta_*` and `within_threshold`.

---

## Frontend (`frontend/`)

**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase Auth  
**Pattern:** Service files for all API calls. Components are dumb — they receive props and render. Pages fetch via services.

```
frontend/
├── app/
│   ├── (auth)/login/         ← Magic link login page
│   └── (app)/                ← Authenticated shell
│       ├── page.tsx           ← Hub — daily metrics
│       ├── workouts/          ← Workout list + detail
│       ├── settings/          ← Connections management
│       └── test-ble/          ← BLE test page (dev only)
│   └── api/                  ← Thin Next.js API routes (proxy to backend)
│       ├── connect/           ← OAuth initiation
│       ├── webhooks/          ← Whoop webhook relay
│       └── admin/             ← Migration approval
├── components/
│   ├── hub/                  ← MetricCard, HubGrid
│   ├── workout/              ← DualTraceChart, WorkoutCard, ConfidenceBadge
│   └── ui/                   ← Button, Card, shared primitives
├── services/                 ← All backend API calls live here
│   ├── workouts.service.ts   ← fetchWorkouts(), fetchWorkout(id)
│   ├── scores.service.ts     ← fetchDailyScores(), fetchHubMetrics()
│   ├── connections.service.ts ← connectWhoop(), disconnectProvider()
│   └── user.service.ts       ← fetchProfile(), updateMetricPrefs()
├── lib/
│   ├── ble/                  ← BLE connection + device-specific parsers
│   │   ├── connect.ts        ← Web Bluetooth API wrapper
│   │   ├── whoop-ble.ts      ← Whoop GATT parsing
│   │   └── garmin-ble.ts     ← Garmin HR profile parsing
│   ├── signal/               ← Signal processing (runs in browser)
│   │   ├── filter.ts         ← Artifact removal
│   │   └── metrics.ts        ← RMSSD, respiratory rate, zones
│   └── api-client.ts         ← Typed fetch wrapper for backend calls
└── types/
    └── index.ts              ← Shared TypeScript types
```

### Frontend rules
- **Never call `fetch()` directly in a component or page.** Always go through a `services/` file.
- Service files return typed objects. No `any`. No raw Response objects passed to components.
- `lib/ble/` and `lib/signal/` are pure — no React, no Next.js imports. Just browser APIs + math.
- Components in `components/` are never async. Data fetching happens in pages or server components.
- `app/api/` routes are thin proxies to the backend — no business logic, no DB calls.
- The hub page reads from `scores.service.ts` which calls backend `GET /scores`. Backend decides which source to return based on `algo_phase`. Frontend never knows which source it's getting.

---

## The algo_phase rule (critical)

Every user has an `algo_phase` in their profile: `'whoop_primary'` or `'our_primary'`.

- Backend `GET /scores` returns `api_*` fields when `whoop_primary`, `our_*` fields when `our_primary`.
- Frontend never receives both sets simultaneously.
- Frontend never knows which phase it's in — it just displays whatever the backend returns.
- Only the admin `POST /api/admin/algo-review` endpoint can change `algo_phase`.

---

## Local dev setup

```bash
# 1. Start backend + dependencies
docker compose up -d

# 2. Start frontend
cd frontend && npm install && npm run dev

# Backend API: http://localhost:8000
# Frontend:    http://localhost:3000
# Backend docs: http://localhost:8000/docs
```

---

## Environment variables

Root `.env.example` has all required variables. Copy to `.env` before running.  
Frontend reads from `frontend/.env.local`.  
Backend reads from `backend/config/.env`.

---

## What NOT to build (ever)
- Apple Health integration (v1 scope: Whoop + Garmin only)
- Streaks, coaching, AI assistant, payments
- Route/map filters
- Data export or delete-all
- User-facing "what we show and why" page
- Any feature not in `docs/plan.md` MoSCoW Must/Should list
