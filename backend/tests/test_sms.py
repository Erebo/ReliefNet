from backend.app.sms.parser import parse_sms_report


def test_bangla_sms_deterministic_parser():
    raw_bangla = "আমাদের এলাকায় পানি বাড়ছে। প্রায় ৫০ পরিবার পানিবন্দী। খাবার ও বিশুদ্ধ পানি প্রয়োজন। সোনাগাজী, ফেনী।"
    parsed = parse_sms_report(sender="+8801819123456", raw_message=raw_bangla)

    assert parsed["upazila"] == "Sonagazi"
    assert parsed["district"] == "Feni"
    assert parsed["location_confidence"] == "HIGH"
    assert "Food" in parsed["need_types"]
    assert "Water" in parsed["need_types"]
    assert parsed["households_affected"] == 50
    assert parsed["is_trapped"] is True


def test_sms_simulator_endpoint(client):
    payload = {
        "sender": "+8801711223344",
        "message": "জরুরী সাহায্য দরকার! পরশুরাম বাজারে পানি বুক সমান। ১০ পরিবার ঘরে আটকে আছে, দ্রুত উদ্ধার বোট পাঠান।"
    }
    res = client.post("/api/v1/sms/simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["upazila"] == "Parshuram"
    assert data["district"] == "Feni"
    assert "Boat Rescue" in data["need_types"]
    assert data["report_id"] is not None

    # Check that report is queryable
    rep_res = client.get(f"/api/v1/reports/{data['report_id']}")
    assert rep_res.status_code == 200
    assert rep_res.json()["upazila"] == "Parshuram"
    assert rep_res.json()["status"] == "UNVERIFIED"
