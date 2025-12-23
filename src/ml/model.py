"""
Machine Learning model for churn prediction.
"""
import logging
from typing import Dict, Any, Optional, Tuple, List
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    classification_report
)
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib

from config.settings import settings

logger = logging.getLogger(__name__)


class ChurnModel:
    """
    XGBoost-based churn prediction model with SMOTE for handling class imbalance.
    """

    def __init__(
        self,
        model_params: Optional[Dict[str, Any]] = None,
        use_smote: bool = True,
        random_state: int = 42
    ):
        """
        Initialize the churn prediction model.

        Args:
            model_params: XGBoost parameters (uses defaults if None)
            use_smote: Whether to use SMOTE for handling class imbalance
            random_state: Random seed for reproducibility
        """
        self.random_state = random_state
        self.use_smote = use_smote

        # Default XGBoost parameters optimized for churn prediction
        self.default_params = {
            'n_estimators': 200,
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'min_child_weight': 3,
            'gamma': 0.1,
            'reg_alpha': 0.1,
            'reg_lambda': 1.0,
            'scale_pos_weight': 1,
            'random_state': random_state,
            'n_jobs': -1,
            'eval_metric': 'logloss',
            'use_label_encoder': False
        }

        self.model_params = {**self.default_params, **(model_params or {})}
        self.model: Optional[XGBClassifier] = None
        self.pipeline: Optional[ImbPipeline] = None
        self.feature_names: List[str] = []
        self.metrics: Dict[str, float] = {}
        self.is_fitted: bool = False

    def _create_pipeline(self) -> ImbPipeline:
        """
        Create the training pipeline with optional SMOTE.

        Returns:
            Imbalanced-learn pipeline
        """
        steps = []

        if self.use_smote:
            smote = SMOTE(random_state=self.random_state, k_neighbors=5)
            steps.append(('smote', smote))

        xgb = XGBClassifier(**self.model_params)
        steps.append(('classifier', xgb))

        return ImbPipeline(steps)

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        feature_names: Optional[List[str]] = None,
        eval_set: Optional[List[Tuple[np.ndarray, np.ndarray]]] = None
    ) -> 'ChurnModel':
        """
        Train the model on the provided data.

        Args:
            X: Feature matrix
            y: Target vector
            feature_names: Names of features
            eval_set: Optional validation set for early stopping

        Returns:
            Self for chaining
        """
        logger.info(f"Training model on {X.shape[0]} samples with {X.shape[1]} features")

        if feature_names:
            self.feature_names = feature_names

        # Create and train pipeline
        self.pipeline = self._create_pipeline()

        # Fit the pipeline
        self.pipeline.fit(X, y)

        # Get the fitted model
        self.model = self.pipeline.named_steps['classifier']
        self.is_fitted = True

        # Calculate training metrics
        y_pred = self.pipeline.predict(X)
        y_prob = self.pipeline.predict_proba(X)[:, 1]

        self.metrics['train_accuracy'] = accuracy_score(y, y_pred)
        self.metrics['train_roc_auc'] = roc_auc_score(y, y_prob)

        logger.info(f"Training completed. Accuracy: {self.metrics['train_accuracy']:.4f}, "
                   f"ROC-AUC: {self.metrics['train_roc_auc']:.4f}")

        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make binary predictions.

        Args:
            X: Feature matrix

        Returns:
            Binary predictions array
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Get probability predictions.

        Args:
            X: Feature matrix

        Returns:
            Probability array of shape (n_samples, 2)
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")
        return self.model.predict_proba(X)

    def get_churn_probability(self, X: np.ndarray) -> np.ndarray:
        """
        Get churn probability (probability of positive class).

        Args:
            X: Feature matrix

        Returns:
            Churn probability array
        """
        return self.predict_proba(X)[:, 1]

    def evaluate(
        self,
        X: np.ndarray,
        y: np.ndarray,
        threshold: float = 0.5
    ) -> Dict[str, Any]:
        """
        Evaluate model performance on test data.

        Args:
            X: Feature matrix
            y: True labels
            threshold: Classification threshold

        Returns:
            Dictionary of evaluation metrics
        """
        y_prob = self.get_churn_probability(X)
        y_pred = (y_prob >= threshold).astype(int)

        metrics = {
            'accuracy': accuracy_score(y, y_pred),
            'precision': precision_score(y, y_pred, zero_division=0),
            'recall': recall_score(y, y_pred, zero_division=0),
            'f1_score': f1_score(y, y_pred, zero_division=0),
            'roc_auc': roc_auc_score(y, y_prob),
            'pr_auc': average_precision_score(y, y_prob),
            'confusion_matrix': confusion_matrix(y, y_pred).tolist(),
            'classification_report': classification_report(y, y_pred, output_dict=True)
        }

        self.metrics.update(metrics)
        return metrics

    def cross_validate(
        self,
        X: np.ndarray,
        y: np.ndarray,
        cv: int = 5
    ) -> Dict[str, Any]:
        """
        Perform cross-validation.

        Args:
            X: Feature matrix
            y: Target vector
            cv: Number of folds

        Returns:
            Cross-validation results
        """
        logger.info(f"Running {cv}-fold cross-validation")

        cv_strategy = StratifiedKFold(n_splits=cv, shuffle=True, random_state=self.random_state)

        # Create a fresh model for CV
        xgb = XGBClassifier(**self.model_params)

        scores = {
            'accuracy': cross_val_score(xgb, X, y, cv=cv_strategy, scoring='accuracy'),
            'roc_auc': cross_val_score(xgb, X, y, cv=cv_strategy, scoring='roc_auc'),
            'f1': cross_val_score(xgb, X, y, cv=cv_strategy, scoring='f1'),
        }

        results = {
            'cv_accuracy_mean': scores['accuracy'].mean(),
            'cv_accuracy_std': scores['accuracy'].std(),
            'cv_roc_auc_mean': scores['roc_auc'].mean(),
            'cv_roc_auc_std': scores['roc_auc'].std(),
            'cv_f1_mean': scores['f1'].mean(),
            'cv_f1_std': scores['f1'].std(),
            'cv_scores': {k: v.tolist() for k, v in scores.items()}
        }

        logger.info(f"CV Results - Accuracy: {results['cv_accuracy_mean']:.4f} "
                   f"(+/- {results['cv_accuracy_std']:.4f})")

        return results

    def get_feature_importance(
        self,
        feature_names: Optional[List[str]] = None,
        importance_type: str = 'gain'
    ) -> Dict[str, float]:
        """
        Get feature importance scores.

        Args:
            feature_names: Names of features
            importance_type: Type of importance ('gain', 'weight', 'cover')

        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first.")

        names = feature_names or self.feature_names or [f'feature_{i}' for i in range(self.model.n_features_in_)]

        # Get importance from XGBoost
        importance = self.model.get_booster().get_score(importance_type=importance_type)

        # Map to feature names
        result = {}
        for i, name in enumerate(names):
            key = f'f{i}'
            result[name] = importance.get(key, 0.0)

        # Normalize
        total = sum(result.values()) or 1
        result = {k: v / total for k, v in result.items()}

        # Sort by importance
        result = dict(sorted(result.items(), key=lambda x: x[1], reverse=True))

        return result

    def save(self, path: str = None) -> None:
        """
        Save the model to disk.

        Args:
            path: Path to save (uses default if None)
        """
        if path is None:
            path = str(settings.model_path)

        state = {
            'model': self.model,
            'pipeline': self.pipeline,
            'model_params': self.model_params,
            'feature_names': self.feature_names,
            'metrics': self.metrics,
            'is_fitted': self.is_fitted,
            'use_smote': self.use_smote,
            'random_state': self.random_state
        }
        joblib.dump(state, path)
        logger.info(f"Model saved to {path}")

    def load(self, path: str = None) -> 'ChurnModel':
        """
        Load the model from disk.

        Args:
            path: Path to load from (uses default if None)

        Returns:
            Self for chaining
        """
        if path is None:
            path = str(settings.model_path)

        state = joblib.load(path)
        self.model = state['model']
        self.pipeline = state['pipeline']
        self.model_params = state['model_params']
        self.feature_names = state['feature_names']
        self.metrics = state['metrics']
        self.is_fitted = state['is_fitted']
        self.use_smote = state['use_smote']
        self.random_state = state['random_state']

        logger.info(f"Model loaded from {path}")
        return self


def load_model(path: str = None) -> ChurnModel:
    """
    Convenience function to load a trained model.

    Args:
        path: Path to model file

    Returns:
        Loaded ChurnModel instance
    """
    model = ChurnModel()
    return model.load(path)
