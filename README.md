# ChurnShield AI

A production-grade, AI-powered customer churn prediction platform for telecom services.

## Overview

ChurnShield AI is a predictive analytics tool designed to identify at-risk telecom customers and recommend retention strategies, reducing churn rates by up to 20% through proactive interventions.

### Key Features

- **Churn Prediction Engine**: XGBoost-based model with 85%+ accuracy
- **Risk Assessment**: Automatic risk level classification (Low, Medium, High, Critical)
- **Smart Recommendations**: AI-generated retention strategies based on customer profile
- **Interactive Dashboard**: Professional Streamlit UI for data visualization
- **Batch Processing**: Upload CSV/Excel files for bulk predictions
- **REST API**: FastAPI backend for integration with existing systems
- **User Authentication**: JWT-based authentication with role-based access control

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **Frontend**: Streamlit, Plotly
- **ML**: scikit-learn, XGBoost, imbalanced-learn (SMOTE)
- **Database**: SQLite (default), PostgreSQL (production)
- **Deployment**: Docker, Nginx

## Quick Start

### Prerequisites

- Python 3.9+
- pip or conda

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/churnshield-ai.git
   cd churnshield-ai
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv

   # Windows
   .\venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Train the model**
   ```bash
   python scripts/train_model.py

   # Or with custom data
   python scripts/train_model.py --data path/to/your/data.csv
   ```

6. **Run the application**

   **Option A: Run both services**
   ```bash
   # Terminal 1 - API
   python scripts/run_api.py

   # Terminal 2 - Frontend
   python scripts/run_frontend.py
   ```

   **Option B: Using Docker**
   ```bash
   docker-compose up -d
   ```

7. **Access the application**
   - Frontend: http://localhost:8501
   - API Docs: http://localhost:8000/docs
   - API ReDoc: http://localhost:8000/redoc

## Project Structure

```
churnshield-ai/
├── config/
│   ├── __init__.py
│   └── settings.py          # Application configuration
├── data/
│   ├── raw/                  # Raw data files
│   └── processed/            # Processed data files
├── models/                   # Trained model files
├── nginx/
│   └── nginx.conf           # Nginx configuration
├── scripts/
│   ├── run_api.py           # API server script
│   ├── run_frontend.py      # Frontend server script
│   └── train_model.py       # Model training script
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py      # Authentication routes
│   │   │   ├── predictions.py # Prediction routes
│   │   │   └── analytics.py # Analytics routes
│   │   ├── auth.py          # Auth utilities
│   │   ├── database.py      # Database models
│   │   ├── main.py          # FastAPI application
│   │   └── models.py        # Pydantic schemas
│   ├── frontend/
│   │   ├── components/
│   │   │   ├── charts.py    # Plotly charts
│   │   │   └── styles.py    # CSS styling
│   │   └── app.py           # Streamlit application
│   ├── ml/
│   │   ├── model.py         # XGBoost model
│   │   ├── predictor.py     # Prediction service
│   │   ├── preprocessing.py # Data preprocessing
│   │   └── train.py         # Training script
│   └── utils/               # Utility functions
├── tests/                    # Test files
├── .env.example             # Environment template
├── .gitignore
├── docker-compose.yml       # Docker compose config
├── Dockerfile               # Docker build file
├── pyproject.toml           # Python project config
├── README.md
└── requirements.txt         # Python dependencies
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get token
- `GET /api/v1/auth/me` - Get current user info

### Predictions
- `POST /api/v1/predictions/single` - Single customer prediction
- `POST /api/v1/predictions/batch` - Batch predictions
- `POST /api/v1/predictions/upload` - Upload file for predictions
- `GET /api/v1/predictions/history` - Get prediction history

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard data
- `GET /api/v1/analytics/model/metrics` - Model performance
- `GET /api/v1/analytics/model/features` - Feature importance

## Data Format

### Required Columns

| Column | Type | Description |
|--------|------|-------------|
| gender | string | Male/Female |
| SeniorCitizen | int | 0 or 1 |
| Partner | string | Yes/No |
| Dependents | string | Yes/No |
| tenure | int | Months with company |
| PhoneService | string | Yes/No |
| MultipleLines | string | Yes/No/No phone service |
| InternetService | string | DSL/Fiber optic/No |
| OnlineSecurity | string | Yes/No/No internet service |
| OnlineBackup | string | Yes/No/No internet service |
| DeviceProtection | string | Yes/No/No internet service |
| TechSupport | string | Yes/No/No internet service |
| StreamingTV | string | Yes/No/No internet service |
| StreamingMovies | string | Yes/No/No internet service |
| Contract | string | Month-to-month/One year/Two year |
| PaperlessBilling | string | Yes/No |
| PaymentMethod | string | Electronic check/Mailed check/Bank transfer/Credit card |
| MonthlyCharges | float | Monthly charge amount |
| TotalCharges | float | Total charges to date |

## Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# With production profile (includes Nginx)
docker-compose --profile production up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SECRET_KEY | JWT secret key | (required) |
| DATABASE_URL | Database connection string | sqlite |
| API_HOST | API host | 0.0.0.0 |
| API_PORT | API port | 8000 |
| DEBUG | Debug mode | false |

### Production Checklist

- [ ] Set strong `SECRET_KEY`
- [ ] Configure SSL/TLS certificates
- [ ] Set up PostgreSQL database
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation
- [ ] Set up backup strategy

## Model Performance

| Metric | Value |
|--------|-------|
| Accuracy | >85% |
| Precision | >80% |
| Recall | >75% |
| ROC-AUC | >0.85 |
| PR-AUC | >0.80 |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the team at support@churnshield.ai
