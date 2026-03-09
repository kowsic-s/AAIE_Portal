"""AAIE FastAPI Application Entry Point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.routers import auth, admin, staff, student, ml

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AAIE — Academic AI Intervention Engine",
    description="AI-powered academic performance monitoring and early intervention system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(staff.router)
app.include_router(student.router)
app.include_router(ml.router)


@app.get("/health", tags=["health"])
async def health_check():
    from app.database import engine as db_engine
    from app.ml.engine import get_engine
    from sqlalchemy import text

    db_status = "healthy"
    try:
        async with db_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    ml_engine = get_engine()
    return {
        "status": "ok",
        "database": db_status,
        "ml_engine": {
            "ready": ml_engine.is_ready(),
            "active_version": ml_engine.registry.get_active_version(),
        },
    }


@app.on_event("startup")
async def startup_event():
    """Initialize ML engine on startup."""
    from app.ml.engine import get_engine
    engine = get_engine()
    if engine.is_ready():
        print(f"✓ ML Engine ready — active model: {engine.registry.get_active_version()}")
    else:
        print("⚠ ML Engine: no active model. Run /ml/train to train a model.")
