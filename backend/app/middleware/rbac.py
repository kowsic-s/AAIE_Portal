from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from app.services.auth_service import decode_token
from typing import Callable

bearer_scheme = HTTPBearer(auto_error=True)


class CurrentUser:
    def __init__(self, id: int, role: str, name: str, email: str):
        self.id = id
        self.role = role
        self.name = name
        self.email = email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        name: str = payload.get("name", "")
        email: str = payload.get("email", "")
        if user_id is None or role is None:
            raise credentials_exception
        return CurrentUser(id=int(user_id), role=role, name=name, email=email)
    except JWTError:
        raise credentials_exception


def require_role(*roles: str) -> Callable:
    async def dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {list(roles)}",
            )
        return current_user

    return dependency
