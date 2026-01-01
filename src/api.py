"""
FastAPI Backend - Exposes our ML model as a REST API.
This is the INTERFACE between our model and the outside world.

IMPROVED: Now with more features, XGBoost, and metrics endpoint!
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Handle imports for both local run and Docker
try:
    from model import ChurnModel
    from load_data import load_telco_data, prepare_data
except ImportError:
    from src.model import ChurnModel
    from src.load_data import load_telco_data, prepare_data

# ============================================================
# Create FastAPI app
# ============================================================

app = FastAPI(
    title="ChurnShield AI",
    description="Predict customer churn using XGBoost machine learning",
    version="2.0.0"  # Updated version!
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Pydantic schemas (request/response models)
# ============================================================


class CustomerInput(BaseModel):
    """
    IMPROVED: Now accepts more customer features for better predictions!
    """
    # Demographics
    gender: str = "Male"                    # Male/Female
    SeniorCitizen: int = 0                  # 0 or 1
    Partner: str = "No"                     # Yes/No
    Dependents: str = "No"                  # Yes/No

    # Account info
    tenure: int                             # Months with company
    Contract: str                           # Month-to-month, One year, Two year
    PaperlessBilling: str = "Yes"           # Yes/No
    PaymentMethod: str                      # Payment method

    # Services
    InternetService: str = "Fiber optic"    # DSL, Fiber optic, No
    OnlineSecurity: str = "No"              # Yes/No/No internet service
    TechSupport: str = "No"                 # Yes/No/No internet service

    # Charges
    MonthlyCharges: float
    TotalCharges: float

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "gender": "Female",
                    "SeniorCitizen": 0,
                    "Partner": "No",
                    "Dependents": "No",
                    "tenure": 12,
                    "Contract": "Month-to-month",
                    "PaperlessBilling": "Yes",
                    "PaymentMethod": "Electronic check",
                    "InternetService": "Fiber optic",
                    "OnlineSecurity": "No",
                    "TechSupport": "No",
                    "MonthlyCharges": 75.50,
                    "TotalCharges": 906.00
                }
            ]
        }
    }


class PredictionResponse(BaseModel):
    """Prediction result."""
    churn_probability: float
    risk_level: str
    will_churn: bool


class MetricsResponse(BaseModel):
    """Model performance metrics."""
    accuracy: float
    train_samples: int
    test_samples: int
    total_samples: int
    feature_importance: dict


# ============================================================
# Initialize and train model on startup
# ============================================================

print("Initializing ChurnShield AI v2.0...")
model = ChurnModel()

print("Loading training data...")
raw_data = load_telco_data()
training_data = prepare_data(raw_data)

print("Training XGBoost model...")
model.train(training_data)
print("Model ready!")


# ============================================================
# API Endpoints
# ============================================================


@app.get("/")
def root():
    """Root endpoint - API info."""
    return {
        "message": "Welcome to ChurnShield AI!",
        "version": "2.0.0",
        "model": "XGBoost",
        "features": 13,
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check with model status."""
    return {
        "status": "healthy",
        "model_trained": model.is_trained,
        "accuracy": model.metrics.get('accuracy', 0)
    }


@app.get("/metrics", response_model=MetricsResponse)
def get_metrics():
    """
    NEW: Get model performance metrics and feature importance.
    This helps understand how well the model is performing!
    """
    if not model.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained")

    return MetricsResponse(
        accuracy=model.metrics.get('accuracy', 0),
        train_samples=model.metrics.get('train_samples', 0),
        test_samples=model.metrics.get('test_samples', 0),
        total_samples=model.metrics.get('total_samples', 0),
        feature_importance=model.get_feature_importance()
    )


@app.post("/predict", response_model=PredictionResponse)
def predict_churn(customer: CustomerInput):
    """
    Predict churn for a customer.
    Now with 13 features for better accuracy!
    """
    if not model.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained")

    customer_data = customer.model_dump()

    try:
        result = model.predict(customer_data)
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")


# ============================================================
# Run server
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
