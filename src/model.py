"""
Simple ML model for churn prediction.
This is the BRAIN of our application.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib


class ChurnModel:
    """
    A simple churn prediction model.

    What it does:
    1. Takes customer data (tenure, charges, contract type, etc.)
    2. Predicts if they will churn (leave) or not
    3. Returns probability (0-100%)
    """

    def __init__(self):
        # The actual ML model (Random Forest - like many decision trees voting)
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)

        # Encoders to convert text to numbers (ML needs numbers, not text)
        self.encoders = {}

        # Track if model is trained
        self.is_trained = False

    def train(self, data: pd.DataFrame):
        """
        Train the model on historical customer data.

        Args:
            data: DataFrame with columns like tenure, MonthlyCharges, Contract, Churn
        """
        # Make a copy so we don't modify original
        df = data.copy()

        # Separate features (X) and target (y)
        # X = what we use to predict (tenure, charges, etc.)
        # y = what we're predicting (Churn: Yes/No)
        X = df.drop('Churn', axis=1)
        y = df['Churn']

        # Convert text columns to numbers
        # Example: "Month-to-month" → 0, "One year" → 1, "Two year" → 2
        for column in X.select_dtypes(include=['object']).columns:
            self.encoders[column] = LabelEncoder()
            X[column] = self.encoders[column].fit_transform(X[column])

        # Convert target (Churn) to numbers: "Yes" → 1, "No" → 0
        self.encoders['Churn'] = LabelEncoder()
        y = self.encoders['Churn'].fit_transform(y)

        # Train the model
        self.model.fit(X, y)
        self.is_trained = True

        print(f"Model trained on {len(df)} samples")
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

        # Convert dict to DataFrame (model expects DataFrame)
        df = pd.DataFrame([customer_data])

        # Encode text columns using same encoders from training
        for column in df.select_dtypes(include=['object']).columns:
            if column in self.encoders:
                df[column] = self.encoders[column].transform(df[column])

        # Get prediction probability
        # predict_proba returns [[prob_no_churn, prob_churn]]
        proba = self.model.predict_proba(df)[0]
        churn_probability = proba[1]  # Probability of churn (index 1)

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
            "churn_probability": round(churn_probability * 100, 2),  # As percentage
            "risk_level": risk_level,
            "will_churn": churn_probability >= 0.5
        }

    def save(self, filepath: str):
        """Save model to disk."""
        joblib.dump({
            'model': self.model,
            'encoders': self.encoders,
            'is_trained': self.is_trained
        }, filepath)
        print(f"Model saved to {filepath}")

    def load(self, filepath: str):
        """Load model from disk."""
        data = joblib.load(filepath)
        self.model = data['model']
        self.encoders = data['encoders']
        self.is_trained = data['is_trained']
        print(f"Model loaded from {filepath}")
        return self


# ============================================================
# DEMO: Test the model with REAL data
# ============================================================

if __name__ == "__main__":
    # Import our data loader
    from load_data import load_telco_data, prepare_data

    # Load REAL data from IBM's dataset
    print("Loading real Telco Customer Churn data...")
    raw_data = load_telco_data()
    training_data = prepare_data(raw_data)

    print(f"\nTraining data shape: {training_data.shape}")
    print(training_data.head())

    # Create and train model
    print("\n" + "="*50)
    print("Training model on REAL data...")
    print("="*50)
    model = ChurnModel()
    model.train(training_data)

    # Test prediction with a HIGH RISK customer
    print("\n" + "="*50)
    print("Testing prediction - HIGH RISK customer:")
    print("="*50)
    high_risk_customer = {
        'tenure': 2,                              # New customer (only 2 months)
        'MonthlyCharges': 89.50,                  # High monthly bill
        'TotalCharges': 179.00,                   # Low total (new customer)
        'Contract': 'Month-to-month',             # No commitment!
        'PaymentMethod': 'Electronic check'       # Risky payment method
    }

    result = model.predict(high_risk_customer)
    print(f"Customer: {high_risk_customer}")
    print(f"Prediction: {result}")

    # Test prediction with a LOW RISK customer
    print("\n" + "="*50)
    print("Testing prediction - LOW RISK customer:")
    print("="*50)
    low_risk_customer = {
        'tenure': 60,                             # Long-time customer (5 years!)
        'MonthlyCharges': 45.00,                  # Moderate bill
        'TotalCharges': 2700.00,                  # High total (loyal customer)
        'Contract': 'Two year',                   # Long commitment
        'PaymentMethod': 'Bank transfer (automatic)'  # Stable payment
    }

    result = model.predict(low_risk_customer)
    print(f"Customer: {low_risk_customer}")
    print(f"Prediction: {result}")
