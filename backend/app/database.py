from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get and fix database URL for asyncpg
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "")
if SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async SQLAlchemy engine
async_engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)

# Create synchronous engine for table creation
engine = create_engine(SQLALCHEMY_DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1), echo=True)

# Create AsyncSessionLocal class
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Create Base class
Base = declarative_base()

# Async DB Dependency
async def get_async_db():
    async with AsyncSessionLocal() as session:
        yield session