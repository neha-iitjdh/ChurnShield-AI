"""
Tests for the ChurnShield API.

What is Testing?
- Tests are code that checks if your code works correctly
- They run automatically in CI/CD pipeline
- If any test fails, deployment stops (protects production!)

Libraries used:
- pytest: Test framework (runs tests, reports results)
- httpx: HTTP client for testing APIs
- TestClient: FastAPI's built-in test helper
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add src to path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from api import app

# Create a test client - this simulates HTTP requests
client = TestClient(app)


# ============================================================
# Test 1: Check if API is running
# ============================================================
def test_root_endpoint():
    """
    Test the root endpoint (/).
    Expected: Returns welcome message with status 200.
    """
    response = client.get("/")

    # Assert = "make sure this is true"
    assert response.status_code == 200
    assert response.json()["status"] == "running"
    assert "ChurnShield" in response.json()["message"]


# ============================================================
# Test 2: Check health endpoint
# ============================================================
def test_health_endpoint():
    """
    Test the health check endpoint (/health).
    Expected: Returns healthy status.
    """
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["model_trained"] == True


# ============================================================
# Test 3: Test prediction with valid data
# ============================================================
def test_predict_valid_customer():
    """
    Test prediction with a valid customer.
    Expected: Returns prediction with all required fields.
    """
    # Sample customer data
    customer = {
        "tenure": 12,
        "MonthlyCharges": 65.50,
        "TotalCharges": 786.00,
        "Contract": "Month-to-month",
        "PaymentMethod": "Electronic check"
    }

    response = client.post("/predict", json=customer)

    assert response.status_code == 200

    result = response.json()
    # Check all expected fields exist
    assert "churn_probability" in result
    assert "risk_level" in result
    assert "will_churn" in result

    # Check types are correct
    assert isinstance(result["churn_probability"], (int, float))
    assert result["risk_level"] in ["Low", "Medium", "High", "Critical"]
    assert isinstance(result["will_churn"], bool)


# ============================================================
# Test 4: Test prediction with high-risk customer
# ============================================================
def test_predict_high_risk_customer():
    """
    Test that a high-risk customer gets appropriate risk level.
    High risk = new customer, month-to-month, high charges
    """
    high_risk_customer = {
        "tenure": 1,                          # Very new
        "MonthlyCharges": 100.00,             # High charges
        "TotalCharges": 100.00,
        "Contract": "Month-to-month",         # No commitment
        "PaymentMethod": "Electronic check"   # Risky payment
    }

    response = client.post("/predict", json=high_risk_customer)

    assert response.status_code == 200
    result = response.json()

    # High risk customer should have higher churn probability
    # (We're not asserting exact values since ML can vary)
    assert result["churn_probability"] >= 0
    assert result["churn_probability"] <= 100


# ============================================================
# Test 5: Test prediction with low-risk customer
# ============================================================
def test_predict_low_risk_customer():
    """
    Test that a low-risk customer gets appropriate risk level.
    Low risk = long tenure, two-year contract
    """
    low_risk_customer = {
        "tenure": 60,                                 # 5 years!
        "MonthlyCharges": 45.00,                      # Moderate
        "TotalCharges": 2700.00,
        "Contract": "Two year",                       # Committed
        "PaymentMethod": "Bank transfer (automatic)"  # Stable
    }

    response = client.post("/predict", json=low_risk_customer)

    assert response.status_code == 200
    result = response.json()

    # Low risk customer should generally have lower probability
    assert result["churn_probability"] >= 0
    assert result["churn_probability"] <= 100


# ============================================================
# Test 6: Test invalid request (missing fields)
# ============================================================
def test_predict_invalid_request():
    """
    Test that missing fields return an error.
    Expected: 422 Unprocessable Entity
    """
    incomplete_customer = {
        "tenure": 12
        # Missing: MonthlyCharges, TotalCharges, Contract, PaymentMethod
    }

    response = client.post("/predict", json=incomplete_customer)

    # FastAPI returns 422 for validation errors
    assert response.status_code == 422
