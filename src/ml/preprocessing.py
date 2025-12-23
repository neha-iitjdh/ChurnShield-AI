"""
Data preprocessing pipeline for churn prediction.
"""
import logging
from typing import Tuple, Optional, List, Dict, Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
import joblib

from config.settings import settings

logger = logging.getLogger(__name__)


class DataPreprocessor:
    """
    Handles all data preprocessing for the churn prediction model.
    """

    def __init__(self):
        self.preprocessor: Optional[ColumnTransformer] = None
        self.label_encoder: Optional[LabelEncoder] = None
        self.feature_names: List[str] = []
        self.categorical_features = settings.categorical_features
        self.numerical_features = settings.numerical_features

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and prepare the raw data.

        Args:
            df: Raw DataFrame

        Returns:
            Cleaned DataFrame
        """
        df = df.copy()

        # Handle TotalCharges - convert to numeric, handle empty strings
        if 'TotalCharges' in df.columns:
            df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
            # Fill missing TotalCharges with MonthlyCharges * tenure
            mask = df['TotalCharges'].isna()
            if mask.any():
                df.loc[mask, 'TotalCharges'] = df.loc[mask, 'MonthlyCharges'] * df.loc[mask, 'tenure']
                # If still NaN (tenure is 0), use MonthlyCharges
                mask = df['TotalCharges'].isna()
                df.loc[mask, 'TotalCharges'] = df.loc[mask, 'MonthlyCharges']

        # Ensure SeniorCitizen is numeric
        if 'SeniorCitizen' in df.columns:
            df['SeniorCitizen'] = df['SeniorCitizen'].astype(int)

        # Drop customerID if present (not a feature)
        if 'customerID' in df.columns:
            df = df.drop('customerID', axis=1)

        return df

    def _build_preprocessor(self) -> ColumnTransformer:
        """
        Build the preprocessing pipeline.

        Returns:
            ColumnTransformer for preprocessing
        """
        # Numerical pipeline
        numerical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])

        # Categorical pipeline
        categorical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        # Combine pipelines
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numerical_pipeline, self.numerical_features),
                ('cat', categorical_pipeline, self.categorical_features)
            ],
            remainder='drop'
        )

        return preprocessor

    def fit(self, df: pd.DataFrame, target_column: str = None) -> 'DataPreprocessor':
        """
        Fit the preprocessor on training data.

        Args:
            df: Training DataFrame
            target_column: Name of target column (optional)

        Returns:
            Self for chaining
        """
        df = self._clean_data(df)

        # Separate features and target
        if target_column and target_column in df.columns:
            X = df.drop(columns=[target_column])
            y = df[target_column]

            # Encode target if string
            if y.dtype == 'object':
                self.label_encoder = LabelEncoder()
                self.label_encoder.fit(y)
        else:
            X = df

        # Build and fit preprocessor
        self.preprocessor = self._build_preprocessor()
        self.preprocessor.fit(X)

        # Get feature names after transformation
        self._extract_feature_names()

        logger.info(f"Preprocessor fitted with {len(self.feature_names)} features")
        return self

    def _extract_feature_names(self) -> None:
        """Extract feature names from the fitted preprocessor."""
        feature_names = []

        # Numerical features (unchanged names)
        feature_names.extend(self.numerical_features)

        # Categorical features (get from OneHotEncoder)
        cat_encoder = self.preprocessor.named_transformers_['cat'].named_steps['encoder']
        cat_feature_names = cat_encoder.get_feature_names_out(self.categorical_features)
        feature_names.extend(cat_feature_names.tolist())

        self.feature_names = feature_names

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """
        Transform data using fitted preprocessor.

        Args:
            df: DataFrame to transform

        Returns:
            Transformed numpy array
        """
        if self.preprocessor is None:
            raise ValueError("Preprocessor not fitted. Call fit() first.")

        df = self._clean_data(df)

        # Remove target column if present
        target_col = settings.target_column
        if target_col in df.columns:
            df = df.drop(columns=[target_col])

        return self.preprocessor.transform(df)

    def fit_transform(
        self,
        df: pd.DataFrame,
        target_column: str = None
    ) -> Tuple[np.ndarray, Optional[np.ndarray]]:
        """
        Fit and transform data in one step.

        Args:
            df: DataFrame to process
            target_column: Name of target column

        Returns:
            Tuple of (transformed features, encoded target or None)
        """
        self.fit(df, target_column)

        df_clean = self._clean_data(df)
        y = None

        if target_column and target_column in df_clean.columns:
            y_raw = df_clean[target_column]
            if self.label_encoder:
                y = self.label_encoder.transform(y_raw)
            else:
                y = y_raw.values
            df_clean = df_clean.drop(columns=[target_column])

        X = self.preprocessor.transform(df_clean)
        return X, y

    def encode_target(self, y: pd.Series) -> np.ndarray:
        """
        Encode target variable.

        Args:
            y: Target series

        Returns:
            Encoded target array
        """
        if self.label_encoder is None:
            self.label_encoder = LabelEncoder()
            return self.label_encoder.fit_transform(y)
        return self.label_encoder.transform(y)

    def get_feature_names(self) -> List[str]:
        """Get list of feature names after transformation."""
        return self.feature_names

    def save(self, path: str = None) -> None:
        """
        Save the preprocessor to disk.

        Args:
            path: Path to save (uses default if None)
        """
        if path is None:
            path = str(settings.preprocessor_path)

        state = {
            'preprocessor': self.preprocessor,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features
        }
        joblib.dump(state, path)
        logger.info(f"Preprocessor saved to {path}")

    def load(self, path: str = None) -> 'DataPreprocessor':
        """
        Load the preprocessor from disk.

        Args:
            path: Path to load from (uses default if None)

        Returns:
            Self for chaining
        """
        if path is None:
            path = str(settings.preprocessor_path)

        state = joblib.load(path)
        self.preprocessor = state['preprocessor']
        self.label_encoder = state['label_encoder']
        self.feature_names = state['feature_names']
        self.categorical_features = state['categorical_features']
        self.numerical_features = state['numerical_features']

        logger.info(f"Preprocessor loaded from {path}")
        return self


def load_dataset(file_path: str) -> pd.DataFrame:
    """
    Load dataset from CSV or Excel file.

    Args:
        file_path: Path to the data file

    Returns:
        Loaded DataFrame
    """
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_path}")

    logger.info(f"Loaded dataset with {len(df)} records and {len(df.columns)} columns")
    return df


def get_sample_data() -> pd.DataFrame:
    """
    Generate sample data for testing/demo purposes.

    Returns:
        Sample DataFrame with realistic telecom data
    """
    np.random.seed(42)
    n_samples = 100

    data = {
        'customerID': [f'CUST{i:04d}' for i in range(n_samples)],
        'gender': np.random.choice(['Male', 'Female'], n_samples),
        'SeniorCitizen': np.random.choice([0, 1], n_samples, p=[0.84, 0.16]),
        'Partner': np.random.choice(['Yes', 'No'], n_samples),
        'Dependents': np.random.choice(['Yes', 'No'], n_samples, p=[0.3, 0.7]),
        'tenure': np.random.randint(0, 72, n_samples),
        'PhoneService': np.random.choice(['Yes', 'No'], n_samples, p=[0.9, 0.1]),
        'MultipleLines': np.random.choice(['Yes', 'No', 'No phone service'], n_samples),
        'InternetService': np.random.choice(['DSL', 'Fiber optic', 'No'], n_samples),
        'OnlineSecurity': np.random.choice(['Yes', 'No', 'No internet service'], n_samples),
        'OnlineBackup': np.random.choice(['Yes', 'No', 'No internet service'], n_samples),
        'DeviceProtection': np.random.choice(['Yes', 'No', 'No internet service'], n_samples),
        'TechSupport': np.random.choice(['Yes', 'No', 'No internet service'], n_samples),
        'StreamingTV': np.random.choice(['Yes', 'No', 'No internet service'], n_samples),
        'StreamingMovies': np.random.choice(['Yes', 'No', 'No internet service'], n_samples),
        'Contract': np.random.choice(['Month-to-month', 'One year', 'Two year'], n_samples),
        'PaperlessBilling': np.random.choice(['Yes', 'No'], n_samples),
        'PaymentMethod': np.random.choice([
            'Electronic check', 'Mailed check',
            'Bank transfer (automatic)', 'Credit card (automatic)'
        ], n_samples),
        'MonthlyCharges': np.round(np.random.uniform(18, 120, n_samples), 2),
        'Churn': np.random.choice(['Yes', 'No'], n_samples, p=[0.27, 0.73])
    }

    df = pd.DataFrame(data)
    df['TotalCharges'] = np.round(df['MonthlyCharges'] * df['tenure'] + np.random.uniform(0, 50, n_samples), 2)

    return df
