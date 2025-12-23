"""
Prediction routes for churn analysis.
"""
import io
import json
from typing import List, Optional
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from config.settings import settings
from src.api.database import get_db, User, PredictionLog
from src.api.models import (
    CustomerPredictionInput,
    PredictionResult,
    BatchPredictionResult,
    BatchPredictionInput
)
from src.api.auth import get_current_active_user
from src.ml.predictor import get_predictor

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post("/single", response_model=PredictionResult)
async def predict_single_customer(
    customer: CustomerPredictionInput,
    customer_id: Optional[str] = Query(None, description="Optional customer identifier"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Make a churn prediction for a single customer.

    Returns churn probability, risk level, and personalized recommendations.
    """
    predictor = get_predictor()

    if not predictor.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please train the model first."
        )

    try:
        result = predictor.predict_single(customer, customer_id)

        # Log prediction
        log_entry = PredictionLog(
            user_id=current_user.id,
            customer_id=customer_id,
            input_data=json.dumps(customer.model_dump()),
            churn_probability=result.churn_probability,
            risk_level=result.risk_level.value,
            will_churn=result.will_churn,
            feature_importance=json.dumps(result.feature_importance),
            recommendations=json.dumps([r.model_dump() for r in result.recommendations])
        )
        db.add(log_entry)
        await db.commit()

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/batch", response_model=BatchPredictionResult)
async def predict_batch_customers(
    batch_input: BatchPredictionInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Make churn predictions for multiple customers.

    Maximum batch size: 1000 customers.
    """
    if len(batch_input.customers) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum batch size is 1000 customers"
        )

    predictor = get_predictor()

    if not predictor.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please train the model first."
        )

    try:
        result = predictor.predict_batch(batch_input.customers)

        # Log batch prediction summary
        log_entry = PredictionLog(
            user_id=current_user.id,
            customer_id=f"BATCH_{len(batch_input.customers)}",
            input_data=json.dumps({"batch_size": len(batch_input.customers)}),
            churn_probability=result.average_churn_probability,
            risk_level="BATCH",
            will_churn=result.high_risk_count > 0,
            feature_importance=None,
            recommendations=None
        )
        db.add(log_entry)
        await db.commit()

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )


@router.post("/upload", response_model=BatchPredictionResult)
async def predict_from_file(
    file: UploadFile = File(..., description="CSV or Excel file with customer data"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a CSV/Excel file and get predictions for all customers.

    File must contain columns matching the expected customer features.
    Maximum file size: 10MB, Maximum rows: 10,000.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    allowed_extensions = ['.csv', '.xlsx', '.xls']
    file_ext = '.' + file.filename.split('.')[-1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )

    # Read file content
    try:
        content = await file.read()

        if len(content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )

        # Parse file
        if file_ext == '.csv':
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))

        if len(df) > 10000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File exceeds 10,000 row limit"
            )

        if len(df) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File contains no data"
            )

    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty or invalid"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse file: {str(e)}"
        )

    # Make predictions
    predictor = get_predictor()

    if not predictor.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please train the model first."
        )

    try:
        result = predictor.predict_from_dataframe(df)

        # Log upload prediction
        log_entry = PredictionLog(
            user_id=current_user.id,
            customer_id=f"FILE_{file.filename}",
            input_data=json.dumps({
                "filename": file.filename,
                "rows": len(df),
                "columns": list(df.columns)
            }),
            churn_probability=result.average_churn_probability,
            risk_level="FILE_UPLOAD",
            will_churn=result.high_risk_count > 0,
            feature_importance=None,
            recommendations=None
        )
        db.add(log_entry)
        await db.commit()

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.get("/history", response_model=List[dict])
async def get_prediction_history(
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get prediction history for the current user.
    """
    query = (
        select(PredictionLog)
        .where(PredictionLog.user_id == current_user.id)
        .order_by(PredictionLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        {
            "id": log.id,
            "customer_id": log.customer_id,
            "churn_probability": log.churn_probability,
            "risk_level": log.risk_level,
            "will_churn": log.will_churn,
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]


@router.get("/stats")
async def get_prediction_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get prediction statistics for the current user.
    """
    # Total predictions
    total_query = select(func.count(PredictionLog.id)).where(
        PredictionLog.user_id == current_user.id
    )
    total_result = await db.execute(total_query)
    total_predictions = total_result.scalar() or 0

    # High risk predictions
    high_risk_query = select(func.count(PredictionLog.id)).where(
        PredictionLog.user_id == current_user.id,
        PredictionLog.risk_level.in_(["High", "Critical", "HIGH", "CRITICAL"])
    )
    high_risk_result = await db.execute(high_risk_query)
    high_risk_count = high_risk_result.scalar() or 0

    # Average churn probability
    avg_query = select(func.avg(PredictionLog.churn_probability)).where(
        PredictionLog.user_id == current_user.id
    )
    avg_result = await db.execute(avg_query)
    avg_probability = avg_result.scalar() or 0

    return {
        "total_predictions": total_predictions,
        "high_risk_count": high_risk_count,
        "average_churn_probability": round(float(avg_probability), 4),
        "user": current_user.username
    }
