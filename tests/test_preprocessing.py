"""Tests for data preprocessing."""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ml.preprocessing import DataPreprocessor, get_sample_data


class TestDataPreprocessor:
    """Test cases for DataPreprocessor class."""

    @pytest.fixture
    def sample_data(self):
        """Create sample data for testing."""
        return get_sample_data()

    @pytest.fixture
    def preprocessor(self):
        """Create a preprocessor instance."""
        return DataPreprocessor()

    def test_initialization(self, preprocessor):
        """Test preprocessor initialization."""
        assert preprocessor.preprocessor is None
        assert preprocessor.label_encoder is None
        assert len(preprocessor.feature_names) == 0

    def test_clean_data(self, preprocessor, sample_data):
        """Test data cleaning."""
        cleaned = preprocessor._clean_data(sample_data)

        # Check customerID is dropped
        assert 'customerID' not in cleaned.columns

        # Check TotalCharges is numeric
        assert cleaned['TotalCharges'].dtype in [np.float64, np.int64]

        # Check no NaN values in TotalCharges
        assert not cleaned['TotalCharges'].isna().any()

    def test_fit(self, preprocessor, sample_data):
        """Test fitting the preprocessor."""
        preprocessor.fit(sample_data, 'Churn')

        assert preprocessor.preprocessor is not None
        assert preprocessor.label_encoder is not None
        assert len(preprocessor.feature_names) > 0

    def test_transform(self, preprocessor, sample_data):
        """Test transforming data."""
        preprocessor.fit(sample_data, 'Churn')

        # Remove target column for transform
        X_df = sample_data.drop(columns=['Churn'])
        X = preprocessor.transform(X_df)

        assert isinstance(X, np.ndarray)
        assert X.shape[0] == len(sample_data)
        assert X.shape[1] == len(preprocessor.feature_names)

    def test_fit_transform(self, preprocessor, sample_data):
        """Test fit and transform in one step."""
        X, y = preprocessor.fit_transform(sample_data, 'Churn')

        assert isinstance(X, np.ndarray)
        assert isinstance(y, np.ndarray)
        assert X.shape[0] == len(sample_data)
        assert len(y) == len(sample_data)

    def test_get_feature_names(self, preprocessor, sample_data):
        """Test getting feature names."""
        preprocessor.fit(sample_data, 'Churn')
        feature_names = preprocessor.get_feature_names()

        assert len(feature_names) > 0
        assert 'tenure' in feature_names
        assert 'MonthlyCharges' in feature_names
        assert 'TotalCharges' in feature_names


class TestSampleData:
    """Test sample data generation."""

    def test_get_sample_data(self):
        """Test sample data generation."""
        df = get_sample_data()

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 100
        assert 'Churn' in df.columns
        assert 'tenure' in df.columns
        assert 'MonthlyCharges' in df.columns

    def test_sample_data_values(self):
        """Test sample data value ranges."""
        df = get_sample_data()

        assert df['tenure'].min() >= 0
        assert df['tenure'].max() <= 72
        assert df['MonthlyCharges'].min() >= 0
        assert df['SeniorCitizen'].isin([0, 1]).all()
        assert df['Churn'].isin(['Yes', 'No']).all()
