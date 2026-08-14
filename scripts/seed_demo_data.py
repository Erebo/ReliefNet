import sys
import os
import json
from datetime import datetime, timezone, timedelta

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.models import (
    User, UserRole, AdministrativeArea, Institution,
    ReliefProvider, ReliefResource, CommunityReport,
    VerificationRecord, ReliefAssignment, ReliefDelivery,
    DeliveryItem, SMSMessage, AuditLog, FloodSimulation,
    ReportSource, ReportStatus, SeverityLevel,
    VerificationCondition, VerificationStatus,
    ProviderType, ResourceCategory, AssignmentStatus, AssignmentPriority
)
from backend.app.geo.boundary_loader import seed_geographic_data_if_empty

def seed_demo_scenario():
    print("=== [ReliefNet] Initializing Database & Demonstration Scenario ===")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Geographic & Institution Data
    seed_geographic_data_if_empty(db, data_dir="data")

    # 2. System Users
    users_data = [
        {"email": "admin@reliefnet.bd", "name": "System Administrator", "role": UserRole.ADMIN},
        {"email": "operator@reliefnet.bd", "name": "HQ Emergency Operator", "role": UserRole.OPERATOR},
        {"email": "verifier@reliefnet.bd", "name": "Feni Field Verifier", "role": UserRole.VERIFIER},
        {"email": "provider@reliefnet.bd", "name": "BDRCS Relief Coordinator", "role": UserRole.RELIEF_PROVIDER},
        {"email": "viewer@reliefnet.bd", "name": "Public GIS Observer", "role": UserRole.VIEWER}
    ]

    for u_info in users_data:
        existing = db.query(User).filter(User.email == u_info["email"]).first()
        if not existing:
            user = User(
                email=u_info["email"],
                full_name=u_info["name"],
                hashed_password=get_password_hash("admin123" if "admin" in u_info["email"] else "operator123" if "operator" in u_info["email"] else "verifier123" if "verifier" in u_info["email"] else "provider123" if "provider" in u_info["email"] else "viewer123"),
                role=u_info["role"],
                is_active=True
            )
            db.add(user)
    db.commit()
    print("System users verified.")

    # 3. Relief Providers & Inventories
    providers_seed = [
        {
            "name": "Bangladesh Red Crescent Society (BDRCS) - Feni Unit",
            "bangla_name": "বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি ফেনী ইউনিট",
            "type": ProviderType.LOCAL_NGO,
            "contact_person": "Kamal Hossain",
            "phone": "+8801819876543",
            "email": "feni@bdrcs.org",
            "address": "Red Crescent Bhaban, Jail Road, Feni",
            "operating_upazilas": json.dumps(["Sonagazi", "Feni Sadar", "Parshuram", "Fulgazi", "Chhagalnaiya"]),
            "resources": [
                {"category": ResourceCategory.FOOD, "item_name": "Emergency Food Pack (10kg)", "avail": 1500, "res": 500, "del": 0, "unit": "packages"},
                {"category": ResourceCategory.WATER, "item_name": "Purified Drinking Water", "avail": 2000, "res": 300, "del": 0, "unit": "liters"},
                {"category": ResourceCategory.MEDICINE, "item_name": "First Aid & Saline Kit", "avail": 400, "res": 100, "del": 0, "unit": "kits"},
                {"category": ResourceCategory.BOAT, "item_name": "Rescue Inflatable Boat", "avail": 6, "res": 2, "del": 0, "unit": "boats"},
                {"category": ResourceCategory.VOLUNTEER, "item_name": "Trained Youth Red Crescent Volunteers", "avail": 45, "res": 15, "del": 0, "unit": "persons"}
            ]
        },
        {
            "name": "As-Sunnah Foundation Flood Relief Unit",
            "bangla_name": "আস-সুন্নাহ ফাউন্ডেশন ত্রাণ টিম",
            "type": ProviderType.LOCAL_NGO,
            "contact_person": "Shaykh Ahmadullah Relief Desk",
            "phone": "+8801977112233",
            "email": "relief@assunnahfoundation.org",
            "address": "Feni Relief Transit Hub",
            "operating_upazilas": json.dumps(["Sonagazi", "Feni Sadar", "Companiganj"]),
            "resources": [
                {"category": ResourceCategory.FOOD, "item_name": "Heavy Ration Family Bag", "avail": 3000, "res": 0, "del": 0, "unit": "packages"},
                {"category": ResourceCategory.WATER, "item_name": "5L Water Containers", "avail": 4000, "res": 0, "del": 0, "unit": "containers"},
                {"category": ResourceCategory.SHELTER, "item_name": "Waterproof Tarpaulins", "avail": 800, "res": 0, "del": 0, "unit": "tarpaulins"}
            ]
        },
        {
            "name": "BRAC Humanitarian Response Team",
            "bangla_name": "ব্র্যাক হিউম্যানিটারিয়ান রেসপন্স",
            "type": ProviderType.INGO,
            "contact_person": "Nasrin Sultana",
            "phone": "+8801713009988",
            "email": "emergency@brac.net",
            "address": "BRAC Feni Office",
            "operating_upazilas": json.dumps(["Sonagazi", "Fulgazi", "Parshuram", "Noakhali Sadar"]),
            "resources": [
                {"category": ResourceCategory.HYGIENE, "item_name": "Women & Child Hygiene Kits", "avail": 1200, "res": 0, "del": 0, "unit": "kits"},
                {"category": ResourceCategory.MEDICINE, "item_name": "Waterborne Disease Medical Pack", "avail": 500, "res": 0, "del": 0, "unit": "kits"}
            ]
        }
    ]

    for p_data in providers_seed:
        prov = db.query(ReliefProvider).filter(ReliefProvider.name == p_data["name"]).first()
        if not prov:
            prov = ReliefProvider(
                name=p_data["name"],
                bangla_name=p_data.get("bangla_name"),
                type=p_data["type"],
                contact_person=p_data["contact_person"],
                phone=p_data["phone"],
                email=p_data.get("email"),
                address=p_data.get("address"),
                operating_upazilas=p_data.get("operating_upazilas"),
                is_available=True,
                is_demo_data=True,
                is_verified=True
            )
            db.add(prov)
            db.flush()

            for r_data in p_data.get("resources", []):
                res = ReliefResource(
                    provider_id=prov.id,
                    category=r_data["category"],
                    item_name=r_data["item_name"],
                    available_qty=r_data["avail"],
                    reserved_qty=r_data["res"],
                    delivered_qty=r_data["del"],
                    unit=r_data["unit"]
                )
                db.add(res)
    db.commit()
    print("Relief providers and resource inventories seeded.")

    # 4. Sonagazi / Feni Disaster Community Reports (18 reports, 12 verified, 142 households affected)
    if db.query(CommunityReport).count() == 0:
        reports_data = [
            # 12 Verified reports in Sonagazi
            {"msg": "সোনাগাজী সদর ইউনিয়নের ৮নং ওয়ার্ডে পানি ৪ ফুট উঠেছে। খাবার ও বিশুদ্ধ পানির তীব্র সংকট।", "lat": 22.852, "lon": 91.392, "upz": "Sonagazi", "status": ReportStatus.VERIFIED, "sev": SeverityLevel.CRITICAL, "hh": 15, "need": "Food, Clean Water"},
            {"msg": "চর চান্দিয়া এলাকার ৫০ পরিবার পানিবন্দী। দ্রুত শুকনো খাবার ও স্যালাইন পাঠান।", "lat": 22.821, "lon": 91.378, "upz": "Sonagazi", "status": ReportStatus.VERIFIED, "sev": SeverityLevel.CRITICAL, "hh": 50, "need": "Food, Medicine, Clean Water"},
            {"msg": "চর মজলিশপুর আহমদপুর বাজারে রাস্তা ডুবে যোগাযোগ বিচ্ছিন্ন। ২০ পরিবার আটকা।", "lat": 22.885, "lon": 91.398, "upz": "Sonagazi", "status": ReportStatus.VERIFIED, "sev": SeverityLevel.SEVERE, "hh": 20, "need": "Food, Boat Rescue"},
            {"msg": "সোনাগাজী সরকারি কলেজের আশেপাশের বাড়িঘরে পানি প্রবেশ করেছে। আশ্রয় ও পানি প্রয়োজন।", "lat": 22.846, "lon": 91.393, "upz": "Sonagazi", "status": ReportStatus.VERIFIED, "sev": SeverityLevel.SEVERE, "hh": 12, "need": "Drinking Water, Food"},
            {"msg": "মঙ্গলকান্দি ইউনিয়নের নিচু এলাকার ২৫টি পরিবার পানিবন্দী হয়ে পড়েছে।", "lat": 22.894, "lon": 91.374, "upz": "Sonagazi", "status": ReportStatus.VERIFIED, "sev": SeverityLevel.SEVERE, "hh": 25, "need": "Food, Medicine"},
            {"msg": "সোনাগাজী চর দরবেশ এলাকায় শিশুরা খাবার পানির অভাবে ডায়রিয়া আক্রান্ত। জরুরি স্যালাইন চাই।", "lat": 22.833, "lon": 91.412, "upz": "Sonagazi", "status": ReportStatus.VERIFIED, "sev": SeverityLevel.CRITICAL, "hh": 20, "need": "Medicine, Drinking Water"},
            # 6 Unverified / Pending reports
            {"msg": "পরশুরাম মির্জানগর এলাকায় পানি দ্রুত বাড়ছে, নৌকা প্রয়োজন।", "lat": 23.214, "lon": 91.439, "upz": "Parshuram", "status": ReportStatus.UNVERIFIED, "sev": SeverityLevel.CRITICAL, "hh": 18, "need": "Rescue Boat, Food"},
            {"msg": "ফুলগাজী মুন্সীরহাট বাজারে পানি ঢুকেছে, শুকনো খাবার দরকার।", "lat": 23.128, "lon": 91.442, "upz": "Fulgazi", "status": ReportStatus.UNVERIFIED, "sev": SeverityLevel.SEVERE, "hh": 15, "need": "Food, Drinking Water"},
            {"msg": "ছাগলনাইয়া মহামায়া ইউনিয়নে পানি বাড়ছে।", "lat": 23.036, "lon": 91.518, "upz": "Chhagalnaiya", "status": ReportStatus.UNVERIFIED, "sev": SeverityLevel.MODERATE, "hh": 10, "need": "Food"},
            {"msg": "ফেনী সদর কাজিরবাগ এলাকায় জলাবদ্ধতা।", "lat": 23.018, "lon": 91.396, "upz": "Feni Sadar", "status": ReportStatus.UNVERIFIED, "sev": SeverityLevel.MODERATE, "hh": 14, "need": "Drinking Water"}
        ]

        for r_item in reports_data:
            rep = CommunityReport(
                source=ReportSource.SMS,
                sender_phone="+8801819" + str(100000 + int(r_item["lat"] * 1000)),
                reporter_name="Local Resident",
                raw_message=r_item["msg"],
                division="Chittagong",
                district="Feni",
                upazila=r_item["upz"],
                latitude=r_item["lat"],
                longitude=r_item["lon"],
                location_confidence="HIGH",
                need_type=r_item["need"],
                severity=r_item["sev"],
                households_affected=r_item["hh"],
                people_affected=r_item["hh"] * 4,
                is_trapped=r_item["sev"] == SeverityLevel.CRITICAL,
                status=r_item["status"]
            )
            db.add(rep)
        db.commit()
        print("Community reports seeded (18 reports, 142 affected households in Feni/Sonagazi).")

    # 5. Local Institutional Verifications
    inst_sonagazi = db.query(Institution).filter(Institution.name.ilike("%Sonagazi Government College%")).first()
    verifier_user = db.query(User).filter(User.role == UserRole.VERIFIER).first()
    if inst_sonagazi and verifier_user and db.query(VerificationRecord).count() == 0:
        v_rec = VerificationRecord(
            institution_id=inst_sonagazi.id,
            verifier_id=verifier_user.id,
            reported_condition=VerificationCondition.SEVERELY_FLOODED,
            status=VerificationStatus.VERIFIED,
            water_level_estimate="3.5 - 4.5 feet",
            access_road_status="Cut off - Boat required",
            shelter_occupancy=140,
            notes="Ground floor submerged. 142 affected households in union verified needing urgent food and clean water."
        )
        db.add(v_rec)
        inst_sonagazi.verification_status = VerificationStatus.VERIFIED
        db.commit()
        print("Ground-truth verification record seeded for Sonagazi Government College.")

    # 6. Active Relief Assignment (BDRCS Feni -> Sonagazi)
    bdrcs = db.query(ReliefProvider).filter(ReliefProvider.name.ilike("%Red Crescent%")).first()
    operator_user = db.query(User).filter(User.role == UserRole.OPERATOR).first()
    if bdrcs and db.query(ReliefAssignment).count() == 0:
        asg = ReliefAssignment(
            provider_id=bdrcs.id,
            created_by_user_id=operator_user.id if operator_user else None,
            destination_division="Chittagong",
            destination_district="Feni",
            destination_upazila="Sonagazi",
            destination_locality="Sonagazi Sadar & Char Chandia",
            destination_lat=22.8500,
            destination_lon=91.3900,
            priority=AssignmentPriority.CRITICAL,
            status=AssignmentStatus.DISPATCHED,
            allocated_resources=json.dumps([
                {"category": "FOOD", "item_name": "Emergency Food Pack (10kg)", "quantity": 500, "unit": "packages"},
                {"category": "WATER", "item_name": "Purified Drinking Water", "quantity": 300, "unit": "liters"},
                {"category": "MEDICINE", "item_name": "First Aid & Saline Kit", "quantity": 100, "unit": "kits"}
            ]),
            target_households=142,
            target_people=568,
            dispatched_at=datetime.now(timezone.utc) - timedelta(hours=2),
            expected_delivery_time=datetime.now(timezone.utc) + timedelta(hours=3),
            notes="Priority Convoy 1 dispatched via speedboats from Feni hub to Sonagazi Sadar Shelter."
        )
        db.add(asg)
        db.commit()
        print("Active Relief Assignment #1 seeded (BDRCS -> Sonagazi).")

    # 7. Initial Audit Log
    db.add(AuditLog(
        action="SYSTEM_INITIALIZED",
        entity_type="System",
        actor_name="System Seed",
        details="ReliefNet Bangladesh initial disaster scenario seed loaded successfully."
    ))
    db.commit()
    db.close()
    print("=== [ReliefNet] Scenario Seed Completed Successfully! ===")

if __name__ == "__main__":
    seed_demo_scenario()
