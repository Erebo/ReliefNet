# ReliefNet (ত্রাণনেট) 🇧🇩
### Bangladesh Flood Relief Coordination & Automated Gap Detection Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4-336791.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://postgis.net)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-4.7-blue.svg?style=flat)](https://maplibre.org)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg?style=flat)](backend/tests/)

ReliefNet is a production-oriented, full-stack humanitarian GIS and relief coordination platform built specifically for flood disasters in Bangladesh (such as the 2024 Eastern Basin Floods in Feni, Noakhali, and Comilla).

It solves the critical humanitarian coordination problem: **preventing relief duplication in easily accessible areas while unserved flood pockets remain cut off from aid.**

---

## 🎯 Key Operational Capabilities

1. **Deterministic Bangla & English SMS Parser**:
   - Ingests inbound SMS distress messages (`POST /api/v1/sms/webhook`) or from the built-in simulator.
   - Extracts numbers in both English (`0-9`) and Bangla (`০-৯`).
   - Identifies upazila/district locations and classifies emergency need categories (Food, Clean Drinking Water, Medicine, Rescue Boats).
2. **Ground-Truth Verification Workflow**:
   - Aggregates unverified community reports into **Area Need Signals**.
   - Links distress clusters to real Bangladesh anchor institutions (schools, colleges, cyclone shelters) with contact logging for headmasters and local authorities.
3. **Relief Provider Network & Inventory Ledger**:
   - Tracks humanitarian NGOs, government civil defense, and volunteer fleets.
   - Maintains a live inventory ledger with `Available`, `Reserved`, and `Delivered` stock balances to prevent phantom allocations.
4. **Relief Operations & Ground Delivery Tracking**:
   - Full lifecycle management: `ASSIGNED` $\to$ `DISPATCHED` $\to$ `IN_TRANSIT` $\to$ `DELIVERED`.
   - Records ground-truth delivery proofs (households served, head of family counts, distribution location, photo/verification notes).
5. **Automated Spatial Gap & Duplication Engine**:
   - Continuously computes rule-based gap alerts:
     - `CRITICAL GAP`: Verified flood zone with 0 relief assignments.
     - `RESPONSE GAP`: Relief assigned but dispatch/delivery is overdue.
     - `COVERAGE GAP`: High affected population vs small quantity delivered.
     - `VERIFICATION GAP`: Distress report cluster lacking local ground checks.
     - `AID DUPLICATION`: Multiple relief teams dispatching overlapping cargo to the same sector while adjacent unions starve.
6. **Interactive WebGL Mapping Client (MapLibre GL JS)**:
   - High-performance vector/raster GIS rendering with real Bangladesh boundaries.
   - Interactive GeoJSON flood simulation polygon overlays (`SIMULATION`).
   - Institution markers with capacity and distress report heat indicators.

---

## 🏛️ System Architecture & Data Flow

```
                     +---------------------------------------+
                     | Inbound Distress Reports (SMS / Web)  |
                     +-------------------+-------------------+
                                         |
                                         v
                     +---------------------------------------+
                     | Deterministic Bangla/English Extractor|
                     +-------------------+-------------------+
                                         |
                                         v
                     +---------------------------------------+
                     | Community Report (Status: UNVERIFIED) |
                     +-------------------+-------------------+
                                         |
                                         v
                     +---------------------------------------+
                     | Area Need Signals Aggregation         |
                     | (Linked to Schools, Shelters, NGOs)   |
                     +-------------------+-------------------+
                                         |
                         [Field Verification Check]
                                         |
                                         v
                     +---------------------------------------+
                     | Verified Need Sector (VERIFIED)       |
                     +-------------------+-------------------+
                                         |
                     +-------------------+-------------------+
                     | Provider Resource Inventory Ledger    |
                     | (Reserves Food, Water, Med Kits)      |
                     +-------------------+-------------------+
                                         |
                                         v
                     +---------------------------------------+
                     | Convoy Dispatch & Transit Progression |
                     | (ASSIGNED -> DISPATCHED -> IN_TRANSIT)|
                     +-------------------+-------------------+
                                         |
                                         v
                     +---------------------------------------+
                     | Confirmed Ground-Truth Delivery       |
                     | (Updates Ledger & Resolves Reports)   |
                     +---------------------------------------+
```

---

## 🚀 Quick Start Guide

### Option 1: Run with Docker Compose (Recommended)
```bash
# 1. Start all containers (PostGIS, Backend, Frontend)
docker-compose up --build -d

# 2. Seed the initial emergency scenario
docker-compose exec backend python scripts/seed_demo_data.py
```
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

### Option 2: Run Locally for Development

#### 1. Backend Setup
```bash
# Activate virtual environment
.\.venv\Scripts\activate   # Windows
# or: source .venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r backend/requirements.txt

# Populate demo scenario into SQLite database
python scripts/seed_demo_data.py

# Start FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Demonstration Accounts

The login page at `/login` provides one-click quick-login buttons for each operational role:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **HQ Emergency Operator** | `operator@reliefnet.bd` | `operator123` | Full triage, create assignments, gap management |
| **Field Verifier** | `verifier@reliefnet.bd` | `verifier123` | Ground-truth verification, contact logging |
| **Relief Provider (BDRCS)**| `provider@reliefnet.bd`| `provider123` | Inventory ledger, dispatch updates, deliveries |
| **System Administrator** | `admin@reliefnet.bd` | `admin123` | Full administrative access & audit log review |
| **Public Observer** | `viewer@reliefnet.bd` | `viewer123` | Read-only situational GIS awareness |

---

## 🗺️ Real vs Mock Data Lineage

To ensure operational accuracy and integrity:
- **Administrative Boundaries (REAL)**: 8 Divisions, 64 Districts, and Upazilas sourced from Bangladesh Bureau of Statistics (BBS) and UN OCHA Humanitarian Data Exchange (HDX).
- **Institutions (REAL)**: Verified educational institutions, high schools, colleges, and cyclone shelters in Feni district with accurate coordinates from OpenStreetMap and BANBEIS.
- **Flood Simulation (SIMULATION)**: Clearly tagged synthetic polygon overlay (`source_label="SIMULATION"`) modeling the Muhuri & Feni river basin inundation.
- **Relief Providers (DEMO DATA)**: Clearly tagged demonstration NGOs (BDRCS Feni Unit, As-Sunnah Foundation, BRAC) with simulated supply ledgers.

---

## 🧪 Automated Pytest Verification

ReliefNet contains a full automated backend test suite:
```bash
.\.venv\Scripts\pytest.exe backend/tests/ -v
```

All 7 integration tests validate:
1. `test_health_check`: Root service health check.
2. `test_user_registration_and_login`: JWT auth, password security, and RBAC.
3. `test_geo_boundaries_and_search`: Bangladesh administrative divisions, districts, and live search.
4. `test_institutions_retrieval_and_contact_log`: Real school/college anchor retrieval and communication logging.
5. `test_bangla_sms_deterministic_parser`: Bangla digits (`০-৯`), location matching, and need extraction.
6. `test_sms_simulator_endpoint`: Inbound SMS webhook simulator and auto report creation.
7. `test_full_operational_loop`: Complete end-to-end humanitarian disaster coordination loop.

---

## 📂 Repository Structure

```
ReliefNet/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # 14 REST API routers
│   │   ├── core/            # Config, Database, Security & JWT
│   │   ├── geo/             # Boundary and spatial seed loader
│   │   ├── models/          # SQLAlchemy ORM models (12 models + enums)
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── services/        # Automated Gap Engine & Audit Service
│   │   ├── sms/             # Deterministic Bangla/English NLP Parser & Gateway
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest automated test suite
│   ├── Dockerfile           # Backend container
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client
│   │   ├── components/      # UI, Modals, Navbar, Sidebar
│   │   ├── context/         # AuthContext
│   │   ├── features/map/    # MapLibre GL WebGL Map Component
│   │   ├── pages/           # 11 Full Operational Feature Pages
│   │   └── types/           # TypeScript domain definitions
│   ├── Dockerfile           # Frontend Nginx container
│   └── package.json
├── data/
│   ├── boundaries/          # Bangladesh Administrative GeoJSON/JSON
│   ├── institutions/        # Real schools & cyclone shelter coordinates
│   └── flood/               # Mock flood simulation polygons
├── docs/
│   ├── architecture.md      # Full architecture specification
│   ├── data-sources.md      # Data lineage & licensing documentation
│   ├── sms-integration.md   # Deterministic NLP parser specification
│   └── deployment.md        # Deployment and Docker instructions
├── scripts/
│   └── seed_demo_data.py    # Sonagazi/Feni crisis scenario seeder
├── docker-compose.yml       # Production multi-container orchestration
└── README.md
```

---

## 📄 License
This project is licensed under the MIT License — see the LICENSE file for details. Administrative boundaries and open datasets are attributed under Creative Commons CC BY 4.0.
