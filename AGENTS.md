# multi-wearable-tracker — Agent Instructions

> **Start here.** Then immediately read `docs/CONTEXT.md` — it is the single source of truth for current status, what to build next, credentials, DB gotchas, and code rules.
> This file is the shared entrypoint for all coding agents, including Claude, Codex, Cursor, and any future agent. It covers repo structure and git workflow only. Everything else is in `docs/CONTEXT.md`.

---

## Mandatory reading order (every session)

1. `docs/CONTEXT.md` — current status, active version, what to do next, credentials, rules
2. `docs/roadmap.md` — full version checklist, find the active sub-task
3. `docs/v0/v0.X.md` — plan for the specific version you're working on (write it first if it doesn't exist)

This is the only agent instruction file in the repo. Keep it tool-neutral and update it when agent workflow rules change.

---

## Repo structure

```
new-project1/
├── backend/              ← Fork of open-wearables (FastAPI + Python)
│   └── app/
│       ├── api/          ← Route handlers only. No business logic.
│       ├── services/     ← Business logic. Calls repositories.
│       │   └── providers/
│       │       ├── whoop/    ← Whoop OAuth, webhooks, data sync
│       │       └── garmin/   ← Garmin OAuth, data sync
│       ├── algorithms/   ← Pure functions. No DB calls. Input raw data, output a number.
│       ├── comparator/   ← diff.py (nightly diff), migration.py (streak detection)
│       ├── tasks/        ← Deferred background task modules
│       ├── models/       ← SQLAlchemy models
│       └── repositories/ ← Data access layer
├── frontend/             ← Next.js 14 App Router (TypeScript)
│   ├── app/
│   │   ├── (auth)/       ← Login page
│   │   ├── (app)/        ← Authenticated shell (hub, workouts, settings, test-ble)
│   │   └── api/          ← Thin proxy routes only. No business logic.
│   ├── components/       ← Dumb components. No async. Receive props, render.
│   ├── services/         ← All backend API calls live here. Typed return values, no any.
│   ├── lib/
│   │   ├── ble/          ← Web Bluetooth wrappers. Pure — no React imports.
│   │   └── signal/       ← Signal processing. Pure — no React imports.
│   └── types/
├── docs/
│   ├── CONTEXT.md        ← Single source of truth for agents
│   ├── roadmap.md        ← Full version checklist v0→v1
│   ├── brief.md
│   ├── plan.md
│   ├── tech-plan.md
│   ├── algo-strategy.md
│   └── v0/               ← One findings/plan doc per version
└── docker-compose.yml
```

Current v0.2.1 runtime: Docker Compose starts only the backend API. Supabase Postgres is external. Celery/Redis are deferred until background jobs are needed.

---

## Git workflow

**Branch naming:** `<type>/v<sub-task>/<short-description>`

```
feat/v0.3.2/snapshot-service
fix/v0.3.1/health-score-mapping
chore/v0.3.4/webhook-trigger
```

- One branch per sub-task (e.g. v0.3.2, not v0.3)
- Always open a PR — never push directly to `main`
- Abdullah approves all PRs
- Do not build a higher version's features on a lower version's branch

---

## What NOT to build (ever)

- Apple Health integration
- Garmin API (Garmin = BLE only in v1)
- Streaks, coaching, AI assistant, payments
- Route/map filters, data export, delete-all
- User-facing "what we show and why" page
- Anything not in `docs/plan.md` MoSCoW Must/Should list
