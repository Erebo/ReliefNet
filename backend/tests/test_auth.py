def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_user_registration_and_login(client):
    # 1. Register User
    reg_payload = {
        "email": "test_operator@reliefnet.bd",
        "password": "securepassword123",
        "full_name": "Test Field Operator",
        "role": "OPERATOR",
        "organization_name": "Red Crescent"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    assert reg_res.json()["email"] == "test_operator@reliefnet.bd"
    assert reg_res.json()["role"] == "OPERATOR"

    # 2. Login
    login_payload = {
        "email": "test_operator@reliefnet.bd",
        "password": "securepassword123"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    token = data["access_token"]

    # 3. Get Profile (/me)
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["full_name"] == "Test Field Operator"
