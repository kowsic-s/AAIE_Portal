"""
Tests for authentication routes.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.services.auth_service import hash_password


# ── In-memory SQLite for tests ───────────────────────────────────────────────
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


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def admin_user(db_session):
    user = User(
        name="Test Admin",
        email="admin@test.com",
        password_hash=hash_password("Admin@123"),
        role="admin",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def client(admin_user):
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Tests ────────────────────────────────────────────────────────────────────
class TestLogin:
    async def test_login_success(self, client):
        response = await client.post(
            "/auth/login",
            json={"email": "admin@test.com", "password": "Admin@123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "admin@test.com"
        assert data["user"]["role"] == "admin"

    async def test_login_wrong_password(self, client):
        response = await client.post(
            "/auth/login",
            json={"email": "admin@test.com", "password": "wrong_password"},
        )
        assert response.status_code == 401

    async def test_login_unknown_email(self, client):
        response = await client.post(
            "/auth/login",
            json={"email": "nobody@test.com", "password": "Admin@123"},
        )
        assert response.status_code == 401

    async def test_login_missing_fields(self, client):
        response = await client.post("/auth/login", json={"email": "admin@test.com"})
        assert response.status_code == 422

    async def test_login_returns_correct_role(self, client):
        response = await client.post(
            "/auth/login",
            json={"email": "admin@test.com", "password": "Admin@123"},
        )
        assert response.json()["user"]["role"] == "admin"


class TestRefreshToken:
    async def test_refresh_with_valid_token(self, client):
        login = await client.post(
            "/auth/login",
            json={"email": "admin@test.com", "password": "Admin@123"},
        )
        refresh_token = login.json()["refresh_token"]
        response = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 200
        assert "access_token" in response.json()

    async def test_refresh_with_invalid_token(self, client):
        response = await client.post("/auth/refresh", json={"refresh_token": "totally.invalid.token"})
        assert response.status_code == 401

    async def test_refresh_token_rotation(self, client):
        login = await client.post(
            "/auth/login",
            json={"email": "admin@test.com", "password": "Admin@123"},
        )
        rt1 = login.json()["refresh_token"]
        r2 = await client.post("/auth/refresh", json={"refresh_token": rt1})
        assert r2.status_code == 200
        rt2 = r2.json().get("refresh_token")
        # Old token should be invalid now (single-use rotation)
        r3 = await client.post("/auth/refresh", json={"refresh_token": rt1})
        assert r3.status_code == 401


class TestLogout:
    async def test_logout_success(self, client):
        login = await client.post(
            "/auth/login",
            json={"email": "admin@test.com", "password": "Admin@123"},
        )
        tokens = login.json()
        response = await client.post(
            "/auth/logout",
            json={"refresh_token": tokens["refresh_token"]},
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        assert response.status_code == 200

    async def test_logout_without_auth(self, client):
        response = await client.post("/auth/logout", json={"refresh_token": "x"})
        assert response.status_code == 401
