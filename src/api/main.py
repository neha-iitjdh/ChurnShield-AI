"""
FastAPI main application for ChurnShield AI.
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config.settings import settings
from src.api.database import init_db
from src.api.routes import auth_router, predictions_router, analytics_router
from src.api.models import HealthCheck
from src.ml.predictor import get_predictor

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting ChurnShield AI API...")

    # Initialize database
    logger.info("Initializing database...")
    await init_db()

    # Try to load the model
    logger.info("Loading ML model...")
    try:
        predictor = get_predictor()
        if predictor.is_loaded():
            logger.info("ML model loaded successfully")
        else:
            logger.warning("ML model not available - train model first")
    except Exception as e:
        logger.warning(f"Could not load ML model: {e}")

    logger.info("ChurnShield AI API started successfully")

    yield

    # Shutdown
    logger.info("Shutting down ChurnShield AI API...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="""
    ## ChurnShield AI - Customer Churn Prediction Platform

    A production-grade machine learning platform for predicting customer churn
    in telecom services and providing actionable retention recommendations.

    ### Features
    - **Single & Batch Predictions**: Get churn probability for individual customers or bulk uploads
    - **Risk Assessment**: Automatic risk level classification (Low, Medium, High, Critical)
    - **Smart Recommendations**: AI-generated retention strategies based on customer profile
    - **Analytics Dashboard**: Track prediction trends and model performance
    - **Secure Authentication**: JWT-based user authentication with role-based access

    ### Getting Started
    1. Register a new user account at `/api/v1/auth/register`
    2. Login to get your access token at `/api/v1/auth/login`
    3. Use the token to make predictions at `/api/v1/predictions/single`

    ### API Documentation
    - Swagger UI: `/docs`
    - ReDoc: `/redoc`
    """,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred",
            "type": type(exc).__name__
        }
    )


# Include routers
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(predictions_router, prefix=settings.api_prefix)
app.include_router(analytics_router, prefix=settings.api_prefix)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "Customer Churn Prediction Platform",
        "docs": "/docs",
        "health": "/health"
    }


# Health check endpoint
@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring.

    Returns the status of the API, model, and database.
    """
    predictor = get_predictor()
    model_loaded = predictor.is_loaded() if predictor else False

    # Check database (simple check)
    db_connected = True  # Would add actual check in production

    return HealthCheck(
        status="healthy" if model_loaded and db_connected else "degraded",
        version=settings.app_version,
        model_loaded=model_loaded,
        database_connected=db_connected,
        timestamp=datetime.utcnow()
    )


# Ready endpoint for Kubernetes
@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check for container orchestration."""
    predictor = get_predictor()

    if predictor and predictor.is_loaded():
        return {"status": "ready"}
    else:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not ready", "reason": "Model not loaded"}
        )


# Liveness endpoint for Kubernetes
@app.get("/live", tags=["Health"])
async def liveness_check():
    """Liveness check for container orchestration."""
    return {"status": "alive"}


def run_server():
    """Run the API server."""
    uvicorn.run(
        "src.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )


if __name__ == "__main__":
    run_server()
