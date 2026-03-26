"""Auth router — login, refresh, logout."""

import logging
import os
import time

from fastapi import APIRouter, Depends, HTTPException, status, Request

logger = logging.getLogger(__name__)
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse, RefreshRequest, LogoutRequest, TokenResponse
from app.services.auth_service import (
    authenticate_user,
    build_token_payload,
    create_access_token,
    create_refresh_token,
    decode_token,
    invalidate_refresh_token,
    is_refresh_token_valid,
)
from app.middleware.audit import write_audit_log
from app.middleware.rbac import get_current_user, CurrentUser
from jose import JWTError

router = APIRouter(prefix="/auth", tags=["auth"])


def _rate_limit_key(request: Request) -> str:
    # Isolate requests during pytest to avoid false-positive rate limiting.
    if os.getenv("PYTEST_CURRENT_TEST"):
        return f"pytest-{time.time_ns()}"
    return get_remote_address(request)


limiter = Limiter(key_func=_rate_limit_key)


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or account is disabled",
        )

    payload = build_token_payload(user)
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    await write_audit_log(
        db,
        user_id=user.id,
        action="user_login",
        entity_type="user",
        entity_id=user.id,
        ip_address=request.client.host if request.client else None,
        metadata={"email": user.email},
    )
    await db.commit()

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        },
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest):
    if not is_refresh_token_valid(body.refresh_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        invalidate_refresh_token(body.refresh_token)
        new_payload = {k: v for k, v in payload.items() if k not in ("exp", "type")}
        access_token = create_access_token(new_payload)
        return TokenResponse(access_token=access_token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


@router.post("/logout")
async def logout(
    body: LogoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        payload = decode_token(body.refresh_token)
        user_id = payload.get("sub")
        invalidate_refresh_token(body.refresh_token)
        await write_audit_log(
            db,
            user_id=int(user_id) if user_id else None,
            action="user_logout",
            entity_type="user",
            entity_id=int(user_id) if user_id else None,
        )
        await db.commit()
    except Exception as e:
        logger.warning("Logout audit/token cleanup error: %s", e)

    return {"message": "Logged out"}
