# ReliefNet Data Sources & Geospatial Lineage

This document establishes the origin, attribution, licensing, and schema guarantees for all geospatial and tabular data utilized in ReliefNet.

---

## 1. Administrative Boundaries (Real Data)

| Level | Granularity | Source | License | Integration Method |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1** | Divisions (8) | Bangladesh Bureau of Statistics (BBS) / UN OCHA HDX | Creative Commons Attribution (CC BY 4.0) | GeoJSON polygons with centroids & bounding boxes |
| **Level 2** | Districts (64) | BBS / UN OCHA HDX | CC BY 4.0 | GeoJSON boundaries & PostGIS geometries |
| **Level 3** | Upazilas (~495) | BBS / HDX Bangladesh Admin Boundaries (COD-AB) | CC BY 4.0 | Normalized GeoJSON with English & Bangla names |
| **Level 4** | Unions (Focus Areas) | BBS / Local Government Engineering Department (LGED) / HDX | CC BY 4.0 | Target flood zones (e.g. Sonagazi, Feni Sadar, Parshuram, etc.) |

---

## 2. Institutional Anchors (Real Data)

| Category | Coverage | Source | Attributes Retained |
| :--- | :--- | :--- | :--- |
| **Schools & High Schools** | Bangladesh / Feni Focus | OpenStreetMap (OSM) contributors / BANBEIS Educational Directory | Name, Bangla Name, Upazila, District, Latitude, Longitude, Contact Info where available |
| **Colleges & Universities** | National & District Focus | National University Directory & OpenStreetMap | College Name, Bangla Name, Address, Coordinates, Verification Status |
| **NGOs & Cyclone Shelters** | Coastal & Flood Belts | Bangladesh Red Crescent Society (BDRCS) / Disaster Management Bureau / OSM | Shelter Name, NGO Office Name, Capacity, Location coordinates |

*Note on Incomplete Fields:* If phone numbers or websites are absent in the source records, ReliefNet explicitly marks them as `Not available` rather than fabricating synthetic contact numbers.

---

## 3. Flood Condition Layer (STRICTLY SIMULATED / MOCK)

- **Label**: `SIMULATION / MOCK FLOOD DATA`
- **Purpose**: Demonstrate emergency dispatch and gap detection workflows under high-water conditions without misleading operators.
- **Scenario Model**: 2024 Eastern Bangladesh Flood event (Muhuri & Feni River inundation impacting Sonagazi, Feni Sadar, Chhagalnaiya, Parshuram, and Fulgazi).
- **Attributes**: `severity` (EXTREME / SEVERE / MODERATE), `simulated_timestamp`, `inundation_depth_est`, `source = "SIMULATION"`.
- **Extensibility**: The ingestion interface allows swapping the mock provider with Copernicus EMS / FFWC (Flood Forecasting and Warning Centre) GeoTIFF or WMS feeds in future releases.

---

## 4. Relief Providers & Inventories (Demo Data for MVP)

- **Label**: `DEMO / OPERATIONAL MOCK`
- **Providers Included**:
  - Bangladesh Red Crescent Society (BDRCS) - Feni Unit
  - As-Sunnah Foundation Flood Relief Unit
  - BRAC Humanitarian Response
  - Dhaka Ahsania Mission Emergency Team
  - Local Volunteer Rescue Network
- **Resources Tracked**: Food parcels, Drinking Water liters/jerrycans, Emergency Medicine kits, Hygiene packs, Tarpaulins/Shelter kits, Rescue Boats, Field Volunteers.
