# ReliefNet System Architecture & Design Document
**Bangladesh Flood Relief Coordination & Gap Detection Platform**

---

## 1. Executive Summary & Purpose

During severe flood disasters in Bangladesh (such as the Feni, Noakhali, Sylhet, and Sunamganj floods), relief operations frequently suffer from structural coordination failures:
- **Aid Duplication**: Multiple NGOs and volunteer groups send aid to the same easily accessible roadside locations.
- **Aid Deserts / Critical Gaps**: Remote unions or cut-off villages receive zero assistance.
- **Unverified Information**: Social media rumors and unconfirmed requests cause misallocation of scarce boats and resources.
- **No Ground-Truth Delivery Tracking**: Dispatching goods does not guarantee arrival to isolated families.

**ReliefNet** is a production-grade, GIS-first emergency coordination platform that closes the operational loop:
$$\text{Affected Community (SMS/Web)} \longrightarrow \text{Local Institution Verification} \longrightarrow \text{Provider Resource Matching} \longrightarrow \text{Dispatch \& Delivery Tracking} \longrightarrow \text{Spatial Gap \& Duplication Detection}$$

---

## 2. Reference Project Analysis & Technology Justification

### 2.1 Inspection of Reference Project (`Crisis Intelligence Platform` / `crisisIQ`)
- **Technology Stack**: Python (Panel / HoloViews / GeoViews / Bokeh / hvPlot / DuckDB / Gemini).
- **Domain**: Macro-level global geopolitical and crisis intelligence (GDELT news, NASA FIRMS fire points, USGS earthquakes, currency FX).
- **Findings & Limitations**:
  - The HoloViz/Panel stack is optimized for Python data science dashboards rather than transactional, high-concurrency multi-role operational systems.
  - HoloViews/GeoViews renders static or semi-interactive tiles on the server, lacking client-side WebGL vector acceleration, smooth multi-level zooming (Division $\to$ District $\to$ Upazila $\to$ Union $\to$ Institution), fast marker clustering, client-side filtering, and responsive drawer UI for field operators.
  - Panel does not support standard REST/JSON APIs, JWT role-based security, background worker webhooks, or native relational GIS spatial indexes.

### 2.2 Chosen Production Architecture for ReliefNet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React + TypeScript + Vite)            │
│  - MapLibre GL JS (WebGL vector tiles & geojson layers)                    │
│  - Tailwind CSS + Lucide Icons + Radix UI Design System                    │
│  - TanStack Query (Server State, Caching, Polling)                          │
│  - React Router v6 (Command Center Navigation)                             │
│  - SMS Simulator & Emergency Action Drawers                                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST / JSON (/api/v1)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            BACKEND (FastAPI + Python 3.11)                  │
│  - Pydantic v2 (Input Validation & Serialization)                           │
│  - Role-Based Access Control (Admin, Operator, Verifier, Provider, Viewer)  │
│  - SMS Webhook Receiver & Deterministic Bangla/English Parser Engine        │
│  - Rule-Based Provider Matcher & Gap Detection Engine                       │
│  - Audit Logger & Operational Event Dispatcher                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ SQLAlchemy 2.0 + GeoAlchemy2
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                      DATABASE (PostgreSQL 16 + PostGIS 3.4)                 │
│  - Real Bangladesh Administrative Boundaries (Div, Dist, Upazila, Union)    │
│  - Real Educational & NGO Institutions with Spatial Indexes (GIST)          │
│  - Transactional Schemas: Reports, Verifications, Assignments, Deliveries  │
│  - Mock Flood Simulation Polygons (Strictly Labeled "SIMULATION")           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Rationale for Frontend GIS Engine: MapLibre GL JS
- **Vector-based WebGL Rendering**: Smooth rendering of thousands of Bangladesh schools, colleges, cyclone shelters, and relief points without browser lag.
- **Client-Side Spatial Filtering & Clustering**: Super-fast bounding-box updates when panning from Bangladesh national view down to Upazilas like Sonagazi.
- **Layer Stacking**: Seamless overlay of administrative boundaries, mock flood polygons, institution pins, and live relief routes.

---

## 3. Core Operational Loop

```
 ┌───────────────────────────────────────────────────────────────┐
 │ 1. NEED SIGNAL                                                │
 │    Community SMS / Web Report (Bangla or English)             │
 │    Deterministic Parsing -> Locality / Households / Need      │
 └──────────────────────────────┬────────────────────────────────┘
                                │
 ┌──────────────────────────────▼────────────────────────────────┐
 │ 2. LOCAL VERIFICATION                                         │
 │    Spatial cluster triggers "Verification Required"           │
 │    Local School / College / NGO contacted                     │
 │    Status: PENDING -> CONTACTED -> VERIFIED                   │
 └──────────────────────────────┬────────────────────────────────┘
                                │
 ┌──────────────────────────────▼────────────────────────────────┐
 │ 3. PROVIDER MATCHING & ASSIGNMENT                             │
 │    Match verified demand with provider capacity & inventory   │
 │    Reserve inventory (Food, Water, Medicine, Boats)           │
 │    Status: ASSIGNED -> PREPARING -> DISPATCHED -> IN_TRANSIT  │
 └──────────────────────────────┬────────────────────────────────┘
                                │
 ┌──────────────────────────────▼────────────────────────────────┐
 │ 4. GROUND DELIVERY CONFIRMATION                               │
 │    Field team confirms received quantities & persons served   │
 │    Status: DELIVERED / PARTIALLY_DELIVERED                    │
 └──────────────────────────────┬────────────────────────────────┘
                                │
 ┌──────────────────────────────▼────────────────────────────────┐
 │ 5. GAP & DUPLICATION DETECTION ENGINE                         │
 │    Spatial query detects unmet needs (Critical Gap)           │
 │    Overdue dispatches (Response Gap)                          │
 │    Excessive aid concentration in one union (Duplication)     │
 └───────────────────────────────────────────────────────────────┘
```

---

## 4. Database Entities & Schema Architecture

| Entity | Purpose | Key Attributes |
| :--- | :--- | :--- |
| `User` | Authentication & RBAC | `email`, `password_hash`, `role` (ADMIN, OPERATOR, VERIFIER, RELIEF_PROVIDER, VIEWER), `organization_id` |
| `AdministrativeArea` | Bangladesh boundary hierarchy | `id`, `name`, `bangla_name`, `level` (DIVISION, DISTRICT, UPAZILA, UNION), `parent_id`, `geojson_boundary`, `center_lat`, `center_lon` |
| `Institution` | Real educational/NGO verification anchors | `name`, `bangla_name`, `type` (SCHOOL, COLLEGE, NGO, CYCLONE_SHELTER), `district`, `upazila`, `union`, `lat`, `lon`, `contact_phone`, `contact_email`, `source` |
| `ReliefProvider` | Relief organizations | `name`, `type` (GOV, INGO, LOCAL_NGO, VOLUNTEER), `contact_person`, `phone`, `email`, `operating_upazilas`, `is_verified` |
| `ReliefResource` | Provider inventory ledger | `provider_id`, `category` (FOOD, WATER, MEDICINE, HYGIENE, SHELTER, BOAT, VOLUNTEER), `available_qty`, `reserved_qty`, `delivered_qty`, `unit` |
| `CommunityReport` | Inbound distress calls/messages | `source` (SMS, WEB, OPERATOR), `sender_phone`, `raw_message`, `division`, `district`, `upazila`, `union`, `lat`, `lon`, `location_confidence`, `need_type`, `severity`, `people_affected`, `households_affected`, `status` |
| `VerificationRecord` | Ground-truth verification logs | `report_id` or `area_id`, `institution_id`, `verifier_user_id`, `reported_condition` (SAFE, PARTIALLY_FLOODED, SEVERELY_FLOODED, EVACUATED, UNCONFIRMED), `notes`, `verified_at` |
| `ReliefAssignment` | Dispatch orders | `provider_id`, `area_id` / `report_id`, `priority` (CRITICAL, HIGH, MEDIUM, LOW), `status` (ASSIGNED, PREPARING, DISPATCHED, IN_TRANSIT, DELIVERED, CANCELLED), `expected_delivery_time`, `allocated_resources` |
| `ReliefDelivery` | Actual delivery records | `assignment_id`, `delivered_at`, `people_served`, `households_served`, `notes`, `status` (DELIVERED, PARTIALLY_DELIVERED) |
| `DeliveryItem` | Specific item breakdown | `delivery_id`, `resource_category`, `quantity_delivered`, `unit` |
| `Communication` | Contact logs | `institution_id` / `provider_id`, `contact_type` (PHONE, EMAIL, SMS, IN_PERSON), `purpose`, `result`, `notes`, `logged_by` |
| `SMSMessage` | SMS pipeline records | `message_sid`, `sender`, `body`, `direction` (INBOUND, OUTBOUND), `parsed_json`, `status` |
| `AuditLog` | Tamper-evident activity trail | `user_id`, `action`, `entity_type`, `entity_id`, `details`, `timestamp` |
| `FloodSimulation` | Mock flood risk polygons | `name`, `severity` (EXTREME, SEVERE, MODERATE), `geojson_polygon`, `simulated_at`, `source_label` ("SIMULATION") |

---

## 5. Security & Multi-Role Access Control

- **JWT Authentication** with bcrypt password hashing and token expiration.
- **Roles**:
  1. `ADMIN`: System configuration, user management, full access.
  2. `OPERATOR`: Triaging SMS, initiating verifications, creating provider assignments, monitoring gaps.
  3. `VERIFIER`: Field and institutional verifiers submitting flood ground-truth reports.
  4. `RELIEF_PROVIDER`: Access provider inventory, accept assignments, update transit and delivery status.
  5. `VIEWER`: Read-only access to GIS map, situational stats, and public overview.

---

## 6. SMS Ingestion & Parsing Strategy

1. **Provider Agnostic**: `SmsProvider` interface with webhook listener and configurable SMS client.
2. **Built-in SMS Simulator**: Enables operators and test runners to simulate realistic incoming Bangla/English messages.
3. **Deterministic Parser**:
   - Location entity matcher against administrative names (English + Bangla aliases: e.g. "সোনাগাজী" $\to$ Sonagazi, "ফেনী" $\to$ Feni).
   - Need category extractor (খাবার/food, পানি/water, ঔষধ/medicine, নৌকা/boat, উদ্ধার/rescue).
   - Quantity/household extractor (e.g. "৫০ পরিবার", "100 people").
   - Confidence scoring: If unambiguous, sets `location_confidence = HIGH`; if ambiguous, flags `REVIEW_REQUIRED`.

---

## 7. Gap & Duplication Intelligence Engine

Calculated dynamically over geographic zones (Upazilas & Unions):
1. **Critical Gap**: $\text{Verified Need} > 0 \land \text{Active Assignments} = 0 \land \text{Delivered} = 0$.
2. **Response Gap**: $\text{Assignment Status} \in \{\text{ASSIGNED}, \text{DISPATCHED}\} \land \text{Now} > \text{ExpectedDeliveryTime}$.
3. **Coverage Gap**: $\text{Delivered Quantity} < 0.3 \times \text{Estimated Need}$.
4. **Verification Gap**: $\text{Report Count} \ge 5 \land \text{Verification Status} = \text{UNVERIFIED}$.
5. **Aid Duplication Alert**: $\sum \text{Allocated Resources} > 1.5 \times \text{Target Need} \land \exists \text{Adjacent Underserved Locality}$.
