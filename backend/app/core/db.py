"""
/app/core/db.py
Database connection and configuration.
""" 

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import text

from app.core.config import settings

# Create async engine with SSL configuration
# Handle the sslmode parameter for asyncpg
db_url = settings.DATABASE_URL

# For asyncpg, we need to convert sslmode=require to ssl=True
connect_args = {}
if "sslmode=require" in db_url:
    # Remove sslmode from URL
    db_url = db_url.replace("?sslmode=require", "")
    # Add SSL configuration
    connect_args["ssl"] = True

# Create async engine with improved connection parameters
engine = create_async_engine(
    db_url, 
    echo=True,  # Enable logging to see connection attempts
    connect_args=connect_args,
    pool_pre_ping=True,  # Check connection validity before using it
    pool_recycle=3600,   # Recycle connections after 1 hour
    pool_size=20,        # Increase pool size
    max_overflow=10      # Allow 10 connections beyond pool_size
)

# Create async session factory
async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Create base class for SQLAlchemy models
Base = declarative_base()


async def get_db():
    """Dependency for getting async DB session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def test_db_connection():
    """Simple test to verify database connectivity."""
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
            return {"status": "success", "message": "Connected to database successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)} 