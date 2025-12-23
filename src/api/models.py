"""
Pydantic models for API request/response schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ============ Enums ============

class ContractType(str, Enum):
    MONTH_TO_MONTH = "Month-to-month"
    ONE_YEAR = "One year"
    TWO_YEAR = "Two year"


class PaymentMethod(str, Enum):
    ELECTRONIC_CHECK = "Electronic check"
    MAILED_CHECK = "Mailed check"
    BANK_TRANSFER = "Bank transfer (automatic)"
    CREDIT_CARD = "Credit card (automatic)"


class InternetService(str, Enum):
    DSL = "DSL"
    FIBER_OPTIC = "Fiber optic"
    NO = "No"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


# ============ Customer Models ============

class CustomerBase(BaseModel):
    """Base customer model with common fields."""
    customer_id: Optional[str] = Field(None, description="Unique customer identifier")
    gender: str = Field(..., pattern="^(Male|Female)$")
    senior_citizen: int = Field(..., ge=0, le=1, alias="SeniorCitizen")
    partner: str = Field(..., pattern="^(Yes|No)$", alias="Partner")
    dependents: str = Field(..., pattern="^(Yes|No)$", alias="Dependents")
    tenure: int = Field(..., ge=0, description="Number of months with the company")
    phone_service: str = Field(..., pattern="^(Yes|No)$", alias="PhoneService")
    multiple_lines: str = Field(..., alias="MultipleLines")
    internet_service: str = Field(..., alias="InternetService")
    online_security: str = Field(..., alias="OnlineSecurity")
    online_backup: str = Field(..., alias="OnlineBackup")
    device_protection: str = Field(..., alias="DeviceProtection")
    tech_support: str = Field(..., alias="TechSupport")
    streaming_tv: str = Field(..., alias="StreamingTV")
    streaming_movies: str = Field(..., alias="StreamingMovies")
    contract: str = Field(..., alias="Contract")
    paperless_billing: str = Field(..., pattern="^(Yes|No)$", alias="PaperlessBilling")
    payment_method: str = Field(..., alias="PaymentMethod")
    monthly_charges: float = Field(..., ge=0, alias="MonthlyCharges")
    total_charges: float = Field(..., ge=0, alias="TotalCharges")

    model_config = ConfigDict(populate_by_name=True)


class CustomerCreate(CustomerBase):
    """Model for creating a new customer record."""
    pass


class CustomerPredictionInput(BaseModel):
    """Model for single customer prediction input."""
    gender: str = "Male"
    SeniorCitizen: int = Field(0, ge=0, le=1)
    Partner: str = "No"
    Dependents: str = "No"
    tenure: int = Field(1, ge=0)
    PhoneService: str = "Yes"
    MultipleLines: str = "No"
    InternetService: str = "Fiber optic"
    OnlineSecurity: str = "No"
    OnlineBackup: str = "No"
    DeviceProtection: str = "No"
    TechSupport: str = "No"
    StreamingTV: str = "No"
    StreamingMovies: str = "No"
    Contract: str = "Month-to-month"
    PaperlessBilling: str = "Yes"
    PaymentMethod: str = "Electronic check"
    MonthlyCharges: float = Field(70.0, ge=0)
    TotalCharges: float = Field(70.0, ge=0)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "gender": "Female",
                "SeniorCitizen": 0,
                "Partner": "Yes",
                "Dependents": "No",
                "tenure": 12,
                "PhoneService": "Yes",
                "MultipleLines": "No",
                "InternetService": "Fiber optic",
                "OnlineSecurity": "Yes",
                "OnlineBackup": "Yes",
                "DeviceProtection": "No",
                "TechSupport": "No",
                "StreamingTV": "Yes",
                "StreamingMovies": "No",
                "Contract": "One year",
                "PaperlessBilling": "Yes",
                "PaymentMethod": "Credit card (automatic)",
                "MonthlyCharges": 85.50,
                "TotalCharges": 1026.00
            }
        }
    )


class BatchPredictionInput(BaseModel):
    """Model for batch prediction input."""
    customers: List[CustomerPredictionInput]


# ============ Prediction Models ============

class Recommendation(BaseModel):
    """Retention recommendation model."""
    priority: int = Field(..., ge=1, le=5, description="Priority level (1=highest)")
    action: str = Field(..., description="Recommended action")
    description: str = Field(..., description="Detailed description")
    expected_impact: str = Field(..., description="Expected impact on retention")


class PredictionResult(BaseModel):
    """Single prediction result model."""
    customer_id: Optional[str] = None
    churn_probability: float = Field(..., ge=0, le=1)
    churn_risk_score: int = Field(..., ge=0, le=100, description="Risk score 0-100")
    risk_level: RiskLevel
    will_churn: bool
    confidence: float = Field(..., ge=0, le=1)
    feature_importance: Dict[str, float] = Field(default_factory=dict)
    recommendations: List[Recommendation] = Field(default_factory=list)
    prediction_timestamp: datetime = Field(default_factory=datetime.utcnow)


class BatchPredictionResult(BaseModel):
    """Batch prediction result model."""
    total_customers: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    average_churn_probability: float
    predictions: List[PredictionResult]
    processing_time_ms: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============ User/Auth Models ============

class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    is_active: bool = True
    role: str = "analyst"


class UserCreate(UserBase):
    """User creation model."""
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    """User response model (without password)."""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """JWT token model."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    username: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request model."""
    username: str
    password: str


# ============ Analytics Models ============

class ChurnAnalytics(BaseModel):
    """Churn analytics summary model."""
    total_customers: int
    churned_customers: int
    churn_rate: float
    average_tenure_churned: float
    average_tenure_retained: float
    top_churn_factors: List[Dict[str, Any]]
    monthly_trends: List[Dict[str, Any]]


class ModelMetrics(BaseModel):
    """Model performance metrics."""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    confusion_matrix: List[List[int]]
    training_date: datetime
    model_version: str


# ============ Report Models ============

class ReportRequest(BaseModel):
    """Report generation request."""
    report_type: str = Field(..., pattern="^(summary|detailed|executive)$")
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    include_recommendations: bool = True
    format: str = Field("pdf", pattern="^(pdf|csv|excel)$")


class HealthCheck(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str
    model_loaded: bool
    database_connected: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)
