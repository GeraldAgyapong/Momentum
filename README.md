# Momentum — Premium Habit Building & Personal Growth Platform

> *Build habits. Build yourself.*

Momentum is a sophisticated, responsive habit tracking and personal growth web application designed to help individuals build sustainable consistency, understand their behaviour, and improve their daily routines without burnout or guilt.

---

## Architecture Overview

```text
friendly-mendel/
├── backend/            # Django 5 & Django REST Framework REST API
│   ├── apps/           # Modular Django apps (auth, habits, tracking, reflections, analytics)
│   ├── momentum/       # Project settings, WSGI/ASGI, URLs
│   ├── manage.py
│   └── requirements.txt
├── frontend/           # Next.js 14 (App Router), React, TypeScript, Tailwind CSS
│   ├── src/app/        # App router routes & pages
│   ├── src/components/ # Reusable UI, dashboard, tracking, and analytics components
│   └── src/lib/        # API client, auth session, utilities
├── docker-compose.yml  # PostgreSQL 16 container definition
└── README.md
```

---

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide Icons, Recharts.
- **Backend**: Python 3.12, Django 5, Django REST Framework, SimpleJWT (JSON Web Tokens), `drf-spectacular` (OpenAPI/Swagger), `pytest-django`.
- **Database**: PostgreSQL 16 (persisted via Docker).

---

## Quickstart Guide

### 1. Start the Database

Ensure Docker is running, then start the PostgreSQL service:

```bash
docker compose up -d db
```

The database runs on `localhost:5433` (DB: `momentum`, User: `momentum`, Password: `momentum`).

### 2. Set Up the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Backend API will be accessible at: `http://localhost:8000/api/v1/`
API Documentation (Swagger UI): `http://localhost:8000/api/docs/`

### 3. Set Up the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be accessible at: `http://localhost:3000`

---

## Key Design Principles

1. **Consistency over perfection**: Non-punitive tracking; streaks reflect scheduled habit days rather than consecutive calendar days.
2. **Progress over pressure**: Timezone-aware local dates ensure today's habits are never prematurely flagged as missed.
3. **Deterministic Insights**: Weekly summaries and statistics calculated strictly from actual user completion logs.
4. **Bespoke Aesthetics**: Designed with a calm wellness palette (Forest Green `#173B32`, Sage `#DCE9DF`, Ivory `#F6F4EE`, Charcoal `#252824`, Muted Gold `#C5A36B`).
