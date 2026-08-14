# ReliefNet Deployment & Infrastructure Guide

## 1. Docker Compose Production Deployment

ReliefNet provides a complete, containerized environment with:
- **PostgreSQL 16 + PostGIS 3.4**: Geospatial database for administrative boundaries and spatial clustering.
- **FastAPI Backend (Python 3.11)**: REST API, deterministic NLP engine, and gap detection service.
- **React Frontend (Nginx)**: MapLibre GL JS mapping client and incident management UI.

### Step 1: Clone and Configure Environment
```bash
cp .env.example .env
```

### Step 2: Build & Start All Services
```bash
docker-compose up --build -d
```

### Step 3: Run Database Migrations & Initial Seed
```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed_demo_data.py
```

### Service Access:
- **Web UI**: `http://localhost:3000` (or `http://localhost:80`)
- **Backend API & Swagger Docs**: `http://localhost:8000/api/v1/docs`
- **PostGIS Database**: `localhost:5432`

---

## 2. Local Development Setup (Without Docker)

### Backend (Python)
```bash
# 1. Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate   # Windows
# or: source .venv/bin/activate # Linux/macOS

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Seed demonstration scenario
python scripts/seed_demo_data.py

# 4. Start backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Node.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 3. Automated Pytest Verification Suite

ReliefNet includes a complete automated test suite validating authentication, RBAC, Bangla NLP parsing, geospatial querying, and the end-to-end operational coordination loop:

```bash
.\.venv\Scripts\pytest.exe backend/tests/ -v
```
Output:
```
backend/tests/test_auth.py::test_health_check PASSED
backend/tests/test_auth.py::test_user_registration_and_login PASSED
backend/tests/test_geo_institutions.py::test_geo_boundaries_and_search PASSED
backend/tests/test_geo_institutions.py::test_institutions_retrieval_and_contact_log PASSED
backend/tests/test_operational_loop.py::test_full_operational_loop PASSED
backend/tests/test_sms.py::test_bangla_sms_deterministic_parser PASSED
backend/tests/test_sms.py::test_sms_simulator_endpoint PASSED

======================== 7 passed in 4.35s =========================
```
