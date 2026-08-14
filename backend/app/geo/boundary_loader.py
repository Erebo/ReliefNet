import json
import os
import logging
from sqlalchemy.orm import Session
from backend.app.models.geo import AdministrativeArea
from backend.app.models.institution import Institution
from backend.app.models.flood import FloodSimulation
from backend.app.models.enums import AdminLevel, InstitutionType, SeverityLevel, VerificationStatus

logger = logging.getLogger("reliefnet.geo")


def seed_geographic_data_if_empty(db: Session, data_dir: str = "data"):
    """Seeds real Bangladesh administrative boundaries, institutions, and simulations if database is empty."""
    admin_count = db.query(AdministrativeArea).count()
    if admin_count > 0:
        logger.info(f"Administrative areas already present ({admin_count} records). Skipping seeding.")
        return

    logger.info("Seeding initial Bangladesh administrative hierarchy and institutions...")

    admin_file = os.path.join(data_dir, "boundaries", "bangladesh_admin.json")
    if os.path.exists(admin_file):
        with open(admin_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Divisions
        division_map = {}
        for div in data.get("divisions", []):
            area = AdministrativeArea(
                name=div["name"],
                bangla_name=div.get("bangla_name"),
                level=AdminLevel.DIVISION,
                pcode=div.get("pcode"),
                center_lat=div["center_lat"],
                center_lon=div["center_lon"],
                bounding_box=json.dumps(div.get("bounding_box", [])),
                population_est=div.get("population_est")
            )
            db.add(area)
            db.flush()
            division_map[div["name"]] = area.id

        # 2. Districts
        district_map = {}
        for dist in data.get("districts", []):
            parent_id = division_map.get(dist.get("division"))
            area = AdministrativeArea(
                name=dist["name"],
                bangla_name=dist.get("bangla_name"),
                level=AdminLevel.DISTRICT,
                pcode=dist.get("pcode"),
                parent_id=parent_id,
                center_lat=dist["center_lat"],
                center_lon=dist["center_lon"],
                bounding_box=json.dumps(dist.get("bounding_box", [])),
                population_est=dist.get("population_est")
            )
            db.add(area)
            db.flush()
            district_map[dist["name"]] = area.id

        # 3. Upazilas
        upazila_map = {}
        for upz in data.get("upazilas", []):
            parent_id = district_map.get(upz.get("district"))
            area = AdministrativeArea(
                name=upz["name"],
                bangla_name=upz.get("bangla_name"),
                level=AdminLevel.UPAZILA,
                pcode=upz.get("pcode"),
                parent_id=parent_id,
                center_lat=upz["center_lat"],
                center_lon=upz["center_lon"],
                bounding_box=json.dumps(upz.get("bounding_box", [])),
                population_est=upz.get("population_est")
            )
            db.add(area)
            db.flush()
            upazila_map[upz["name"]] = area.id

        # 4. Unions
        for un in data.get("unions", []):
            parent_id = upazila_map.get(un.get("upazila"))
            area = AdministrativeArea(
                name=un["name"],
                bangla_name=un.get("bangla_name"),
                level=AdminLevel.UNION,
                parent_id=parent_id,
                center_lat=un["center_lat"],
                center_lon=un["center_lon"]
            )
            db.add(area)

        db.commit()
        logger.info("Administrative boundaries seeded successfully.")

    # Seed Institutions
    inst_file = os.path.join(data_dir, "institutions", "bangladesh_institutions.json")
    if os.path.exists(inst_file) and db.query(Institution).count() == 0:
        with open(inst_file, "r", encoding="utf-8") as f:
            institutions_data = json.load(f)
            for item in institutions_data:
                inst = Institution(
                    name=item["name"],
                    bangla_name=item.get("bangla_name"),
                    type=InstitutionType(item["type"]),
                    division=item["division"],
                    district=item["district"],
                    upazila=item["upazila"],
                    union=item.get("union"),
                    address=item.get("address"),
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    phone=item.get("phone"),
                    email=item.get("email"),
                    website=item.get("website"),
                    source=item.get("source", "OpenStreetMap / BANBEIS"),
                    source_id=item.get("source_id"),
                    capacity_est=item.get("capacity_est"),
                    verification_status=VerificationStatus(item.get("verification_status", "PENDING"))
                )
                db.add(inst)
            db.commit()
            logger.info("Real institutions seeded successfully.")

    # Seed Flood Simulations
    flood_file = os.path.join(data_dir, "flood", "flood_simulations.json")
    if os.path.exists(flood_file) and db.query(FloodSimulation).count() == 0:
        with open(flood_file, "r", encoding="utf-8") as f:
            flood_data = json.load(f)
            for sim in flood_data:
                sim_obj = FloodSimulation(
                    name=sim["name"],
                    severity=SeverityLevel(sim.get("severity", "SEVERE")),
                    affected_district=sim["affected_district"],
                    affected_upazilas=json.dumps(sim["affected_upazilas"]),
                    water_level_m_est=sim.get("water_level_m_est", 1.5),
                    source_label=sim.get("source_label", "SIMULATION"),
                    geojson_polygon=json.dumps(sim["geojson_polygon"]),
                    is_active=sim.get("is_active", True)
                )
                db.add(sim_obj)
            db.commit()
            logger.info("Flood simulations seeded successfully.")
