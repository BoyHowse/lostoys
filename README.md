# LosToys

LosToys is a full-stack platform to manage personal or business vehicles, their legal documents, credits, maintenance history, and notification workflows. The stack is **Django 5 + Django REST Framework** on the backend and **Next.js 15 (React 19)** with TailwindCSS on the frontend. The project is structured for a future deployment with Nginx and Gunicorn on DigitalOcean.

## Project structure

```
LosTOYS/
├── backend/          # Django project (config, accounts, cars, alerts)
└── frontend/         # Next.js 15 app (dashboard UI)
```

## Backend setup (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # adjust values or keep defaults (USE_SQLITE=true for local dev)
python manage.py migrate
python manage.py seed_initial_data  # creates demo data + superuser boy/Prestige1$
python manage.py runserver 0.0.0.0:8000
```

Default credentials:

- Superuser: `boy` / `Prestige1$`
- Demo user: `demo` / `demo1234`

### Services & integrations

- PostgreSQL connection is ready via environment variables (psycopg 3 driver). Set `USE_SQLITE=true` for quick local runs.
- Celery app is configured in `config/celery.py` with placeholders for Redis/Twilio/SendGrid credentials.
- Automatic document alert scheduling logic lives in `alerts/services.py` and dispatches through Celery tasks defined in `alerts/tasks.py`.

## Frontend setup (Next.js)

```bash
cd frontend
npm install  # already executed once during scaffolding
cp .env.local .env  # optional, default points to http://localhost:8000
npm run dev -- --port 3000
```

The UI includes:

- Dashboard with traffic-light status for each vehicle
- Upcoming expirations view within 30 days
- Session-based auth (login/register) with cookies included by default
- Alert preferences form tied to backend session endpoint
- Vehicle detail view with tabs for documents, credits, maintenance, notifications, and history
- Language toggle (ES/EN) available in the top navigation

A centralized `fetcher.js` ensures every request uses `credentials: "include"` to leverage Django sessions.

## Deployment notes

- Gunicorn + Nginx ready: add a `Procfile` or systemd unit pointing to `config.wsgi` and reuse Tailwind/Next production build via `npm run build`.
- Configure environment variables for PostgreSQL, Redis (Celery broker/result), and messaging providers (Twilio & SendGrid) before deploying.
- Collect static files with `python manage.py collectstatic` and serve them via Nginx.

## Development tips

- Run `python manage.py check` and `npm run lint` to ensure code quality.
- Use `python manage.py shell` to experiment with alert services: `from alerts.services import schedule_document_alerts`.
- Celery can be started locally with `celery -A config worker --loglevel=info` once Redis is available.
