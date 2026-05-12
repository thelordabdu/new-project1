# Docker Cheat Sheet

This project uses Docker as an optional backend runtime wrapper. Supabase hosts Postgres externally. Redis and Celery are intentionally not active in `docker-compose.yml` during v0.2.1.

## Current Services

| Service | Purpose | Active now? |
|---|---|---|
| `backend` | FastAPI API server on `localhost:8000` | Yes |
| Supabase Postgres | Remote database configured through `backend/config/.env` | Yes, external |
| Redis | Queue/broker for background jobs | No, deferred |
| Celery worker | Runs queued background jobs | No, deferred |
| Celery beat | Scheduled jobs such as nightly comparator | No, deferred |

## Everyday Commands

### Start the Backend

```bash
docker compose up -d backend
```

What it does:
- Builds the backend image if needed.
- Starts the `backend` container in the background.
- Serves FastAPI at `http://localhost:8000`.
- Uses `backend/config/.env` for environment variables.
- Mounts `./backend` into the container so normal Python code edits reload.

### Watch Backend Logs

```bash
docker compose logs -f backend
```

What it does:
- Streams backend logs.
- Useful after OAuth callbacks, sync calls, migrations, or startup errors.
- Stop watching with `Ctrl+C`; the container keeps running.

### Stop the Backend

```bash
docker compose stop backend
```

What it does:
- Stops the running backend container.
- Keeps the built image and container metadata around for quick restart.

### Restart the Backend

```bash
docker compose restart backend
```

What it does:
- Stops and starts the existing container.
- Good for environment variable changes.
- Does not rebuild dependencies or Dockerfile layers.

### Rebuild the Backend Image

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

What it does:
- Recreates the backend image from scratch.
- Use this after changing `backend/Dockerfile`, `backend/pyproject.toml`, or `backend/uv.lock`.
- Normal Python source edits do not need this because `uvicorn --reload` watches the mounted code.

### Open a Shell in the Backend Container

```bash
docker compose exec backend bash
```

What it does:
- Opens a shell inside the running backend container.
- Useful for inspecting env vars, installed packages, and filesystem paths.

### Run Migrations Through Docker

```bash
docker compose exec backend alembic upgrade head
```

What it does:
- Runs Alembic migrations from inside the backend container.
- Uses the same environment variables as the API.
- Applies migrations to the configured Supabase database.

### Create a Migration Through Docker

```bash
docker compose exec backend alembic revision --autogenerate -m "describe change"
```

What it does:
- Compares SQLAlchemy models against the configured database.
- Creates a new migration file under `backend/migrations/versions`.
- Review generated migrations before applying them.

### Tear Down Containers

```bash
docker compose down
```

What it does:
- Stops and removes containers created by this compose file.
- Does not delete Supabase data because the database is external.

## Local Alternative Without Docker

```bash
cd backend
uv sync
uv run uvicorn app.main:api --host 0.0.0.0 --port 8000 --reload
```

Use this when you want the fastest local Python loop. Docker remains useful for consistent setup and for future deployment parity.

## Deferred Background Jobs

Celery and Redis are not part of the active v0.2.1 runtime. Keep the concept in mind for later:

```text
FastAPI -> queue job -> worker processes sync/comparator work
```

Likely future use cases:
- nightly comparator runs
- provider sync retries
- webhook-triggered snapshot refreshes
- long historical backfills

Until those are required, prefer direct API endpoints and explicit manual commands.
