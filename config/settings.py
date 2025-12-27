"""
Application configuration settings using Pydantic.
"""
from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_name: str = "ChurnShield AI"
    app_version: str = "1.0.0"
    debug: bool = False

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"

    # Security
    secret_key: str = "your-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Database
    database_url: str = "sqlite+aiosqlite:///./churnshield.db"

    # Paths
    base_dir: Path = Path(__file__).parent.parent
    data_dir: Path = base_dir / "data"
    models_dir: Path = base_dir / "models"
    raw_data_dir: Path = data_dir / "raw"
    processed_data_dir: Path = data_dir / "processed"

    # ML Model
    model_name: str = "churn_model"
    model_version: str = "v1"
    prediction_threshold: float = 0.5

    # Feature columns
    categorical_features: list = [
        "gender", "SeniorCitizen", "Partner", "Dependents",
        "PhoneService", "MultipleLines", "InternetService",
        "OnlineSecurity", "OnlineBackup", "DeviceProtection",
        "TechSupport", "StreamingTV", "StreamingMovies",
        "Contract", "PaperlessBilling", "PaymentMethod"
    ]
    numerical_features: list = ["tenure", "MonthlyCharges", "TotalCharges"]
    target_column: str = "Churn"

    # Streamlit
    streamlit_port: int = 8501

    # CORS - Add your frontend URL in production
    cors_origins: list = ["*"]  # Configure in production: ["https://your-frontend.railway.app"]

    @property
    def model_path(self) -> Path:
        """Get the full path to the trained model."""
        return self.models_dir / f"{self.model_name}_{self.model_version}.joblib"

    @property
    def preprocessor_path(self) -> Path:
        """Get the full path to the preprocessor."""
        return self.models_dir / f"preprocessor_{self.model_version}.joblib"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
