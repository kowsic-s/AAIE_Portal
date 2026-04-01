import ssl
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()


def _sanitize_database_url(url: str) -> str:
    # Remove URL SSL query params so aiomysql gets SSL via connect_args only.
    parts = urlsplit(url)
    filtered = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if k.lower() not in {"ssl", "sslmode", "ssl_mode", "ssl-mode"}
    ]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(filtered), parts.fragment))


database_url = _sanitize_database_url(settings.DATABASE_URL)

engine_connect_args = {}
if settings.DATABASE_SSL_REQUIRED and database_url.startswith("mysql"):
    ssl_ctx = ssl.create_default_context(cafile=settings.DATABASE_SSL_CA_PATH or None)
    ssl_ctx.check_hostname = True
    ssl_ctx.verify_mode = ssl.CERT_REQUIRED
    engine_connect_args["ssl"] = ssl_ctx

engine = create_async_engine(
    database_url,
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    connect_args=engine_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
