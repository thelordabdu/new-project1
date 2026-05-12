# multi-wearable-tracker

Web app for comparing wearable data from Whoop and Garmin BLE in one hub. v0 is focused on wiring the full data path: BLE collection, Whoop OAuth sync, daily snapshots, scoring, and the future comparator.

## Current Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.13, SQLAlchemy |
| Database | Supabase Postgres through PgBouncer |
| Migrations | Alembic |
| Runtime | Docker Compose backend service or local `uv` |
| Background jobs | Deferred. Celery/Redis are documented but not active in v0.2.1. |

## Repository Layout

```text
new-project1/
├── AGENTS.md           # Tool-neutral agent instructions
├── README.md           # Developer entrypoint
├── docker-compose.yml  # Backend-only active runtime
├── backend/            # FastAPI backend
├── frontend/           # Next.js frontend
└── docs/               # Product, architecture, roadmap, and version notes
```

## Start Here

For agents and contributors:

1. Read `AGENTS.md`
2. Read `docs/CONTEXT.md`
3. Read `docs/roadmap.md`
4. Read the active version doc under `docs/v0/`

## Local Development

Start the backend with Docker:

```bash
docker compose up -d backend
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Run the backend without Docker:

```bash
cd backend
uv sync
uv run uvicorn app.main:api --host 0.0.0.0 --port 8000 --reload
```

Useful URLs:

| Service | URL |
|---|---|
| Backend API | `http://localhost:8000` |
| Backend docs | `http://localhost:8000/docs` |
| Frontend | `http://localhost:3000` |

Docker command details live in `docs/docker-cheatsheet.md`.

## Environment

Environment examples live with the app that consumes them. The backend reads `backend/config/.env`; start from `backend/config/.env.example`. The frontend reads `frontend/.env.local`.

Never commit real secrets.

## Git Workflow

Branch format:

```text
<type>/v<sub-task>/<short-description>
```

Examples:

```text
fix/v0.2.2/root-cleanup
fix/v0.2.3/backend-architecture
feat/v0.3.2/snapshot-service
```

Open a PR for every branch. Do not push directly to `main`.

## Key Docs

| Doc | Purpose |
|---|---|
| `docs/CONTEXT.md` | Current state and active next work |
| `docs/roadmap.md` | Version checklist |
| `docs/plan.md` | Product plan and scope |
| `docs/tech-plan.md` | Technical architecture |
| `docs/algo-strategy.md` | Comparator and algorithm migration strategy |
| `docs/docker-cheatsheet.md` | Docker commands and runtime notes |

## Current Cleanup Sequence

| Branch | Scope |
|---|---|
| `fix/v0.2.1/tech-stack-config` | Runtime config cleanup |
| `fix/v0.2.2/root-cleanup` | Root docs and repo hygiene |
| `fix/v0.2.3/backend-architecture` | Backend restructure |
| `fix/v0.2.4/frontend-architecture` | Frontend restructure |
