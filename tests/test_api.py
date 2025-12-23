"""Tests for FastAPI endpoints."""
import sys
from pathlib import Path

import pytest
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.api.main import app


class TestHealthEndpoints:
    """Test health check endpoints."""

    @pytest.mark.asyncio
    async def test_root_endpoint(self):
        """Test root endpoint."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert data["name"] == "ChurnShield AI"

    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        """Test health check endpoint."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "model_loaded" in data
        assert "database_connected" in data

    @pytest.mark.asyncio
    async def test_live_endpoint(self):
        """Test liveness check endpoint."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/live")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"


class TestAuthEndpoints:
    """Test authentication endpoints."""

    @pytest.mark.asyncio
    async def test_register_user(self):
        """Test user registration."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": "test@example.com",
                    "username": "testuser",
                    "password": "testpassword123",
                    "full_name": "Test User"
                }
            )

        # May fail if user already exists, that's ok
        assert response.status_code in [201, 400]

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/auth/login",
                data={
                    "username": "nonexistent",
                    "password": "wrongpassword"
                }
            )

        assert response.status_code == 401


class TestPredictionEndpoints:
    """Test prediction endpoints."""

    @pytest.mark.asyncio
    async def test_single_prediction_unauthorized(self):
        """Test that prediction requires authentication."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/predictions/single",
                json={
                    "gender": "Male",
                    "SeniorCitizen": 0,
                    "Partner": "No",
                    "Dependents": "No",
                    "tenure": 12,
                    "PhoneService": "Yes",
                    "MultipleLines": "No",
                    "InternetService": "Fiber optic",
                    "OnlineSecurity": "No",
                    "OnlineBackup": "No",
                    "DeviceProtection": "No",
                    "TechSupport": "No",
                    "StreamingTV": "No",
                    "StreamingMovies": "No",
                    "Contract": "Month-to-month",
                    "PaperlessBilling": "Yes",
                    "PaymentMethod": "Electronic check",
                    "MonthlyCharges": 70.0,
                    "TotalCharges": 840.0
                }
            )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_batch_prediction_unauthorized(self):
        """Test that batch prediction requires authentication."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/predictions/batch",
                json={"customers": []}
            )

        assert response.status_code == 401


class TestAnalyticsEndpoints:
    """Test analytics endpoints."""

    @pytest.mark.asyncio
    async def test_dashboard_unauthorized(self):
        """Test that dashboard requires authentication."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/api/v1/analytics/dashboard")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_model_metrics_unauthorized(self):
        """Test that model metrics requires authentication."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/api/v1/analytics/model/metrics")

        assert response.status_code == 401
