def test_geo_boundaries_and_search(client):
    # 1. Divisions
    div_res = client.get("/api/v1/geo/divisions")
    assert div_res.status_code == 200
    divs = div_res.json()
    assert len(divs) >= 8
    assert any(d["name"] == "Chittagong" for d in divs)

    # 2. Districts
    dist_res = client.get("/api/v1/geo/districts")
    assert dist_res.status_code == 200
    dists = dist_res.json()
    assert any(d["name"] == "Feni" for d in dists)

    # 3. Search Feni
    search_res = client.get("/api/v1/geo/search?q=Feni")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) > 0
    assert any("Feni" in r["title"] for r in results)

    # 4. Search Sonagazi
    search_sonagazi = client.get("/api/v1/geo/search?q=Sonagazi")
    assert search_sonagazi.status_code == 200
    assert any("Sonagazi" in r["title"] for r in search_sonagazi.json())


def test_institutions_retrieval_and_contact_log(client):
    # Register/Login an operator
    client.post("/api/v1/auth/register", json={
        "email": "verifier_inst@reliefnet.bd",
        "password": "pass",
        "full_name": "Inst Verifier",
        "role": "VERIFIER"
    })
    login_res = client.post("/api/v1/auth/login", json={
        "email": "verifier_inst@reliefnet.bd",
        "password": "pass"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch institutions
    inst_res = client.get("/api/v1/institutions?upazila=Sonagazi")
    assert inst_res.status_code == 200
    inst_list = inst_res.json()
    assert len(inst_list) > 0
    target_inst = inst_list[0]
    assert target_inst["upazila"] == "Sonagazi"

    # Log contact
    contact_payload = {
        "contact_method": "PHONE",
        "contact_target": "+8801819345678",
        "purpose": "Check flood inundation level",
        "result": "Headmaster reported 3 feet water on grounds",
        "notes": "Building safe for evacuation"
    }
    contact_res = client.post(
        f"/api/v1/institutions/{target_inst['id']}/contact-log",
        json=contact_payload,
        headers=headers
    )
    assert contact_res.status_code == 201
    assert contact_res.json()["contact_target"] == "+8801819345678"


def test_reports_and_gaps_exports(client):
    # 1. GeoJSON export
    geojson_res = client.get("/api/v1/reports/export/geojson")
    assert geojson_res.status_code == 200
    geo_data = geojson_res.json()
    assert geo_data["type"] == "FeatureCollection"
    assert isinstance(geo_data["features"], list)

    # 2. CSV export reports
    csv_res = client.get("/api/v1/reports/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "ID,Status,Severity" in csv_res.text

    # 3. CSV export gaps
    gap_csv_res = client.get("/api/v1/gaps/export/csv")
    assert gap_csv_res.status_code == 200
    assert "text/csv" in gap_csv_res.headers["content-type"]
    assert "ID,Gap Type,Severity" in gap_csv_res.text
