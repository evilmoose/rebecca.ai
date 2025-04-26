from fastapi_users import schemas
# User schemas
class UserRead(schemas.BaseUser[int]):
    """User read schema."""
    first_name: str | None = None
    last_name: str | None = None


class UserCreate(schemas.BaseUserCreate):
    """User create schema."""
    first_name: str | None = None
    last_name: str | None = None


class UserUpdate(schemas.BaseUserUpdate):
    """User update schema."""
    first_name: str | None = None
    last_name: str | None = None