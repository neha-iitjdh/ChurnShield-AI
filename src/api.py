"""
FastAPI Backend - Exposes our ML model as a REST API.
This is the INTERFACE between our model and the outside world.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Handle imports for both local run and Docker
try:
    # When running from src/ folder: python api.py
    from model import ChurnModel
    from load_data import load_telco_data, prepare_data
except ImportError:
    # When running from root with module: python -m uvicorn src.api:app
    from src.model import ChurnModel
    from src.load_data import load_telco_data, prepare_data

# ============================================================
# Step 1: Create FastAPI app
# ============================================================
# FastAPI() creates our web application
# It handles HTTP requests (GET, POST) and returns responses

app = FastAPI(
    title="ChurnShield AI",
    description="Predict customer churn using machine learning",
    version="1.0.0"
)

# ============================================================
# Step 2: Define request/response schemas using Pydantic
# ============================================================
# Pydantic models define WHAT data the API expects and returns
# This gives us automatic validation and documentation!


class CustomerInput(BaseModel):
    """
    What the API expects when you send a prediction request.
    These fields match what our ML model needs.
    """
    tenure: int                  # Months as customer
    MonthlyCharges: float        # Monthly bill amount
    TotalCharges: float          # Total amount paid
    Contract: str                # 'Month-to-month', 'One year', 'Two year'
    PaymentMethod: str           # Payment method

    # Example for API documentation
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tenure": 12,
                    "MonthlyCharges": 65.50,
                    "TotalCharges": 786.00,
                    "Contract": "Month-to-month",
                    "PaymentMethod": "Electronic check"
                }
            ]
        }
    }


class PredictionResponse(BaseModel):
    """
    What the API returns after making a prediction.
    """
    churn_probability: float     # 0-100 percentage
    risk_level: str              # Low, Medium, High, Critical
    will_churn: bool             # True if probability >= 50%


# ============================================================
# Step 3: Create and train the model (on startup)
# ============================================================
# We train the model once when the server starts
# In production, we'd load a pre-trained model instead

print("Initializing ChurnShield AI...")
model = ChurnModel()

# Load real data and train
print("Loading training data...")
raw_data = load_telco_data()
training_data = prepare_data(raw_data)

print("Training model...")
model.train(training_data)
print("Model ready!")


# ============================================================
# Step 4: Define API endpoints (routes)
# ============================================================


@app.get("/")
def root():
    """
    Root endpoint - just confirms the API is running.
    GET request to http://localhost:8000/
    """
    return {
        "message": "Welcome to ChurnShield AI!",
        "status": "running",
        "docs": "Visit /docs for API documentation"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint - useful for monitoring.
    GET request to http://localhost:8000/health
    """
    return {
        "status": "healthy",
        "model_trained": model.is_trained
    }


@app.post("/predict", response_model=PredictionResponse)
def predict_churn(customer: CustomerInput):
    """
    Main prediction endpoint.
    POST request to http://localhost:8000/predict

    Send customer data, get churn prediction back!
    """
    # Check if model is ready
    if not model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Please wait."
        )

    # Convert Pydantic model to dict (what our ML model expects)
    customer_data = customer.model_dump()

    # Make prediction
    try:
        result = model.predict(customer_data)
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Prediction failed: {str(e)}"
        )


# ============================================================
# Step 5: Run the server (when file is executed directly)
# ============================================================

if __name__ == "__main__":
    import uvicorn

    # uvicorn runs our FastAPI app
    # host="0.0.0.0" makes it accessible from other devices
    # port=8000 is the default FastAPI port
    uvicorn.run(app, host="0.0.0.0", port=8000)
