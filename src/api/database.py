"""
Database configuration and models using SQLAlchemy.
"""
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship

from config.settings import settings


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String(20), default="analyst")  # admin, analyst, viewer
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    predictions = relationship("PredictionLog", back_populates="user")


class PredictionLog(Base):
    """Log of all predictions made."""
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_id = Column(String(100), nullable=True)
    input_data = Column(Text, nullable=False)  # JSON string
    churn_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    will_churn = Column(Boolean, nullable=False)
    feature_importance = Column(Text, nullable=True)  # JSON string
    recommendations = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="predictions")


class CustomerRecord(Base):
    """Stored customer records for analysis."""
    __tablename__ = "customer_records"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(100), unique=True, index=True)
    gender = Column(String(10))
    senior_citizen = Column(Integer)
    partner = Column(String(10))
    dependents = Column(String(10))
    tenure = Column(Integer)
    phone_service = Column(String(10))
    multiple_lines = Column(String(20))
    internet_service = Column(String(20))
    online_security = Column(String(20))
    online_backup = Column(String(20))
    device_protection = Column(String(20))
    tech_support = Column(String(20))
    streaming_tv = Column(String(20))
    streaming_movies = Column(String(20))
    contract = Column(String(20))
    paperless_billing = Column(String(10))
    payment_method = Column(String(50))
    monthly_charges = Column(Float)
    total_charges = Column(Float)
    churn_probability = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=True)
    last_prediction_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ModelVersion(Base):
    """Track model versions and their performance."""
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(20), unique=True, nullable=False)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    roc_auc = Column(Float)
    pr_auc = Column(Float)
    training_samples = Column(Integer)
    is_active = Column(Boolean, default=False)
    model_path = Column(String(255))
    training_config = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)


# Database engine and session
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
