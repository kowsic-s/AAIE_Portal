#!/bin/bash
set -e

if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
	echo "Running Alembic migrations..."
	if ! alembic upgrade head; then
		if [ "${MIGRATIONS_STRICT:-0}" = "1" ]; then
			echo "Alembic migrations failed and MIGRATIONS_STRICT=1. Exiting."
			exit 1
		fi
		echo "Alembic migrations failed. Continuing startup so the web service can bind to PORT."
	fi
else
	echo "Skipping Alembic migrations (RUN_MIGRATIONS != 1)."
fi

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
