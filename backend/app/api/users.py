"""
/app/api/users.py
User authentication API using fastapi-users.
"""
from typing import Optional

from fastapi import Depends, Request, HTTPException, status
from fastapi_users import BaseUserManager, FastAPIUsers, IntegerIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.models.user import User

# User database adapter
async def get_user_db(session: AsyncSession = Depends(get_db)):
    """Get user database adapter."""
    yield SQLAlchemyUserDatabase(session, User)

# User manager for handling user operations
class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    """User manager for handling user operations."""

    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        """Hook that is called after a user is registered."""
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        """Hook that is called after a user requests a password reset."""
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        """Hook that is called after a user requests verification."""
        print(f"Verification requested for user {user.id}. Verification token: {token}")

# Get user manager
async def get_user_manager(user_db=Depends(get_user_db)):
    """Get user manager."""
    yield UserManager(user_db)

# Bearer transport for JWT
bearer_transport = BearerTransport(tokenUrl=f"{settings.API_V1_STR}/auth/jwt/login")

# JWT strategy for authentication
def get_jwt_strategy() -> JWTStrategy:
    """Get JWT strategy."""
    return JWTStrategy(
        secret=settings.SECRET_KEY,
        lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

# Authentication backend
auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

# FastAPI Users instance
fastapi_users = FastAPIUsers[User, int](get_user_manager, [auth_backend])

# Current user dependencies
current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)

# Optional current user dependency - for endpoints that work with or without authentication
async def optional_current_user(request: Request):
    """
    Get the current user if authenticated, otherwise return None.
    This is useful for endpoints that can be accessed by both authenticated and unauthenticated users.
    """
    try:
        user = await current_active_user(request)
        return user
    except:
        return None
    
async def is_admin(user: User = Depends(current_active_user)) -> bool:
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required"
        )
    return True 