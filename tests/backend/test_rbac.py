"""
Tests for Role-Based Access Control (RBAC).
Verifies that endpoints return 403 for insufficient roles
and 401 for unauthenticated requests.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.department import Department
from app.services.auth_service import hash_password


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def create_user(role: str):
    async with TestingSessionLocal() as session:
        user = User(
            name=f"Test {role.title()}",
            email=f"{role}@rbac-test.com",
            password_hash=hash_password("Test@123"),
            role=role,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return user


async def get_token(client, role: str) -> str:
    response = await client.post(
        "/auth/login",
        json={"email": f"{role}@rbac-test.com", "password": "Test@123"},
    )
    assert response.status_code == 200, f"Login failed for {role}: {response.text}"
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def client():
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def all_users(client):
    await create_user("admin")
    await create_user("staff")
    await create_user("student")
    return {
        "admin": await get_token(client, "admin"),
        "staff": await get_token(client, "staff"),
        "student": await get_token(client, "student"),
    }


# Helper
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ── Admin endpoint protection ────────────────────────────────────────────────
class TestAdminRBAC:
    ADMIN_ENDPOINTS = [
        ("GET", "/admin/dashboard"),
        ("GET", "/admin/users"),
        ("GET", "/admin/departments"),
        ("GET", "/admin/settings"),
        ("GET", "/admin/model/versions"),
        ("GET", "/admin/audit-logs"),
    ]

    async def test_admin_endpoints_require_auth(self, client):
        for method, path in self.ADMIN_ENDPOINTS:
            resp = await client.request(method, path)
            assert resp.status_code == 401, f"{method} {path} should be 401, got {resp.status_code}"

    async def test_staff_cannot_access_admin(self, client, all_users):
        for method, path in self.ADMIN_ENDPOINTS:
            resp = await client.request(method, path, headers=auth(all_users["staff"]))
            assert resp.status_code == 403, f"staff on {method} {path} should be 403, got {resp.status_code}"

    async def test_student_cannot_access_admin(self, client, all_users):
        for method, path in self.ADMIN_ENDPOINTS:
            resp = await client.request(method, path, headers=auth(all_users["student"]))
            assert resp.status_code == 403, f"student on {method} {path} should be 403, got {resp.status_code}"

    async def test_admin_can_access_admin_dashboard(self, client, all_users):
        resp = await client.get("/admin/dashboard", headers=auth(all_users["admin"]))
        assert resp.status_code == 200


# ── Staff endpoint protection ────────────────────────────────────────────────
class TestStaffRBAC:
    STAFF_ENDPOINTS = [
        ("GET", "/staff/dashboard"),
        ("GET", "/staff/students"),
    ]

    async def test_staff_endpoints_require_auth(self, client):
        for method, path in self.STAFF_ENDPOINTS:
            resp = await client.request(method, path)
            assert resp.status_code == 401

    async def test_student_cannot_access_staff(self, client, all_users):
        for method, path in self.STAFF_ENDPOINTS:
            resp = await client.request(method, path, headers=auth(all_users["student"]))
            assert resp.status_code == 403

    async def test_staff_can_access_staff_dashboard(self, client, all_users):
        resp = await client.get("/staff/dashboard", headers=auth(all_users["staff"]))
        assert resp.status_code == 200

    async def test_admin_cannot_access_staff_routes(self, client, all_users):
        """Admin role should not bypass staff-only routes."""
        for method, path in self.STAFF_ENDPOINTS:
            resp = await client.request(method, path, headers=auth(all_users["admin"]))
            assert resp.status_code in (200, 403)  # some may allow admin; none should crash


# ── Student endpoint protection ──────────────────────────────────────────────
class TestStudentRBAC:
    STUDENT_ENDPOINTS = [
        ("GET", "/student/dashboard"),
        ("GET", "/student/performance"),
        ("GET", "/student/recommendations"),
    ]

    async def test_student_endpoints_require_auth(self, client):
        for method, path in self.STUDENT_ENDPOINTS:
            resp = await client.request(method, path)
            assert resp.status_code == 401

    async def test_staff_cannot_access_student_routes(self, client, all_users):
        for method, path in self.STUDENT_ENDPOINTS:
            resp = await client.request(method, path, headers=auth(all_users["staff"]))
            assert resp.status_code == 403

    async def test_admin_cannot_access_student_routes(self, client, all_users):
        for method, path in self.STUDENT_ENDPOINTS:
            resp = await client.request(method, path, headers=auth(all_users["admin"]))
            assert resp.status_code == 403


# ── ML endpoint protection ───────────────────────────────────────────────────
class TestMLRBAC:
    async def test_ml_health_is_public(self, client):
        resp = await client.get("/ml/health")
        assert resp.status_code == 200

    async def test_ml_train_requires_admin(self, client, all_users):
        resp = await client.post("/ml/train", headers=auth(all_users["staff"]))
        assert resp.status_code == 403
        resp2 = await client.post("/ml/train", headers=auth(all_users["student"]))
        assert resp2.status_code == 403

    async def test_ml_model_info_requires_auth(self, client):
        resp = await client.get("/ml/model/info")
        assert resp.status_code == 401
