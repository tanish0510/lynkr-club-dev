# Lynkr - Setup and Deploy Guide

## 1) Local Setup (Run App on Your Laptop)

### Prerequisites
- Docker Desktop running
- Node.js 18+ (recommended)
- Python 3.11 or 3.12

### Step A: Start Backend + PostgreSQL
From project root:

```bash
chmod +x run-local.sh
./run-local.sh
```

This starts, in order:
1. **PostgreSQL** (Docker) — published on **`localhost:${POSTGRES_PUBLISH_PORT:-5432}`** (default `5432`)
2. **pgAdmin** (Postgres UI) — **`http://localhost:${PGADMIN_PUBLISH_PORT:-5050}`** (default `5050`); login from `.env`: `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` (see `docker-compose.yml`)
3. **Backend** (uvicorn) on `localhost:8000`

If ports **5432** or **5050** are already in use:

```bash
POSTGRES_PUBLISH_PORT=5433 PGADMIN_PUBLISH_PORT=5051 ./run-local.sh
```

**Note:** Values you pass on the command line (e.g. `PGADMIN_PUBLISH_PORT=5051`) override the same keys in `.env` for that run, so the printed URL matches the port Docker binds.

**pgAdmin “connection refused”:** First start can take **up to ~2 minutes**. Use the URL printed at the end of step `[2/3]` (prefer `http://127.0.0.1:<port>`). If it still fails, run `docker compose ps` and `docker compose logs pgadmin --tail 80`, or `docker compose port pgadmin 80` to see the actual host port.

`./run-local.sh` sets **`DATABASE_URL`** automatically to match the published Postgres port (unless you define `DATABASE_URL` in `.env`). Example override:

```bash
DATABASE_URL=postgresql+asyncpg://lynkr:lynkr@127.0.0.1:5433/lynkr_db
```

`./seed-dev-user.sh` and `./clean-db-keep-admin.sh` honor **`POSTGRES_PUBLISH_PORT`** the same way when `DATABASE_URL` is not set.

### Step B: Seed a dev login (one time per machine / DB)
Signup is off by default (`SIGNUP_DISABLED`), so create a test user:

```bash
chmod +x seed-dev-user.sh
./seed-dev-user.sh
```

This uses the **same `DATABASE_URL` as the backend** (from `.env` or the same defaults as `./run-local.sh`).

**Dev credentials after seed:**

| Field    | Value             |
|----------|-------------------|
| Email    | `dev@lynkr.local` |
| Password | `DevLynkr123!`    |

**Important:** `./seed-dev-user.sh` loads `.env` so it seeds the **same database as the API**. If the URL does not match what uvicorn uses, login will fail.

### Reset DB (keep admin only)
To delete **all** partners, users (except `role: ADMIN`), purchases, coupons, etc. (rows in the JSONB `doc_store` table):

```bash
chmod +x clean-db-keep-admin.sh
./clean-db-keep-admin.sh --yes
```

Interactive confirmation (type `YES`) if you omit `--yes`. Uses the same `DATABASE_URL` rules as `./seed-dev-user.sh`.

### Step C: Start Frontend
Open a second terminal:

```bash
cd frontend
yarn install
yarn dev
```

### Step D: Log in
1. Open **http://localhost:5173/app/login**
2. Enter `dev@lynkr.local` / `DevLynkr123!`
3. You land in the app (onboarding skipped for this user).

---

## 2) Which URL to Open (Local)

- Frontend UI: `http://localhost:5173`
- Backend API base: `http://localhost:8000/api`
- Backend Swagger docs: `http://localhost:8000/api/docs`
- Backend ReDoc: `http://localhost:8000/api/redoc`
- pgAdmin (when compose service is up): `http://localhost:5050` (or your `PGADMIN_PUBLISH_PORT`)

---

## 3) PostgreSQL + pgAdmin Using Docker Compose

`./run-local.sh` already brings up `postgres` and `pgadmin` when possible. You can also start them alone:

```bash
docker compose up -d postgres pgadmin
```

- PostgreSQL: `localhost:${POSTGRES_PUBLISH_PORT:-5432}` (defaults in compose: `lynkr` / `lynkr` / `lynkr_db`)
- pgAdmin: `http://localhost:${PGADMIN_PUBLISH_PORT:-5050}`
- Default login email in compose is `admin@example.com` (avoid `*@*.local` — recent pgAdmin images reject `.local` as invalid).

Stop only these services:

```bash
docker compose stop postgres pgadmin
```

Data is stored in Docker volumes **`postgres_data`** and **`pgadmin_data`** (see `docker-compose.yml`).

---

## 4) Build and Push Images to Docker Hub

Use the provided script:

```bash
chmod +x build-and-push.sh
./build-and-push.sh <dockerhub-username> https://lynkr.club
```

Example:

```bash
./build-and-push.sh tanish0510 https://lynkr.club
```

What this script does:
- logs into Docker Hub
- builds backend image
- builds frontend image
- pushes both images
- uses `linux/amd64` so GCP VM pull works reliably

Pushed tags:
- `<dockerhub-username>/lynkr-backend:latest`
- `<dockerhub-username>/lynkr-frontend:latest`

---

## 5) Pull and Run on VM

On your GCP VM (where `docker-compose.prod.yml` exists):

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## 6) Quick Troubleshooting

### Frontend still calling localhost in production
- Rebuild frontend with correct backend URL:
  - `./build-and-push.sh <dockerhub-username> https://lynkr.club`
- Pull latest image on VM and restart compose.

### Postgres / pgAdmin issues
- Ensure `postgres` is healthy: `docker compose ps`
- Check logs: `docker compose logs postgres`
- pgAdmin: register a server pointing at host `postgres` (from the `backend` container network) or `host.docker.internal` / your LAN IP when connecting from the host.

### OTP email delivery errors in local
- Set debug fallback in `.env`:
  - `SIGNUP_OTP_DEBUG_MODE=1`
