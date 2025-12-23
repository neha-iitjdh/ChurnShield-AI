"""API routes package."""
from .auth import router as auth_router
from .predictions import router as predictions_router
from .analytics import router as analytics_router

__all__ = ["auth_router", "predictions_router", "analytics_router"]
