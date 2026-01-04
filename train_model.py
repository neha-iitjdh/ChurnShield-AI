"""
Offline model training script.
Run this once to train and save the model.
"""
import sys
sys.path.insert(0, 'src')

from model import ChurnModel
from load_data import load_telco_data, prepare_data

print("=" * 50)
print("ChurnShield AI - Offline Model Training")
print("=" * 50)

# Load data
print("\nLoading Telco Customer Churn data...")
raw_data = load_telco_data()
training_data = prepare_data(raw_data)
print(f"Training data shape: {training_data.shape}")

# Train model
print("\nTraining XGBoost model...")
model = ChurnModel()
model.train(training_data)

# Save model
model.save("src/churn_model.joblib")

print("\n" + "=" * 50)
print("Model saved to src/churn_model.joblib")
print("Commit and push this file to deploy!")
print("=" * 50)
