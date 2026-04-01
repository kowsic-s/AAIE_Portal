"""Alembic environment configuration — supports async SQLAlchemy."""

import asyncio
import os
import ssl
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from dotenv import load_dotenv

# Load .env so DATABASE_URL is available
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so Alembic can detect them
from app.database import Base  # noqa
import app.models  # noqa — registers all ORM models

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = os.environ.get("DATABASE_URL", config.get_main_option("sqlalchemy.url"))
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section)
    # Use DATABASE_URL from .env, ensuring async driver
    url = os.environ.get("DATABASE_URL", configuration.get("sqlalchemy.url", ""))
    if "pymysql" in url:
        url = url.replace("pymysql", "aiomysql")
    configuration["sqlalchemy.url"] = url

    connect_args = {}
    ssl_required = os.environ.get("DATABASE_SSL_REQUIRED", "false").lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    if ssl_required and url.startswith("mysql"):
        ssl_ca_path = os.environ.get("DATABASE_SSL_CA_PATH")
        ssl_ctx = ssl.create_default_context(cafile=ssl_ca_path)
        ssl_ctx.check_hostname = True
        ssl_ctx.verify_mode = ssl.CERT_REQUIRED
        connect_args["ssl"] = ssl_ctx

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
