"""
Data loader for Telco Customer Churn dataset.
This downloads the REAL dataset from IBM's GitHub.
"""

import pandas as pd

# URL to the real Telco Customer Churn dataset
DATASET_URL = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"


def load_telco_data() -> pd.DataFrame:
    """
    Download and load the Telco Customer Churn dataset.

    Returns:
        DataFrame with customer data
    """
    print("Downloading Telco Customer Churn dataset...")
    print(f"URL: {DATASET_URL}")

    # pandas can read directly from URL!
    df = pd.read_csv(DATASET_URL)

    print(f"Downloaded {len(df)} customer records")
    print(f"Columns: {list(df.columns)}")

    return df


def prepare_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and prepare the data for training.

    What we do:
    1. Remove customerID (not useful for prediction)
    2. Fix TotalCharges (has some blank values)
    3. Select key features for our simple model

    Args:
        df: Raw dataframe

    Returns:
        Cleaned dataframe ready for training
    """
    # Make a copy
    df = df.copy()

    # TotalCharges has some blank strings - convert to numeric
    # Blank values become NaN (Not a Number)
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')

    # Drop rows with missing TotalCharges (only 11 rows)
    df = df.dropna(subset=['TotalCharges'])

    # For our SIMPLE model, let's use just the most important features
    # We can add more later!
    key_features = [
        'tenure',           # How long they've been a customer
        'MonthlyCharges',   # Their monthly bill
        'TotalCharges',     # Total amount paid
        'Contract',         # Contract type (month-to-month is high risk!)
        'PaymentMethod',    # How they pay
        'Churn'             # TARGET: Did they leave?
    ]

    df = df[key_features]

    print(f"\nPrepared data shape: {df.shape}")
    print(f"Churn distribution:\n{df['Churn'].value_counts()}")

    return df


# ============================================================
# DEMO: Test data loading
# ============================================================

if __name__ == "__main__":
    # Load data
    raw_data = load_telco_data()

    print("\n" + "="*50)
    print("Raw Data Sample:")
    print("="*50)
    print(raw_data.head())

    # Prepare data
    clean_data = prepare_data(raw_data)

    print("\n" + "="*50)
    print("Clean Data Sample:")
    print("="*50)
    print(clean_data.head())
