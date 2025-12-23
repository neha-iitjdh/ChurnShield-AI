"""Tests for ML model."""
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ml.model import ChurnModel
from src.ml.preprocessing import DataPreprocessor, get_sample_data


class TestChurnModel:
    """Test cases for ChurnModel class."""

    @pytest.fixture
    def sample_data(self):
        """Create sample data for testing."""
        return get_sample_data()

    @pytest.fixture
    def preprocessed_data(self, sample_data):
        """Create preprocessed data for testing."""
        preprocessor = DataPreprocessor()
        X, y = preprocessor.fit_transform(sample_data, 'Churn')
        feature_names = preprocessor.get_feature_names()
        return X, y, feature_names

    @pytest.fixture
    def model(self):
        """Create a model instance."""
        return ChurnModel(use_smote=False)  # Disable SMOTE for faster tests

    def test_initialization(self, model):
        """Test model initialization."""
        assert model.model is None
        assert not model.is_fitted
        assert model.random_state == 42

    def test_fit(self, model, preprocessed_data):
        """Test model training."""
        X, y, feature_names = preprocessed_data

        model.fit(X, y, feature_names=feature_names)

        assert model.is_fitted
        assert model.model is not None
        assert 'train_accuracy' in model.metrics
        assert 'train_roc_auc' in model.metrics

    def test_predict(self, model, preprocessed_data):
        """Test model predictions."""
        X, y, feature_names = preprocessed_data
        model.fit(X, y, feature_names=feature_names)

        predictions = model.predict(X)

        assert len(predictions) == len(X)
        assert set(predictions).issubset({0, 1})

    def test_predict_proba(self, model, preprocessed_data):
        """Test probability predictions."""
        X, y, feature_names = preprocessed_data
        model.fit(X, y, feature_names=feature_names)

        probas = model.predict_proba(X)

        assert probas.shape == (len(X), 2)
        assert np.allclose(probas.sum(axis=1), 1.0)
        assert (probas >= 0).all() and (probas <= 1).all()

    def test_get_churn_probability(self, model, preprocessed_data):
        """Test getting churn probability."""
        X, y, feature_names = preprocessed_data
        model.fit(X, y, feature_names=feature_names)

        churn_prob = model.get_churn_probability(X)

        assert len(churn_prob) == len(X)
        assert (churn_prob >= 0).all() and (churn_prob <= 1).all()

    def test_evaluate(self, model, preprocessed_data):
        """Test model evaluation."""
        X, y, feature_names = preprocessed_data
        model.fit(X, y, feature_names=feature_names)

        metrics = model.evaluate(X, y)

        assert 'accuracy' in metrics
        assert 'precision' in metrics
        assert 'recall' in metrics
        assert 'f1_score' in metrics
        assert 'roc_auc' in metrics
        assert 0 <= metrics['accuracy'] <= 1
        assert 0 <= metrics['roc_auc'] <= 1

    def test_cross_validate(self, model, preprocessed_data):
        """Test cross-validation."""
        X, y, feature_names = preprocessed_data

        cv_results = model.cross_validate(X, y, cv=3)

        assert 'cv_accuracy_mean' in cv_results
        assert 'cv_roc_auc_mean' in cv_results
        assert 0 <= cv_results['cv_accuracy_mean'] <= 1

    def test_get_feature_importance(self, model, preprocessed_data):
        """Test feature importance extraction."""
        X, y, feature_names = preprocessed_data
        model.fit(X, y, feature_names=feature_names)

        importance = model.get_feature_importance(feature_names)

        assert isinstance(importance, dict)
        assert len(importance) > 0
        # Check that importances sum to approximately 1
        assert abs(sum(importance.values()) - 1.0) < 0.01

    def test_unfitted_model_raises_error(self, model, preprocessed_data):
        """Test that unfitted model raises error on predict."""
        X, y, _ = preprocessed_data

        with pytest.raises(ValueError, match="Model not fitted"):
            model.predict(X)

        with pytest.raises(ValueError, match="Model not fitted"):
            model.predict_proba(X)


class TestModelWithSMOTE:
    """Test model with SMOTE enabled."""

    @pytest.fixture
    def preprocessed_data(self):
        """Create preprocessed data for testing."""
        df = get_sample_data()
        preprocessor = DataPreprocessor()
        X, y = preprocessor.fit_transform(df, 'Churn')
        feature_names = preprocessor.get_feature_names()
        return X, y, feature_names

    def test_model_with_smote(self, preprocessed_data):
        """Test that model trains successfully with SMOTE."""
        X, y, feature_names = preprocessed_data
        model = ChurnModel(use_smote=True)

        model.fit(X, y, feature_names=feature_names)

        assert model.is_fitted
        assert model.use_smote
