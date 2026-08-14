import json
from backend.app.models.enums import AssignmentStatus, ReportStatus


def test_full_operational_loop(client):
    """
    Validates the end-to-end humanitarian disaster coordination loop:
    SMS -> Report -> Verification -> Assignment -> Dispatch -> Delivery -> Gap Update
    """
    # 0. Setup Operator Account
    client.post("/api/v1/auth/register", json={
        "email": "lead_operator@reliefnet.bd",
        "password": "securepassword",
        "full_name": "Chief EOC Operator",
        "role": "OPERATOR"
    })
    login_res = client.post("/api/v1/auth/login", json={
        "email": "lead_operator@reliefnet.bd",
        "password": "securepassword"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Step 1: Ingest Distress SMS from Sonagazi, Feni
    sms_res = client.post("/api/v1/sms/simulate", json={
        "sender": "+8801819998877",
        "message": "আমাদের এলাকায় সোনাগাজী সদর ইউনিয়নে পানি বৃদ্ধি পাচ্ছে। ৫০ পরিবার পানিবন্দী। খাবার ও বিশুদ্ধ পানি চাই।"
    }, headers=headers)
    assert sms_res.status_code == 200
    report_id = sms_res.json()["report_id"]
    assert report_id is not None

    # Verify report status is UNVERIFIED
    rep_res = client.get(f"/api/v1/reports/{report_id}")
    assert rep_res.status_code == 200
    assert rep_res.json()["status"] == "UNVERIFIED"
    assert rep_res.json()["upazila"] == "Sonagazi"

    # 2. Step 2: Check Area Signals & Verification Required
    signals_res = client.get("/api/v1/verification/signals")
    assert signals_res.status_code == 200
    signals = signals_res.json()
    sonagazi_signal = next((s for s in signals if s["upazila"] == "Sonagazi"), None)
    assert sonagazi_signal is not None
    assert len(sonagazi_signal["nearby_institutions"]) > 0

    # 3. Step 3: Ground-Truth Verification via Local Anchor (Sonagazi College)
    target_inst = sonagazi_signal["nearby_institutions"][0]
    verify_res = client.post("/api/v1/verification", json={
        "institution_id": target_inst["id"],
        "reported_condition": "SEVERELY_FLOODED",
        "status": "VERIFIED",
        "water_level_estimate": "3-4 feet",
        "access_road_status": "Cut off",
        "notes": "Verified situation. 50 families cut off in union."
    }, headers=headers)
    assert verify_res.status_code == 201

    # Check report status is now VERIFIED
    rep_res_after = client.get(f"/api/v1/reports/{report_id}")
    assert rep_res_after.json()["status"] == "VERIFIED"

    # 4. Step 4: Provider Creation & Inventory Stocking
    prov_res = client.post("/api/v1/providers", json={
        "name": "BDRCS Sonagazi Rescue Squad",
        "type": "LOCAL_NGO",
        "contact_person": "Squad Leader",
        "phone": "+8801811223344",
        "operating_upazilas": '["Sonagazi", "Feni Sadar"]'
    }, headers=headers)
    assert prov_res.status_code == 201
    prov_id = prov_res.json()["id"]

    # Stock food and water
    client.post(f"/api/v1/providers/{prov_id}/resources", json={
        "category": "FOOD",
        "item_name": "Dry Food Packs",
        "available_qty": 500,
        "reserved_qty": 0,
        "delivered_qty": 0,
        "unit": "packages"
    }, headers=headers)

    client.post(f"/api/v1/providers/{prov_id}/resources", json={
        "category": "WATER",
        "item_name": "Drinking Water",
        "available_qty": 400,
        "reserved_qty": 0,
        "delivered_qty": 0,
        "unit": "liters"
    }, headers=headers)

    # 5. Step 5: Create Relief Assignment
    assign_payload = {
        "provider_id": prov_id,
        "destination_division": "Chittagong",
        "destination_district": "Feni",
        "destination_upazila": "Sonagazi",
        "priority": "CRITICAL",
        "allocated_resources": json.dumps([
            {"category": "FOOD", "item_name": "Dry Food Packs", "quantity": 100, "unit": "packages"},
            {"category": "WATER", "item_name": "Drinking Water", "quantity": 100, "unit": "liters"}
        ]),
        "target_households": 50,
        "target_people": 200,
        "report_ids": [report_id],
        "notes": "Urgent speedboat dispatch to Sonagazi Sadar."
    }
    assign_res = client.post("/api/v1/assignments", json=assign_payload, headers=headers)
    assert assign_res.status_code == 201
    assignment_id = assign_res.json()["id"]

    # Check that provider available inventory was reserved
    prov_check = client.get(f"/api/v1/providers/{prov_id}")
    food_res = next(r for r in prov_check.json()["resources"] if r["category"] == "FOOD")
    assert food_res["available_qty"] == 400
    assert food_res["reserved_qty"] == 100

    # 6. Step 6: Dispatch Lifecycle Progression
    # Advance to DISPATCHED
    disp_res = client.patch(f"/api/v1/assignments/{assignment_id}/status", json={
        "status": "DISPATCHED",
        "notes": "Convoy has left base"
    }, headers=headers)
    assert disp_res.status_code == 200
    assert disp_res.json()["status"] == "DISPATCHED"

    # Advance to IN_TRANSIT
    transit_res = client.patch(f"/api/v1/assignments/{assignment_id}/status", json={
        "status": "IN_TRANSIT"
    }, headers=headers)
    assert transit_res.status_code == 200
    assert transit_res.json()["status"] == "IN_TRANSIT"

    # 7. Step 7: Confirm Ground Delivery
    deliv_payload = {
        "assignment_id": assignment_id,
        "people_served": 200,
        "households_served": 50,
        "proof_notes": "Delivered in person to families at Union Shelter",
        "distribution_point": "Sonagazi Union Center",
        "status": "DELIVERED",
        "items": [
            {"resource_category": "FOOD", "item_name": "Dry Food Packs", "quantity_delivered": 100, "unit": "packages"},
            {"resource_category": "WATER", "item_name": "Drinking Water", "quantity_delivered": 100, "unit": "liters"}
        ]
    }
    deliv_res = client.post("/api/v1/deliveries", json=deliv_payload, headers=headers)
    assert deliv_res.status_code == 201

    # Verify inventory ledger adjusted (reserved -> delivered)
    prov_after_deliv = client.get(f"/api/v1/providers/{prov_id}")
    food_after = next(r for r in prov_after_deliv.json()["resources"] if r["category"] == "FOOD")
    assert food_after["reserved_qty"] == 0
    assert food_after["delivered_qty"] == 100

    # Verify report status is now RESOLVED
    rep_final = client.get(f"/api/v1/reports/{report_id}")
    assert rep_final.json()["status"] == "RESOLVED"

    # 8. Step 8: Verify Gap Engine and Audit Trail
    overview_res = client.get("/api/v1/overview/metrics")
    assert overview_res.status_code == 200
    assert overview_res.json()["delivered_aid"] >= 1

    audit_res = client.get("/api/v1/audit")
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 4
