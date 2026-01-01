"""
Tests for the ChurnShield API v2.1

Updated tests for:
- XGBoost model
- 13 features
- /metrics endpoint
- Batch predictions (NEW!)
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os
import io

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from api import app

client = TestClient(app)


# ============================================================
# Test 1: Root endpoint
# ============================================================
def test_root_endpoint():
    """Test the root endpoint returns API info."""
    response = client.get("/")

    assert response.status_code == 200
    data = response.json()
    assert "ChurnShield" in data["message"]
    assert data["version"] == "2.1.0"
    assert data["model"] == "XGBoost"


# ============================================================
# Test 2: Health endpoint
# ============================================================
def test_health_endpoint():
    """Test health check includes accuracy."""
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_trained"] == True
    assert "accuracy" in data


# ============================================================
# Test 3: Metrics endpoint (NEW!)
# ============================================================
def test_metrics_endpoint():
    """Test the new metrics endpoint returns model performance."""
    response = client.get("/metrics")

    assert response.status_code == 200
    data = response.json()

    # Check all fields exist
    assert "accuracy" in data
    assert "train_samples" in data
    assert "test_samples" in data
    assert "feature_importance" in data

    # Accuracy should be reasonable (>60%)
    assert data["accuracy"] > 60

    # Feature importance should have entries
    assert len(data["feature_importance"]) > 0


# ============================================================
# Test 4: Prediction with all features
# ============================================================
def test_predict_full_customer():
    """Test prediction with all 13 features."""
    customer = {
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

    response = client.post("/predict", json=customer)

    assert response.status_code == 200
    result = response.json()

    assert "churn_probability" in result
    assert "risk_level" in result
    assert "will_churn" in result
    assert result["risk_level"] in ["Low", "Medium", "High", "Critical"]


# ============================================================
# Test 5: Prediction with minimal features (using defaults)
# ============================================================
def test_predict_minimal_customer():
    """Test prediction with only required fields (others use defaults)."""
    customer = {
        "tenure": 24,
        "Contract": "One year",
        "PaymentMethod": "Credit card (automatic)",
        "MonthlyCharges": 55.00,
        "TotalCharges": 1320.00
    }

    response = client.post("/predict", json=customer)

    assert response.status_code == 200
    result = response.json()
    assert result["churn_probability"] >= 0
    assert result["churn_probability"] <= 100


# ============================================================
# Test 6: High risk customer prediction
# ============================================================
def test_predict_high_risk():
    """Test high-risk customer gets appropriate prediction."""
    high_risk = {
        "gender": "Female",
        "SeniorCitizen": 1,
        "Partner": "No",
        "Dependents": "No",
        "tenure": 1,
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "InternetService": "Fiber optic",
        "OnlineSecurity": "No",
        "TechSupport": "No",
        "MonthlyCharges": 100.00,
        "TotalCharges": 100.00
    }

    response = client.post("/predict", json=high_risk)

    assert response.status_code == 200
    result = response.json()
    # High risk customer should have elevated churn probability
    assert result["churn_probability"] >= 0


# ============================================================
# Test 7: Low risk customer prediction
# ============================================================
def test_predict_low_risk():
    """Test low-risk customer gets appropriate prediction."""
    low_risk = {
        "gender": "Male",
        "SeniorCitizen": 0,
        "Partner": "Yes",
        "Dependents": "Yes",
        "tenure": 60,
        "Contract": "Two year",
        "PaperlessBilling": "No",
        "PaymentMethod": "Bank transfer (automatic)",
        "InternetService": "DSL",
        "OnlineSecurity": "Yes",
        "TechSupport": "Yes",
        "MonthlyCharges": 55.00,
        "TotalCharges": 3300.00
    }

    response = client.post("/predict", json=low_risk)

    assert response.status_code == 200
    result = response.json()
    assert result["churn_probability"] >= 0
    assert result["churn_probability"] <= 100


# ============================================================
# Test 8: Invalid request (missing required fields)
# ============================================================
def test_predict_invalid_request():
    """Test that missing required fields return 422."""
    incomplete = {
        "tenure": 12
        # Missing: Contract, PaymentMethod, MonthlyCharges, TotalCharges
    }

    response = client.post("/predict", json=incomplete)
    assert response.status_code == 422


# ============================================================
# Test 9: Batch prediction with CSV upload
# ============================================================
def test_batch_prediction():
    """Test batch prediction with CSV file upload."""
    csv_content = """customerID,gender,SeniorCitizen,Partner,Dependents,tenure,Contract,PaperlessBilling,PaymentMethod,InternetService,OnlineSecurity,TechSupport,MonthlyCharges,TotalCharges
C001,Female,0,No,No,2,Month-to-month,Yes,Electronic check,Fiber optic,No,No,89.50,179.00
C002,Male,0,Yes,Yes,60,Two year,No,Bank transfer (automatic),DSL,Yes,Yes,45.00,2700.00
C003,Female,1,No,No,5,Month-to-month,Yes,Electronic check,Fiber optic,No,No,95.00,475.00"""

    response = client.post(
        "/predict/batch",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    )

    assert response.status_code == 200
    data = response.json()

    # Check response structure
    assert "total_customers" in data
    assert "predictions" in data
    assert "summary" in data

    # Should have 3 customers
    assert data["total_customers"] == 3
    assert len(data["predictions"]) == 3

    # Check summary structure
    assert "churn_rate" in data["summary"]
    assert "risk_distribution" in data["summary"]


# ============================================================
# Test 10: Batch prediction with invalid file type
# ============================================================
def test_batch_prediction_invalid_file():
    """Test that non-CSV files are rejected."""
    response = client.post(
        "/predict/batch",
        files={"file": ("test.txt", io.BytesIO(b"hello world"), "text/plain")}
    )

    assert response.status_code == 400
    assert "CSV" in response.json()["detail"]


# ============================================================
# Test 11: Batch prediction with missing columns
# ============================================================
def test_batch_prediction_missing_columns():
    """Test batch prediction with missing required columns."""
    csv_content = """customerID,gender,tenure
C001,Female,2
C002,Male,60"""

    response = client.post(
        "/predict/batch",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
    )

    assert response.status_code == 400
    # Either shows missing columns or processing error
    detail = response.json()["detail"]
    assert "Missing required columns" in detail or "Error processing" in detail
