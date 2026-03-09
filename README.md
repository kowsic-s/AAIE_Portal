# AAIE — Academic AI Intervention Engine

A full-stack web application that uses machine learning to predict student academic risk and drive targeted interventions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, TanStack Query v5, Zustand, Recharts, Framer Motion, Tailwind CSS |
| Backend | FastAPI 0.111, SQLAlchemy 2.0 async, Pydantic v2, python-jose, passlib/argon2, slowapi |
| ML | scikit-learn (RandomForest + DecisionTree), RobustScaler, joblib |
| Database | MySQL 8.0, Alembic migrations |
| AI | Google Gemini 1.5 Flash |
| Infrastructure | Docker Compose, nginx |

---

## Quick Start (Docker)

### Prerequisites
- Docker Desktop 4.x+
- A Google Gemini API key (optional — fallback recommendations are used if absent)

### 1. Clone and configure

```bash
git clone <repo-url>
cd aaie
cp backend/.env.example backend/.env   # Edit to set GEMINI_API_KEY and SECRET_KEY
```

### 2. Start all services

```bash
cd infra
docker compose up --build -d
```

This starts:
- **MySQL** on port 3306
- **FastAPI backend** on port 8000
- **React frontend** (via nginx) on port 3000

### 3. Run migrations and seed data

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python seed.py
```

### 4. Open the app

Navigate to **http://localhost:3000**

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@aaie.edu | Admin@123 |
| Staff | staff1@aaie.edu | Staff@123 |
| Staff | staff2@aaie.edu | Staff@123 |
| Student | (see seed output) | Student@123 |

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt

# Start a local MySQL instance, then:
n
python seed.py
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # Runs on http://localhost:5173
```

---

## Project Structure

```
aaie/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app
│   │   ├── config.py          # Pydantic settings
│   │   ├── database.py        # Async SQLAlchemy engine
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic v2 schemas
│   │   ├── routers/           # auth / admin / staff / student / ml
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # RBAC, audit log
│   │   └── ml/
│   │       ├── engine.py      # ML engine (train, predict, registry)
│   │       └── models/        # Saved .joblib bundles + registry.json
│   ├── alembic/               # DB migrations
│   ├── seed.py                # Demo data seeding
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/         # Dashboard, Users, Departments, Settings, ModelGovernance
│   │   │   ├── staff/         # Dashboard, Students, StudentDetail, Interventions, Upload
│   │   │   └── student/       # Dashboard, Performance, WhatIf, Recommendations
│   │   ├── components/        # Shared UI components + charts
│   │   ├── hooks/             # TanStack Query hooks
│   │   ├── api/               # Axios API modules
│   │   ├── store/             # Zustand auth store
│   │   └── utils/             # Formatters, risk colours
│   └── Dockerfile
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx/nginx.conf
└── tests/
    └── backend/
        ├── test_auth.py
        ├── test_predictions.py
        └── test_rbac.py
```

---

## Running Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx aiosqlite
pytest ../tests/ -v
```

---

## ML Engine

The engine (`backend/app/ml/engine.py`) implements:

1. **ModelRegistry** — JSON-backed version registry at `app/ml/models/registry.json`
2. **ModelManager** — hot-reload of model bundles, in-memory cache
3. **ModelTrainer** — trains RandomForest + DecisionTree with 5-fold StratifiedKFold, selects winner by macro-recall, saves versioned `.joblib` bundle
4. **RiskPredictor** — per-student prediction with probability breakdown, top-factor explanation, and what-if simulation
5. **AcademicInsightEngine** — singleton façade used by all routers and services

Features used: `attendance_pct`, `gpa`, `reward_points`, `activity_points`  
Labels: `Low`, `Medium`, `High`

---

## Role Permissions

| Endpoint group | Admin | Staff | Student |
|---|---|---|---|
| `/admin/*` | ✅ | ❌ | ❌ |
| `/staff/*` | ❌ | ✅ | ❌ |
| `/student/*` | ❌ | ❌ | ✅ |
| `/ml/train` | ✅ | ❌ | ❌ |
| `/ml/predict` | ✅ | ✅ | ❌ |
| `/auth/*` | ✅ | ✅ | ✅ |
| `/health`, `/ml/health` | public | public | public |

---

## Production Deployment

```bash
cd infra
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Set these environment variables before deploying:

```
SECRET_KEY=<64-char random string>
MYSQL_ROOT_PASSWORD=<strong password>
MYSQL_PASSWORD=<strong password>
GEMINI_API_KEY=<your key>
CORS_ORIGINS=https://yourdomain.com
```
