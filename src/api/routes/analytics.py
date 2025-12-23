"""
Analytics routes for churn analysis dashboard.
"""
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from config.settings import settings
from src.api.database import get_db, User, PredictionLog, ModelVersion
from src.api.models import ModelMetrics
from src.api.auth import get_current_active_user, require_analyst
from src.ml.predictor import get_predictor

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard_data(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get aggregated dashboard data for the specified time period.
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # Total predictions in period
    total_query = select(func.count(PredictionLog.id)).where(
        PredictionLog.created_at >= start_date
    )
    total_result = await db.execute(total_query)
    total_predictions = total_result.scalar() or 0

    # Predictions by risk level
    risk_query = select(
        PredictionLog.risk_level,
        func.count(PredictionLog.id).label('count')
    ).where(
        PredictionLog.created_at >= start_date
    ).group_by(PredictionLog.risk_level)

    risk_result = await db.execute(risk_query)
    risk_distribution = {row[0]: row[1] for row in risk_result.all()}

    # Average probability over time (daily)
    avg_by_date = []
    for i in range(min(days, 30)):
        date = datetime.utcnow() - timedelta(days=i)
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)

        avg_query = select(func.avg(PredictionLog.churn_probability)).where(
            PredictionLog.created_at >= date_start,
            PredictionLog.created_at < date_end
        )
        avg_result = await db.execute(avg_query)
        avg_prob = avg_result.scalar()

        avg_by_date.append({
            "date": date_start.strftime("%Y-%m-%d"),
            "average_probability": round(float(avg_prob or 0), 4)
        })

    avg_by_date.reverse()

    # Churn rate (predicted)
    churn_query = select(func.count(PredictionLog.id)).where(
        PredictionLog.created_at >= start_date,
        PredictionLog.will_churn == True
    )
    churn_result = await db.execute(churn_query)
    predicted_churn_count = churn_result.scalar() or 0

    predicted_churn_rate = (
        round(predicted_churn_count / total_predictions * 100, 2)
        if total_predictions > 0 else 0
    )

    return {
        "period_days": days,
        "total_predictions": total_predictions,
        "predicted_churn_count": predicted_churn_count,
        "predicted_churn_rate": predicted_churn_rate,
        "risk_distribution": risk_distribution,
        "daily_averages": avg_by_date,
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/model/metrics")
async def get_model_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """
    Get current model performance metrics.

    Requires analyst role.
    """
    predictor = get_predictor()

    if not predictor.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )

    model = predictor.model
    metrics = model.metrics

    return {
        "model_version": settings.model_version,
        "is_loaded": True,
        "metrics": {
            "accuracy": metrics.get("accuracy"),
            "precision": metrics.get("precision"),
            "recall": metrics.get("recall"),
            "f1_score": metrics.get("f1_score"),
            "roc_auc": metrics.get("roc_auc"),
            "pr_auc": metrics.get("pr_auc"),
            "train_accuracy": metrics.get("train_accuracy"),
            "train_roc_auc": metrics.get("train_roc_auc")
        },
        "confusion_matrix": metrics.get("confusion_matrix"),
        "cross_validation": {
            "cv_accuracy_mean": metrics.get("cv_accuracy_mean"),
            "cv_accuracy_std": metrics.get("cv_accuracy_std"),
            "cv_roc_auc_mean": metrics.get("cv_roc_auc_mean"),
            "cv_roc_auc_std": metrics.get("cv_roc_auc_std")
        }
    }


@router.get("/model/features")
async def get_feature_importance(
    top_n: int = 15,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get feature importance rankings from the model.
    """
    predictor = get_predictor()

    if not predictor.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )

    feature_importance = predictor.model.get_feature_importance(
        predictor.preprocessor.get_feature_names()
    )

    # Get top N features
    top_features = dict(list(feature_importance.items())[:top_n])

    return {
        "top_features": top_features,
        "total_features": len(feature_importance),
        "model_version": settings.model_version
    }


@router.get("/users/activity")
async def get_user_activity(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """
    Get user activity statistics.

    Requires analyst role.
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # Predictions per user
    user_query = select(
        PredictionLog.user_id,
        func.count(PredictionLog.id).label('prediction_count')
    ).where(
        PredictionLog.created_at >= start_date
    ).group_by(PredictionLog.user_id)

    result = await db.execute(user_query)
    user_activity = [
        {"user_id": row[0], "prediction_count": row[1]}
        for row in result.all()
    ]

    # Total active users
    active_users = len(user_activity)

    return {
        "period_days": days,
        "active_users": active_users,
        "user_activity": user_activity
    }


@router.get("/trends/churn-factors")
async def get_churn_factors(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get analysis of common churn factors based on predictions.
    """
    predictor = get_predictor()

    if not predictor.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded"
        )

    feature_importance = predictor.model.get_feature_importance(
        predictor.preprocessor.get_feature_names()
    )

    # Categorize features
    categories = {
        "contract": [],
        "services": [],
        "charges": [],
        "demographics": [],
        "other": []
    }

    for feature, importance in feature_importance.items():
        feature_lower = feature.lower()

        if "contract" in feature_lower or "tenure" in feature_lower:
            categories["contract"].append({"feature": feature, "importance": importance})
        elif any(s in feature_lower for s in ["internet", "phone", "streaming", "security", "backup", "support"]):
            categories["services"].append({"feature": feature, "importance": importance})
        elif "charge" in feature_lower or "payment" in feature_lower:
            categories["charges"].append({"feature": feature, "importance": importance})
        elif any(s in feature_lower for s in ["gender", "senior", "partner", "dependent"]):
            categories["demographics"].append({"feature": feature, "importance": importance})
        else:
            categories["other"].append({"feature": feature, "importance": importance})

    # Sort each category by importance
    for cat in categories:
        categories[cat] = sorted(
            categories[cat],
            key=lambda x: x["importance"],
            reverse=True
        )[:5]

    return {
        "churn_factors_by_category": categories,
        "insights": [
            {
                "category": "Contract",
                "insight": "Month-to-month contracts show highest churn correlation"
            },
            {
                "category": "Services",
                "insight": "Fiber optic users without security services are high risk"
            },
            {
                "category": "Tenure",
                "insight": "Customers with <12 months tenure need extra attention"
            },
            {
                "category": "Payment",
                "insight": "Electronic check payers show higher churn tendency"
            }
        ]
    }


@router.get("/export")
async def export_predictions(
    format: str = "json",
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_analyst)
):
    """
    Export prediction data for reporting.

    Requires analyst role.
    Format: json (default), csv data structure
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    query = select(PredictionLog).where(
        PredictionLog.created_at >= start_date
    ).order_by(PredictionLog.created_at.desc())

    result = await db.execute(query)
    logs = result.scalars().all()

    data = [
        {
            "id": log.id,
            "customer_id": log.customer_id,
            "churn_probability": log.churn_probability,
            "risk_level": log.risk_level,
            "will_churn": log.will_churn,
            "created_at": log.created_at.isoformat(),
            "user_id": log.user_id
        }
        for log in logs
    ]

    return {
        "format": format,
        "period_days": days,
        "record_count": len(data),
        "data": data,
        "exported_at": datetime.utcnow().isoformat()
    }
