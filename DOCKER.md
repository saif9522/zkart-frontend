# zKart.shop — Docker Deployment

Runs the whole stack — Postgres, Redis, Django backend (Daphne/ASGI, so
WebSocket live-tracking works), a Celery worker, and all 4 frontend apps —
with a single command.

## 1. First-time setup

```bash
# Root-level env (Postgres credentials + which URLs the browsers should call)
cp .env.example .env
nano .env   # set a real DB_PASSWORD at minimum

# Backend env (secret key, Razorpay, SMS, email, Google, etc.)
cp backend/.env.example backend/.env
nano backend/.env
```

In `backend/.env`, at minimum:
- Set `DJANGO_SECRET_KEY` to a real random value (see below)
- Set `DJANGO_SETTINGS_MODULE=mall_of_garhwa.settings.production` — the
  example file defaults to `development` (DEBUG on, open CORS, console
  email) which is right for local work but wrong for a real deploy
- Leave `SECURE_SSL_REDIRECT=False` until you've put a real TLS-terminating
  reverse proxy in front of this — otherwise every request redirect-loops

Generate a secret key:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

## 2. Build and run

```bash
docker compose up -d --build
```

First boot automatically:
- waits for Postgres to be ready
- runs migrations
- collects static files (Django admin, Swagger UI)

## 3. Where things run

| Service | URL |
|---|---|
| Backend API | http://localhost:8000/api/v1/ |
| Swagger docs | http://localhost:8000/swagger/ |
| Customer app | http://localhost:5173 |
| Admin / Super Admin | http://localhost:5174 |
| Vendor Panel | http://localhost:5175 |
| Delivery Partner Panel | http://localhost:5176 |

Put a real reverse proxy (nginx, Caddy, or Cloudflare Tunnel) in front of
these ports for your actual domain + SSL — this compose file exposes plain
HTTP on localhost, it does not terminate TLS itself.

## 4. Create your first Super Admin

```bash
docker compose exec backend python manage.py createsuperuser --phone +91XXXXXXXXXX
```

## 5. Common commands

```bash
docker compose logs -f backend          # tail backend logs
docker compose exec backend python manage.py shell
docker compose exec backend python manage.py seed_demo_data   # sample data, if you want to explore with something already in it
docker compose down                     # stop everything
docker compose down -v                  # stop AND wipe all data (Postgres, Redis, media) — careful
docker compose up -d --build backend    # rebuild+restart just one service after a code change
```

## 6. Updating after a code change

```bash
git pull
docker compose up -d --build
```

Migrations run automatically on backend startup — no separate step needed.

## Notes

- **Media files** (product images, uploads) persist in a named Docker volume
  (`media_data`), not inside the container — safe across rebuilds. Back this
  volume up separately, or switch to S3/R2 (already supported — see
  `backend/mall_of_garhwa/settings/production.py`) for real production use.
- **Celery worker** is a separate container so background jobs (SMS, email,
  notifications) don't compete with web requests for CPU. Scale it independently:
  `docker compose up -d --scale celery_worker=3`.
- This compose file is a solid starting point for a single-VPS deployment.
  For real scale (multiple servers, managed Postgres/Redis, blue-green
  deploys), you'd typically move to Kubernetes or a managed PaaS — the
  Dockerfiles here are the reusable building block either way.
