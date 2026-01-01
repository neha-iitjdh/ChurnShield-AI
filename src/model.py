"""
Improved ML model for churn prediction using XGBoost.
This is the BRAIN of our application.

XGBoost vs RandomForest:
- XGBoost: Gradient boosting (learns from mistakes)
- RandomForest: Bagging (many trees vote)
- XGBoost usually gives better accuracy!
"""

import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib


class ChurnModel:
    """
    Improved churn prediction model using XGBoost.

    What it does:
    1. Takes customer data (tenure, charges, contract type, etc.)
    2. Predicts if they will churn (leave) or not
    3. Returns probability (0-100%) and risk level
    """

    def __init__(self):
        # XGBoost classifier - more powerful than RandomForest
        # Key parameters explained:
        # - n_estimators: Number of boosting rounds (trees)
        # - max_depth: How deep each tree can be (prevents overfitting)
        # - learning_rate: How much to adjust weights (smaller = more careful)
        # - eval_metric: What to optimize (logloss for classification)
        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            eval_metric='logloss',
            random_state=42,
            use_label_encoder=False
        )

        # Encoders to convert text to numbers
        self.encoders = {}

        # Track training status and metrics
        self.is_trained = False
        self.metrics = {}
        self.feature_names = []

    def train(self, data: pd.DataFrame):
        """
        Train the model on historical customer data.
        Now with train/test split to measure real performance!

        Args:
            data: DataFrame with customer features and 'Churn' column
        """
        df = data.copy()

        # Separate features (X) and target (y)
        X = df.drop('Churn', axis=1)
        y = df['Churn']

        # Store feature names for later
        self.feature_names = list(X.columns)

        # Convert text columns to numbers
        for column in X.select_dtypes(include=['object']).columns:
            self.encoders[column] = LabelEncoder()
            X[column] = self.encoders[column].fit_transform(X[column])

        # Encode target
        self.encoders['Churn'] = LabelEncoder()
        y = self.encoders['Churn'].fit_transform(y)

        # Split data: 80% train, 20% test
        # This lets us measure how well the model performs on unseen data!
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Train the model
        self.model.fit(X_train, y_train)

        # Evaluate on test set
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        # Store metrics
        self.metrics = {
            'accuracy': round(accuracy * 100, 2),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'total_samples': len(df)
        }

        self.is_trained = True

        print(f"Model trained on {len(X_train)} samples")
        print(f"Test accuracy: {self.metrics['accuracy']}%")

        return self

    def predict(self, customer_data: dict) -> dict:
        """
        Predict churn for a single customer.

        Args:
            customer_data: Dictionary with customer features

        Returns:
            Dictionary with prediction results
        """
        if not self.is_trained:
            raise ValueError("Model not trained! Call train() first.")

        # Convert dict to DataFrame
        df = pd.DataFrame([customer_data])

        # Encode text columns using same encoders from training
        for column in df.select_dtypes(include=['object']).columns:
            if column in self.encoders:
                df[column] = self.encoders[column].transform(df[column])

        # Get prediction probability
        proba = self.model.predict_proba(df)[0]
        churn_probability = proba[1]

        # Determine risk level
        if churn_probability < 0.25:
            risk_level = "Low"
        elif churn_probability < 0.50:
            risk_level = "Medium"
        elif churn_probability < 0.75:
            risk_level = "High"
        else:
            risk_level = "Critical"

        return {
            "churn_probability": round(churn_probability * 100, 2),
            "risk_level": risk_level,
            "will_churn": churn_probability >= 0.5
        }

    def get_feature_importance(self) -> dict:
        """
        Get which features are most important for predictions.
        This helps understand what drives churn!
        """
        if not self.is_trained:
            return {}

        importance = self.model.feature_importances_
        feature_importance = dict(zip(self.feature_names, importance))

        # Sort by importance (highest first)
        sorted_importance = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        )

        return {k: round(v * 100, 2) for k, v in sorted_importance.items()}

    def save(self, filepath: str):
        """Save model to disk."""
        joblib.dump({
            'model': self.model,
            'encoders': self.encoders,
            'is_trained': self.is_trained,
            'metrics': self.metrics,
            'feature_names': self.feature_names
        }, filepath)
        print(f"Model saved to {filepath}")

    def load(self, filepath: str):
        """Load model from disk."""
        data = joblib.load(filepath)
        self.model = data['model']
        self.encoders = data['encoders']
        self.is_trained = data['is_trained']
        self.metrics = data.get('metrics', {})
        self.feature_names = data.get('feature_names', [])
        print(f"Model loaded from {filepath}")
        return self


# ============================================================
# DEMO: Test the improved model
# ============================================================

if __name__ == "__main__":
    from load_data import load_telco_data, prepare_data

    # Load data
    print("Loading Telco Customer Churn data...")
    raw_data = load_telco_data()
    training_data = prepare_data(raw_data)

    print(f"\nTraining data shape: {training_data.shape}")
    print(f"Features: {list(training_data.columns)}")

    # Train model
    print("\n" + "="*50)
    print("Training XGBoost model...")
    print("="*50)
    model = ChurnModel()
    model.train(training_data)

    # Show feature importance
    print("\n" + "="*50)
    print("Feature Importance (what drives churn):")
    print("="*50)
    importance = model.get_feature_importance()
    for feature, score in importance.items():
        print(f"  {feature}: {score}%")

    # Test predictions
    print("\n" + "="*50)
    print("Testing HIGH RISK customer:")
    print("="*50)
    high_risk = {
        'gender': 'Female',
        'SeniorCitizen': 1,
        'Partner': 'No',
        'Dependents': 'No',
        'tenure': 2,
        'Contract': 'Month-to-month',
        'PaperlessBilling': 'Yes',
        'PaymentMethod': 'Electronic check',
        'InternetService': 'Fiber optic',
        'OnlineSecurity': 'No',
        'TechSupport': 'No',
        'MonthlyCharges': 95.00,
        'TotalCharges': 190.00
    }
    print(f"Customer: {high_risk}")
    print(f"Prediction: {model.predict(high_risk)}")

    print("\n" + "="*50)
    print("Testing LOW RISK customer:")
    print("="*50)
    low_risk = {
        'gender': 'Male',
        'SeniorCitizen': 0,
        'Partner': 'Yes',
        'Dependents': 'Yes',
        'tenure': 60,
        'Contract': 'Two year',
        'PaperlessBilling': 'No',
        'PaymentMethod': 'Bank transfer (automatic)',
        'InternetService': 'DSL',
        'OnlineSecurity': 'Yes',
        'TechSupport': 'Yes',
        'MonthlyCharges': 55.00,
        'TotalCharges': 3300.00
    }
    print(f"Customer: {low_risk}")
    print(f"Prediction: {model.predict(low_risk)}")
