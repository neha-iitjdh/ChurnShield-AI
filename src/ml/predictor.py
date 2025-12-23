"""
Prediction service for churn analysis.
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

from config.settings import settings
from src.ml.model import ChurnModel
from src.ml.preprocessing import DataPreprocessor
from src.api.models import (
    PredictionResult, RiskLevel, Recommendation,
    CustomerPredictionInput, BatchPredictionResult
)

logger = logging.getLogger(__name__)


class ChurnPredictor:
    """
    High-level prediction service that combines preprocessing and model inference.
    """

    def __init__(self, model_path: str = None, preprocessor_path: str = None):
        """
        Initialize the predictor.

        Args:
            model_path: Path to trained model
            preprocessor_path: Path to fitted preprocessor
        """
        self.model_path = model_path or str(settings.model_path)
        self.preprocessor_path = preprocessor_path or str(settings.preprocessor_path)

        self.model: Optional[ChurnModel] = None
        self.preprocessor: Optional[DataPreprocessor] = None
        self._is_loaded = False

    def load(self) -> 'ChurnPredictor':
        """
        Load the model and preprocessor from disk.

        Returns:
            Self for chaining
        """
        try:
            self.model = ChurnModel()
            self.model.load(self.model_path)

            self.preprocessor = DataPreprocessor()
            self.preprocessor.load(self.preprocessor_path)

            self._is_loaded = True
            logger.info("Predictor loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load predictor: {e}")
            raise

        return self

    def is_loaded(self) -> bool:
        """Check if predictor is loaded and ready."""
        return self._is_loaded

    def _determine_risk_level(self, probability: float) -> RiskLevel:
        """
        Determine risk level based on churn probability.

        Args:
            probability: Churn probability (0-1)

        Returns:
            RiskLevel enum value
        """
        if probability >= 0.75:
            return RiskLevel.CRITICAL
        elif probability >= 0.50:
            return RiskLevel.HIGH
        elif probability >= 0.25:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def _generate_recommendations(
        self,
        probability: float,
        input_data: Dict[str, Any],
        feature_importance: Dict[str, float]
    ) -> List[Recommendation]:
        """
        Generate retention recommendations based on risk factors.

        Args:
            probability: Churn probability
            input_data: Customer input data
            feature_importance: Feature importance scores

        Returns:
            List of recommendations
        """
        recommendations = []

        # Get top risk factors
        top_factors = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        # Contract-based recommendations
        contract = input_data.get('Contract', 'Month-to-month')
        if contract == 'Month-to-month':
            recommendations.append(Recommendation(
                priority=1,
                action="Offer Annual Contract",
                description="Offer a 15-20% discount for upgrading to a one-year or two-year contract",
                expected_impact="Reduces churn by 30-40% for high-risk customers"
            ))

        # Tenure-based recommendations
        tenure = input_data.get('tenure', 0)
        if tenure < 12:
            recommendations.append(Recommendation(
                priority=2,
                action="New Customer Engagement",
                description="Schedule a customer success call to ensure satisfaction and address concerns",
                expected_impact="Improves retention by 25% for new customers"
            ))

        # Service-based recommendations
        internet_service = input_data.get('InternetService', 'No')
        if internet_service == 'Fiber optic':
            has_security = input_data.get('OnlineSecurity', 'No') == 'Yes'
            has_backup = input_data.get('OnlineBackup', 'No') == 'Yes'
            has_support = input_data.get('TechSupport', 'No') == 'Yes'

            if not (has_security and has_backup and has_support):
                recommendations.append(Recommendation(
                    priority=2,
                    action="Bundle Add-on Services",
                    description="Offer discounted security, backup, and tech support bundle",
                    expected_impact="Increases stickiness and reduces churn by 20%"
                ))

        # Payment method recommendations
        payment = input_data.get('PaymentMethod', '')
        if payment == 'Electronic check':
            recommendations.append(Recommendation(
                priority=3,
                action="Auto-payment Incentive",
                description="Offer $5/month discount for switching to automatic bank transfer or credit card",
                expected_impact="Reduces payment-related churn by 15%"
            ))

        # High charges recommendations
        monthly_charges = input_data.get('MonthlyCharges', 0)
        if monthly_charges > 80:
            recommendations.append(Recommendation(
                priority=3,
                action="Loyalty Discount",
                description="Apply a 10% loyalty discount or offer a service downgrade option",
                expected_impact="Prevents price-sensitive churn for 20% of high-bill customers"
            ))

        # Senior citizen specific
        if input_data.get('SeniorCitizen', 0) == 1:
            recommendations.append(Recommendation(
                priority=4,
                action="Senior Support Program",
                description="Enroll in dedicated senior support program with simplified billing",
                expected_impact="Improves satisfaction scores by 30% for senior customers"
            ))

        # Streaming users without other services
        has_streaming = (
            input_data.get('StreamingTV', 'No') == 'Yes' or
            input_data.get('StreamingMovies', 'No') == 'Yes'
        )
        if has_streaming and not input_data.get('OnlineBackup', 'No') == 'Yes':
            recommendations.append(Recommendation(
                priority=4,
                action="Cloud Storage Upsell",
                description="Offer cloud backup for media libraries at 50% discount",
                expected_impact="Increases service usage and reduces churn by 10%"
            ))

        # High probability emergency measures
        if probability > 0.75:
            recommendations.insert(0, Recommendation(
                priority=1,
                action="Urgent Retention Call",
                description="Schedule immediate call from retention specialist with authority to offer up to 25% discount",
                expected_impact="Saves 40% of critical-risk customers when contacted within 48 hours"
            ))

        # Sort by priority and limit
        recommendations = sorted(recommendations, key=lambda x: x.priority)[:5]

        return recommendations

    def predict_single(
        self,
        customer_data: CustomerPredictionInput,
        customer_id: str = None
    ) -> PredictionResult:
        """
        Make a prediction for a single customer.

        Args:
            customer_data: Customer input data
            customer_id: Optional customer identifier

        Returns:
            PredictionResult with churn probability and recommendations
        """
        if not self._is_loaded:
            raise RuntimeError("Predictor not loaded. Call load() first.")

        start_time = datetime.utcnow()

        # Convert to DataFrame
        data_dict = customer_data.model_dump()
        df = pd.DataFrame([data_dict])

        # Preprocess
        X = self.preprocessor.transform(df)

        # Predict
        probability = float(self.model.get_churn_probability(X)[0])
        risk_level = self._determine_risk_level(probability)
        will_churn = probability >= settings.prediction_threshold

        # Get feature importance
        feature_importance = self.model.get_feature_importance(
            self.preprocessor.get_feature_names()
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            probability,
            data_dict,
            feature_importance
        )

        # Calculate confidence based on probability distance from threshold
        confidence = abs(probability - 0.5) * 2  # 0 to 1 scale

        result = PredictionResult(
            customer_id=customer_id,
            churn_probability=round(probability, 4),
            churn_risk_score=int(probability * 100),
            risk_level=risk_level,
            will_churn=will_churn,
            confidence=round(confidence, 4),
            feature_importance={k: round(v, 4) for k, v in list(feature_importance.items())[:10]},
            recommendations=recommendations,
            prediction_timestamp=start_time
        )

        return result

    def predict_batch(
        self,
        customers: List[CustomerPredictionInput],
        customer_ids: List[str] = None
    ) -> BatchPredictionResult:
        """
        Make predictions for multiple customers.

        Args:
            customers: List of customer input data
            customer_ids: Optional list of customer identifiers

        Returns:
            BatchPredictionResult with aggregated results
        """
        if not self._is_loaded:
            raise RuntimeError("Predictor not loaded. Call load() first.")

        start_time = datetime.utcnow()

        predictions = []
        for i, customer in enumerate(customers):
            cust_id = customer_ids[i] if customer_ids and i < len(customer_ids) else f"CUST{i:04d}"
            pred = self.predict_single(customer, cust_id)
            predictions.append(pred)

        end_time = datetime.utcnow()
        processing_time = (end_time - start_time).total_seconds() * 1000

        # Aggregate statistics
        probabilities = [p.churn_probability for p in predictions]

        result = BatchPredictionResult(
            total_customers=len(predictions),
            high_risk_count=sum(1 for p in predictions if p.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]),
            medium_risk_count=sum(1 for p in predictions if p.risk_level == RiskLevel.MEDIUM),
            low_risk_count=sum(1 for p in predictions if p.risk_level == RiskLevel.LOW),
            average_churn_probability=round(np.mean(probabilities), 4),
            predictions=predictions,
            processing_time_ms=round(processing_time, 2),
            timestamp=start_time
        )

        return result

    def predict_from_dataframe(self, df: pd.DataFrame) -> BatchPredictionResult:
        """
        Make predictions from a pandas DataFrame.

        Args:
            df: DataFrame with customer data

        Returns:
            BatchPredictionResult with predictions for all rows
        """
        customers = []
        customer_ids = []

        for idx, row in df.iterrows():
            # Extract customer ID if present
            if 'customerID' in row:
                customer_ids.append(str(row['customerID']))
            else:
                customer_ids.append(f"CUST{idx:04d}")

            # Build customer input
            customer = CustomerPredictionInput(
                gender=row.get('gender', 'Male'),
                SeniorCitizen=int(row.get('SeniorCitizen', 0)),
                Partner=row.get('Partner', 'No'),
                Dependents=row.get('Dependents', 'No'),
                tenure=int(row.get('tenure', 1)),
                PhoneService=row.get('PhoneService', 'Yes'),
                MultipleLines=row.get('MultipleLines', 'No'),
                InternetService=row.get('InternetService', 'No'),
                OnlineSecurity=row.get('OnlineSecurity', 'No'),
                OnlineBackup=row.get('OnlineBackup', 'No'),
                DeviceProtection=row.get('DeviceProtection', 'No'),
                TechSupport=row.get('TechSupport', 'No'),
                StreamingTV=row.get('StreamingTV', 'No'),
                StreamingMovies=row.get('StreamingMovies', 'No'),
                Contract=row.get('Contract', 'Month-to-month'),
                PaperlessBilling=row.get('PaperlessBilling', 'Yes'),
                PaymentMethod=row.get('PaymentMethod', 'Electronic check'),
                MonthlyCharges=float(row.get('MonthlyCharges', 50)),
                TotalCharges=float(row.get('TotalCharges', 50))
            )
            customers.append(customer)

        return self.predict_batch(customers, customer_ids)


# Global predictor instance
_predictor: Optional[ChurnPredictor] = None


def get_predictor() -> ChurnPredictor:
    """
    Get or create the global predictor instance.

    Returns:
        ChurnPredictor instance
    """
    global _predictor

    if _predictor is None:
        _predictor = ChurnPredictor()
        try:
            _predictor.load()
        except Exception as e:
            logger.warning(f"Could not load predictor: {e}. Model may need training.")

    return _predictor
