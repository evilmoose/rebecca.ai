"""
/app/models/user.py
User model for authentication
"""
from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy import Boolean, Column, String, Integer
from sqlalchemy.orm import relationship

from app.core.db import Base

class User(SQLAlchemyBaseUserTable[int], Base):
    """User model for authentication."""

    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    first_name = Column(String(length=50), nullable=True)
    last_name = Column(String(length=50), nullable=True)
    