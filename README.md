# Lynkr - Setup and Deploy Guide

## 1) Local Setup (Run App on Your Laptop)

### Prerequisites
- Docker Desktop running
- Node.js 18+ (recommended)
- Python 3.11 or 3.12

### Step A: Start Backend + MongoDB
From project root:

```bash
chmod +x run-local.sh
./run-local.sh
```

This starts:
- MongoDB on `localhost:27017` (via Docker if needed)
- Backend on `localhost:8000`

### Step B: Start Frontend
Open a second terminal:

```bash
cd frontend
yarn install
yarn dev
```

---

## 2) Which URL to Open (Local)

- Frontend UI: `http://localhost:5173`
- Backend API base: `http://localhost:8000/api`
- Backend Swagger docs: `http://localhost:8000/api/docs`
- Backend ReDoc: `http://localhost:8000/api/redoc`

---

## 3) Start Mongo + Mongo UI Using Docker Compose

If you want MongoDB + Mongo Express UI directly from compose:

```bash
docker compose up -d mongodb mongo-express
```

Mongo URLs:
- MongoDB: `mongodb://localhost:27017`
- Mongo Express UI: `http://localhost:8081`

Mongo Express login (from `.env`):
- Username: `MONGO_EXPRESS_USERNAME` (default `admin`)
- Password: `MONGO_EXPRESS_PASSWORD` (default `admin`)

Stop only these services:

```bash
docker compose stop mongodb mongo-express
```

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

### Mongo Express not opening
- Ensure `mongodb` is healthy first:
  - `docker compose ps`
- Restart mongo-express:
  - `docker compose restart mongo-express`

### OTP email delivery errors in local
- Set debug fallback in `.env`:
  - `SIGNUP_OTP_DEBUG_MODE=1`
