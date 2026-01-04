"""
FastAPI Backend - ChurnShield AI v2.2

Features:
- Single customer prediction
- Batch predictions (CSV upload)
- Model metrics and feature importance
- Risk distribution analytics
- Prediction history (NEW!)
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import io
import os
import threading

# Handle imports for both local run and Docker
try:
    from model import ChurnModel
    from load_data import load_telco_data, prepare_data
    from database import save_prediction, get_predictions, get_prediction_stats, delete_prediction, clear_history
except ImportError:
    from src.model import ChurnModel
    from src.load_data import load_telco_data, prepare_data
    from src.database import save_prediction, get_predictions, get_prediction_stats, delete_prediction, clear_history

# ============================================================
# Global model instance (loaded from pre-trained file)
# ============================================================
model: ChurnModel = None
model_loading = False


def init_model():
    """Load pre-trained model from file."""
    global model, model_loading
    import os
    model_loading = True
    print("Initializing ChurnShield AI v2.2...")

    # Find model file path
    model_path = os.path.join(os.path.dirname(__file__), "churn_model.joblib")

    if os.path.exists(model_path):
        print(f"Loading pre-trained model from {model_path}...")
        model = ChurnModel()
        model.load(model_path)
        print(f"Model loaded! Accuracy: {model.metrics.get('accuracy', 0)}%")
    else:
        print(f"WARNING: Model file not found at {model_path}")
        print("Training model from scratch...")
        model = ChurnModel()
        raw_data = load_telco_data()
        training_data = prepare_data(raw_data)
        model.train(training_data)
        print("Model trained!")

    model_loading = False
    print("Model ready!")


# ============================================================
# Create FastAPI app
# ============================================================

app = FastAPI(
    title="ChurnShield AI",
    description="Predict customer churn using XGBoost ML - With batch predictions & history!",
    version="2.2.0"
)

# Start model initialization in background thread (skip during tests)
if os.environ.get("TESTING") != "1":
    threading.Thread(target=init_model, daemon=True).start()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Pydantic schemas
# ============================================================


class CustomerInput(BaseModel):
    """Single customer input for prediction."""
    gender: str = "Male"
    SeniorCitizen: int = 0
    Partner: str = "No"
    Dependents: str = "No"
    tenure: int
    Contract: str
    PaperlessBilling: str = "Yes"
    PaymentMethod: str
    InternetService: str = "Fiber optic"
    OnlineSecurity: str = "No"
    TechSupport: str = "No"
    MonthlyCharges: float
    TotalCharges: float


class PredictionResponse(BaseModel):
    """Single prediction result."""
    churn_probability: float
    risk_level: str
    will_churn: bool


class BatchPredictionItem(BaseModel):
    """Individual item in batch prediction result."""
    customer_id: Optional[str] = None
    churn_probability: float
    risk_level: str
    will_churn: bool


class BatchPredictionResponse(BaseModel):
    """Batch prediction results with analytics."""
    total_customers: int
    predictions: List[BatchPredictionItem]
    summary: dict  # Risk distribution summary


class MetricsResponse(BaseModel):
    """Model metrics and feature importance."""
    accuracy: float
    train_samples: int
    test_samples: int
    total_samples: int
    feature_importance: dict


class HistoryItem(BaseModel):
    """Single prediction history item."""
    id: int
    customer_id: Optional[str]
    customer_data: dict
    churn_probability: float
    risk_level: str
    will_churn: bool
    prediction_type: str
    created_at: str


class HistoryResponse(BaseModel):
    """Prediction history response."""
    predictions: List[HistoryItem]
    total: int


class HistoryStatsResponse(BaseModel):
    """Prediction history statistics."""
    total_predictions: int
    overall_churn_rate: float
    average_probability: float
    risk_distribution: dict
    recent_trend: List[dict]




# ============================================================
# API Endpoints
# ============================================================


@app.get("/")
def root():
    """Root endpoint - API info."""
    return {
        "message": "Welcome to ChurnShield AI!",
        "version": "2.2.0",
        "model": "XGBoost",
        "features": 13,
        "endpoints": {
            "predict": "/predict (POST) - Single customer",
            "batch": "/predict/batch (POST) - CSV upload",
            "metrics": "/metrics (GET) - Model performance",
            "history": "/history (GET) - Prediction history",
            "stats": "/history/stats (GET) - History statistics",
            "docs": "/docs - API documentation"
        }
    }


@app.get("/health")
def health_check():
    """Health check with model status."""
    if model is None:
        return {
            "status": "starting",
            "model_trained": False,
            "model_loading": model_loading,
            "accuracy": 0
        }
    return {
        "status": "healthy",
        "model_trained": model.is_trained,
        "model_loading": model_loading,
        "accuracy": model.metrics.get('accuracy', 0)
    }


@app.get("/metrics", response_model=MetricsResponse)
def get_metrics():
    """Get model performance metrics and feature importance."""
    if model is None or not model.is_trained:
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
    """Predict churn for a single customer."""
    if model is None or not model.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained")

    try:
        customer_data = customer.model_dump()
        result = model.predict(customer_data)

        # Save to history
        save_prediction(
            customer_data=customer_data,
            churn_probability=result['churn_probability'],
            risk_level=result['risk_level'],
            will_churn=result['will_churn'],
            prediction_type='single'
        )

        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(file: UploadFile = File(...)):
    """
    Batch prediction - Upload a CSV file with customer data.

    CSV should have columns: gender, SeniorCitizen, Partner, Dependents,
    tenure, Contract, PaperlessBilling, PaymentMethod, InternetService,
    OnlineSecurity, TechSupport, MonthlyCharges, TotalCharges

    Optional: customerID column for tracking
    """
    if model is None or not model.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained")

    # Check file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        # Read CSV content
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))

        # Check for customer ID column
        has_customer_id = 'customerID' in df.columns or 'customer_id' in df.columns
        id_column = 'customerID' if 'customerID' in df.columns else 'customer_id' if 'customer_id' in df.columns else None

        # Required columns (excluding optional ones with defaults)
        required_cols = ['tenure', 'Contract', 'PaymentMethod', 'MonthlyCharges', 'TotalCharges']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_cols}"
            )

        # Default values for optional columns
        defaults = {
            'gender': 'Male',
            'SeniorCitizen': 0,
            'Partner': 'No',
            'Dependents': 'No',
            'PaperlessBilling': 'Yes',
            'InternetService': 'Fiber optic',
            'OnlineSecurity': 'No',
            'TechSupport': 'No'
        }

        for col, default_val in defaults.items():
            if col not in df.columns:
                df[col] = default_val

        # Make predictions
        predictions = []
        risk_counts = {'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0}

        for idx, row in df.iterrows():
            customer_data = {
                'gender': row.get('gender', 'Male'),
                'SeniorCitizen': int(row.get('SeniorCitizen', 0)),
                'Partner': row.get('Partner', 'No'),
                'Dependents': row.get('Dependents', 'No'),
                'tenure': int(row['tenure']),
                'Contract': row['Contract'],
                'PaperlessBilling': row.get('PaperlessBilling', 'Yes'),
                'PaymentMethod': row['PaymentMethod'],
                'InternetService': row.get('InternetService', 'Fiber optic'),
                'OnlineSecurity': row.get('OnlineSecurity', 'No'),
                'TechSupport': row.get('TechSupport', 'No'),
                'MonthlyCharges': float(row['MonthlyCharges']),
                'TotalCharges': float(row['TotalCharges'])
            }

            result = model.predict(customer_data)
            risk_counts[result['risk_level']] += 1

            customer_id_str = str(row[id_column]) if id_column else f"row_{idx}"

            # Save to history
            save_prediction(
                customer_data=customer_data,
                churn_probability=result['churn_probability'],
                risk_level=result['risk_level'],
                will_churn=result['will_churn'],
                customer_id=customer_id_str,
                prediction_type='batch'
            )

            predictions.append(BatchPredictionItem(
                customer_id=customer_id_str,
                churn_probability=result['churn_probability'],
                risk_level=result['risk_level'],
                will_churn=result['will_churn']
            ))

        # Calculate summary statistics
        total = len(predictions)
        churn_count = sum(1 for p in predictions if p.will_churn)
        avg_probability = sum(p.churn_probability for p in predictions) / total if total > 0 else 0

        summary = {
            'total_customers': total,
            'predicted_churners': churn_count,
            'churn_rate': round(churn_count / total * 100, 2) if total > 0 else 0,
            'average_churn_probability': round(avg_probability, 2),
            'risk_distribution': risk_counts
        }

        return BatchPredictionResponse(
            total_customers=total,
            predictions=predictions,
            summary=summary
        )

    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")


# ============================================================
# History Endpoints
# ============================================================


@app.get("/history", response_model=HistoryResponse)
def get_history(limit: int = 50, offset: int = 0):
    """Get prediction history with pagination."""
    predictions = get_predictions(limit=limit, offset=offset)
    return HistoryResponse(
        predictions=predictions,
        total=len(predictions)
    )


@app.get("/history/stats", response_model=HistoryStatsResponse)
def get_history_stats():
    """Get prediction history statistics."""
    stats = get_prediction_stats()
    return HistoryStatsResponse(**stats)


@app.delete("/history/{prediction_id}")
def delete_history_item(prediction_id: int):
    """Delete a single prediction from history."""
    if delete_prediction(prediction_id):
        return {"message": "Prediction deleted", "id": prediction_id}
    raise HTTPException(status_code=404, detail="Prediction not found")


@app.delete("/history")
def clear_all_history():
    """Clear all prediction history."""
    count = clear_history()
    return {"message": "History cleared", "deleted_count": count}


# ============================================================
# Run server
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
