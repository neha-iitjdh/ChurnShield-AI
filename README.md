# ChurnShield AI

A machine learning-powered customer churn prediction system built with FastAPI and XGBoost. The system analyzes customer data to predict churn probability and categorize customers into risk levels.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Model Training](#model-training)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

ChurnShield AI predicts customer churn using an XGBoost classifier trained on the IBM Telco Customer Churn dataset. The model achieves approximately 78% accuracy and provides:

- Individual customer churn probability predictions
- Batch predictions via CSV upload
- Risk level categorization (Low, Medium, High, Critical)
- Feature importance analysis
- Prediction history tracking

## Architecture

```
+-------------------+         +-------------------+
|                   |         |                   |
|  Next.js Frontend | ------> |  FastAPI Backend  |
|  (Vercel)         |   HTTP  |  (Render)         |
|                   |         |                   |
+-------------------+         +--------+----------+
                                       |
                              +--------v----------+
                              |                   |
                              |  XGBoost Model    |
                              |  (Pre-trained)    |
                              |                   |
                              +-------------------+
```

## Features

- **Single Prediction**: Analyze individual customers with 13 input features
- **Batch Prediction**: Upload CSV files for bulk customer analysis
- **Risk Categorization**: Automatic classification into 4 risk levels
- **Model Metrics**: View accuracy, feature importance, and training statistics
- **Prediction History**: Track and analyze past predictions
- **RESTful API**: Full OpenAPI/Swagger documentation

## Tech Stack

### Backend
- Python 3.11
- FastAPI 0.104.0
- XGBoost 2.0.0
- scikit-learn 1.3.0
- pandas 2.0.0
- uvicorn 0.24.0

### Frontend
- Next.js 14
- React 18
- Tailwind CSS

### Infrastructure
- Docker
- Render (API hosting)
- Vercel (Frontend hosting)

## Project Structure

```
ChurnShield-AI/
├── src/
│   ├── api.py              # FastAPI application and endpoints
│   ├── model.py            # XGBoost model class with train/predict
│   ├── load_data.py        # Data loading and preprocessing
│   ├── database.py         # SQLite prediction history storage
│   └── churn_model.joblib  # Pre-trained model file
├── frontend/
│   └── app/                # Next.js application
├── tests/
│   └── test_api.py         # API endpoint tests
├── train_model.py          # Offline model training script
├── Dockerfile              # Container configuration
├── requirements.txt        # Python dependencies
└── README.md
```

## Installation

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend)
- pip

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/neha-iitjdh/ChurnShield-AI.git
cd ChurnShield-AI
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the API:
```bash
uvicorn src.api:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set environment variable:
```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

4. Run development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### Single Customer Prediction

```python
import requests

customer = {
    "gender": "Female",
    "SeniorCitizen": 0,
    "Partner": "No",
    "Dependents": "No",
    "tenure": 12,
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "InternetService": "Fiber optic",
    "OnlineSecurity": "No",
    "TechSupport": "No",
    "MonthlyCharges": 75.50,
    "TotalCharges": 906.00
}

response = requests.post("http://localhost:8000/predict", json=customer)
print(response.json())
# Output: {"churn_probability": 72.34, "risk_level": "High", "will_churn": true}
```

### Batch Prediction

```python
import requests

with open("customers.csv", "rb") as f:
    response = requests.post(
        "http://localhost:8000/predict/batch",
        files={"file": ("customers.csv", f, "text/csv")}
    )
print(response.json())
```

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| GET | `/health` | Health check with model status |
| GET | `/metrics` | Model performance metrics |
| POST | `/predict` | Single customer prediction |
| POST | `/predict/batch` | Batch prediction via CSV |
| GET | `/history` | Prediction history |
| GET | `/history/stats` | History statistics |
| DELETE | `/history/{id}` | Delete prediction |
| DELETE | `/history` | Clear all history |

### Request/Response Examples

#### POST /predict

Request:
```json
{
  "tenure": 12,
  "Contract": "Month-to-month",
  "PaymentMethod": "Electronic check",
  "MonthlyCharges": 75.50,
  "TotalCharges": 906.00
}
```

Response:
```json
{
  "churn_probability": 72.34,
  "risk_level": "High",
  "will_churn": true
}
```

#### GET /metrics

Response:
```json
{
  "accuracy": 78.39,
  "train_samples": 5625,
  "test_samples": 1407,
  "total_samples": 7032,
  "feature_importance": {
    "TotalCharges": 18.45,
    "MonthlyCharges": 15.23,
    "tenure": 14.89,
    "Contract": 12.67
  }
}
```

### Input Features

| Feature | Type | Required | Description |
|---------|------|----------|-------------|
| tenure | integer | Yes | Months with company |
| Contract | string | Yes | Month-to-month, One year, Two year |
| PaymentMethod | string | Yes | Electronic check, Mailed check, Bank transfer, Credit card |
| MonthlyCharges | float | Yes | Monthly charge amount |
| TotalCharges | float | Yes | Total charges to date |
| gender | string | No | Male, Female (default: Male) |
| SeniorCitizen | integer | No | 0 or 1 (default: 0) |
| Partner | string | No | Yes, No (default: No) |
| Dependents | string | No | Yes, No (default: No) |
| PaperlessBilling | string | No | Yes, No (default: Yes) |
| InternetService | string | No | DSL, Fiber optic, No (default: Fiber optic) |
| OnlineSecurity | string | No | Yes, No (default: No) |
| TechSupport | string | No | Yes, No (default: No) |

### Risk Levels

| Probability Range | Risk Level |
|-------------------|------------|
| 0-25% | Low |
| 25-50% | Medium |
| 50-75% | High |
| 75-100% | Critical |

## Model Training

The model is pre-trained and included in the repository. To retrain:

```bash
python train_model.py
```

This will:
1. Download the IBM Telco Customer Churn dataset
2. Preprocess the data (7,032 records, 13 features)
3. Train an XGBoost classifier with 80/20 train/test split
4. Save the model to `src/churn_model.joblib`

### Model Performance

- Algorithm: XGBoost Classifier
- Training Samples: 5,625
- Test Samples: 1,407
- Test Accuracy: 78.39%

### Top Features by Importance

1. TotalCharges
2. MonthlyCharges
3. tenure
4. Contract type
5. PaymentMethod

## Deployment

### Docker

Build and run with Docker:

```bash
docker build -t churnshield-api .
docker run -p 8000:8000 churnshield-api
```

### Render (Recommended)

1. Connect GitHub repository to Render
2. Create new Web Service
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn src.api:app --host 0.0.0.0 --port $PORT`
4. Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8000 |
| TESTING | Skip model init in tests | 0 |

## Testing

Run the test suite:

```bash
pytest tests/ -v
```

Tests cover:
- Root and health endpoints
- Model metrics endpoint
- Single and batch predictions
- Input validation
- Prediction history

## API Documentation

Interactive API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Dataset

This project uses the [IBM Telco Customer Churn dataset](https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv) containing 7,043 customer records with 21 attributes.

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request
