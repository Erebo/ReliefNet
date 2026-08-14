import os
import sys

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath("."))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.geo.boundary_loader import seed_geographic_data_if_empty

TEST_DATABASE_URL = "sqlite:///./test_reliefnet.db"

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()
    seed_geographic_data_if_empty(db, data_dir="data")
    db.close()
    yield
    Base.metadata.drop_all(bind=engine_test)
    if os.path.exists("./test_reliefnet.db"):
        try:
            os.remove("./test_reliefnet.db")
        except:
            pass


@pytest.fixture()
def db_session():
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
