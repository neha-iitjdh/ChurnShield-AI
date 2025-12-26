# ChurnShield AI - Detailed Project Summary

## Executive Overview

ChurnShield AI is an enterprise-grade predictive analytics platform designed to identify at-risk telecom customers and recommend data-driven retention strategies. By leveraging advanced machine learning techniques, the platform aims to reduce customer churn rates by up to 20% through proactive interventions.

---

## Table of Contents

1. [Business Context](#business-context)
2. [Technical Architecture](#technical-architecture)
3. [Machine Learning Pipeline](#machine-learning-pipeline)
4. [API Documentation](#api-documentation)
5. [Frontend Application](#frontend-application)
6. [Database Schema](#database-schema)
7. [Deployment Guide](#deployment-guide)
8. [Security Considerations](#security-considerations)
9. [Performance Metrics](#performance-metrics)
10. [Future Roadmap](#future-roadmap)

---

## Business Context

### Problem Statement

Customer churn is one of the most critical challenges facing telecom companies. Acquiring new customers costs 5-25x more than retaining existing ones. Traditional reactive approaches to churn management result in:

- Lost revenue from departing customers
- Wasted marketing spend on ineffective retention campaigns
- Inability to prioritize high-value at-risk customers

### Solution Value Proposition

ChurnShield AI addresses these challenges by:

1. **Predicting churn before it happens** - Identify at-risk customers weeks or months in advance
2. **Prioritizing retention efforts** - Focus resources on high-risk, high-value customers
3. **Providing actionable recommendations** - Generate personalized retention strategies
4. **Enabling data-driven decisions** - Track trends and measure intervention effectiveness

### Target Users

| User Role | Primary Use Cases |
|-----------|-------------------|
| **Telecom Analysts** | Upload customer data, generate predictions, export reports |
| **Marketing Teams** | Design targeted retention campaigns based on risk segments |
| **Customer Success** | Prioritize outreach to at-risk customers |
| **Executives** | Monitor churn KPIs and retention program ROI |

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX (Reverse Proxy)                     │
│                    Port 80/443 - Load Balancing                  │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│      FastAPI Backend        │   │    Streamlit Frontend       │
│         Port 8000           │   │        Port 8501            │
│                             │   │                             │
│  • REST API Endpoints       │   │  • Interactive Dashboard    │
│  • JWT Authentication       │   │  • Data Visualization       │
│  • Request Validation       │   │  • File Upload Interface    │
│  • Rate Limiting            │   │  • Report Generation        │
└─────────────────────────────┘   └─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ML Prediction Service                        │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Preprocessor│──│ XGBoost     │──│ Recommendation Engine   │  │
│  │ (sklearn)   │  │ Model       │  │ (Rule-based + ML)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SQLite/PostgreSQL Database                    │
│                                                                  │
│  • User accounts & authentication                                │
│  • Prediction logs & history                                     │
│  • Model versions & metrics                                      │
│  • Customer records                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Streamlit 1.28+ | Interactive web dashboard |
| **Visualization** | Plotly 5.18+ | Charts, gauges, and graphs |
| **Backend API** | FastAPI 0.104+ | REST API with async support |
| **Authentication** | python-jose, passlib | JWT tokens, bcrypt hashing |
| **Database ORM** | SQLAlchemy 2.0+ | Async database operations |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Data persistence |
| **ML Framework** | scikit-learn 1.3+, XGBoost 2.0+ | Model training & inference |
| **Data Handling** | Pandas 2.0+, NumPy 1.24+ | Data processing |
| **Class Balancing** | imbalanced-learn 0.11+ | SMOTE oversampling |
| **Containerization** | Docker, Docker Compose | Deployment packaging |
| **Reverse Proxy** | Nginx | Load balancing, SSL termination |

### Directory Structure

```
ChurnShield-AI/
│
├── config/                          # Configuration Management
│   ├── __init__.py
│   └── settings.py                  # Pydantic settings with env support
│
├── data/                            # Data Storage
│   ├── raw/                         # Original uploaded datasets
│   └── processed/                   # Cleaned/transformed data
│
├── models/                          # Trained Model Artifacts
│   ├── churn_model_v1.joblib        # Serialized XGBoost model
│   └── preprocessor_v1.joblib       # Fitted sklearn preprocessor
│
├── nginx/                           # Web Server Configuration
│   └── nginx.conf                   # Reverse proxy settings
│
├── scripts/                         # Utility Scripts
│   ├── run_api.py                   # Launch FastAPI server
│   ├── run_frontend.py              # Launch Streamlit app
│   └── train_model.py               # Model training entry point
│
├── src/                             # Source Code
│   │
│   ├── api/                         # Backend API Layer
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   ├── predictions.py       # Prediction endpoints
│   │   │   └── analytics.py         # Analytics endpoints
│   │   ├── __init__.py
│   │   ├── auth.py                  # JWT & password utilities
│   │   ├── database.py              # SQLAlchemy models
│   │   ├── main.py                  # FastAPI application
│   │   └── models.py                # Pydantic request/response schemas
│   │
│   ├── frontend/                    # Frontend Layer
│   │   ├── components/
│   │   │   ├── __init__.py
│   │   │   ├── charts.py            # Plotly chart components
│   │   │   └── styles.py            # CSS and styling utilities
│   │   ├── pages/
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   └── app.py                   # Main Streamlit application
│   │
│   ├── ml/                          # Machine Learning Layer
│   │   ├── __init__.py
│   │   ├── model.py                 # XGBoost model wrapper
│   │   ├── predictor.py             # High-level prediction service
│   │   ├── preprocessing.py         # Data preprocessing pipeline
│   │   └── train.py                 # Training script
│   │
│   └── utils/                       # Shared Utilities
│       └── __init__.py
│
├── tests/                           # Test Suite
│   ├── __init__.py
│   ├── test_api.py                  # API endpoint tests
│   ├── test_model.py                # ML model tests
│   └── test_preprocessing.py        # Preprocessing tests
│
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── .dockerignore                    # Docker ignore rules
├── .streamlit/config.toml           # Streamlit configuration
├── docker-compose.yml               # Multi-container orchestration
├── Dockerfile                       # Container build instructions
├── LICENSE                          # MIT License
├── Makefile                         # Development commands
├── pyproject.toml                   # Python project metadata
├── README.md                        # Quick start guide
├── PROJECT_SUMMARY.md               # This document
└── requirements.txt                 # Python dependencies
```

---

## Machine Learning Pipeline

### Data Requirements

The model expects customer data with the following 19 features:

| Feature | Type | Description | Example Values |
|---------|------|-------------|----------------|
| `gender` | Categorical | Customer gender | Male, Female |
| `SeniorCitizen` | Binary | Is senior citizen (65+) | 0, 1 |
| `Partner` | Categorical | Has partner | Yes, No |
| `Dependents` | Categorical | Has dependents | Yes, No |
| `tenure` | Numeric | Months with company | 0-72 |
| `PhoneService` | Categorical | Has phone service | Yes, No |
| `MultipleLines` | Categorical | Has multiple lines | Yes, No, No phone service |
| `InternetService` | Categorical | Internet type | DSL, Fiber optic, No |
| `OnlineSecurity` | Categorical | Has online security | Yes, No, No internet service |
| `OnlineBackup` | Categorical | Has online backup | Yes, No, No internet service |
| `DeviceProtection` | Categorical | Has device protection | Yes, No, No internet service |
| `TechSupport` | Categorical | Has tech support | Yes, No, No internet service |
| `StreamingTV` | Categorical | Has streaming TV | Yes, No, No internet service |
| `StreamingMovies` | Categorical | Has streaming movies | Yes, No, No internet service |
| `Contract` | Categorical | Contract type | Month-to-month, One year, Two year |
| `PaperlessBilling` | Categorical | Uses paperless billing | Yes, No |
| `PaymentMethod` | Categorical | Payment method | Electronic check, Mailed check, Bank transfer, Credit card |
| `MonthlyCharges` | Numeric | Monthly charge amount | 18.00 - 120.00 |
| `TotalCharges` | Numeric | Total charges to date | 0.00 - 8000.00+ |

### Preprocessing Pipeline

```
Raw Data → Data Cleaning → Feature Engineering → Encoding → Scaling → Model Input
```

1. **Data Cleaning**
   - Handle missing `TotalCharges` values (impute with `MonthlyCharges × tenure`)
   - Convert `SeniorCitizen` to integer
   - Remove `customerID` (not a predictive feature)

2. **Feature Engineering**
   - Numerical features: `tenure`, `MonthlyCharges`, `TotalCharges`
   - Categorical features: All other columns (16 features)

3. **Encoding & Scaling**
   - Numerical: StandardScaler (zero mean, unit variance)
   - Categorical: OneHotEncoder (creates ~45 binary features)

### Model Architecture

**Algorithm**: XGBoost Classifier (Gradient Boosting)

**Hyperparameters**:
```python
{
    'n_estimators': 200,        # Number of boosting rounds
    'max_depth': 6,             # Maximum tree depth
    'learning_rate': 0.1,       # Step size shrinkage
    'subsample': 0.8,           # Row sampling ratio
    'colsample_bytree': 0.8,    # Column sampling ratio
    'min_child_weight': 3,      # Minimum sum of instance weight
    'gamma': 0.1,               # Minimum loss reduction for split
    'reg_alpha': 0.1,           # L1 regularization
    'reg_lambda': 1.0,          # L2 regularization
    'scale_pos_weight': 1,      # Balance positive/negative weights
    'eval_metric': 'logloss'    # Evaluation metric
}
```

**Class Imbalance Handling**: SMOTE (Synthetic Minority Over-sampling Technique)
- Creates synthetic samples for the minority class (churned customers)
- Improves recall without losing precision significantly

### Model Outputs

For each prediction, the model returns:

| Output | Description |
|--------|-------------|
| `churn_probability` | Float 0.0-1.0, probability of churn |
| `churn_risk_score` | Integer 0-100, risk score percentage |
| `risk_level` | Enum: Low (<25%), Medium (25-50%), High (50-75%), Critical (>75%) |
| `will_churn` | Boolean, True if probability >= threshold (default 0.5) |
| `confidence` | Float 0.0-1.0, model confidence in prediction |
| `feature_importance` | Dict, top factors contributing to risk |
| `recommendations` | List, personalized retention actions |

### Recommendation Engine

The recommendation engine generates personalized retention strategies based on:

1. **Risk Level** - Higher risk triggers more aggressive offers
2. **Customer Profile** - Contract type, services, payment method
3. **Top Risk Factors** - Features contributing most to churn probability

**Sample Recommendations**:

| Trigger Condition | Recommendation |
|-------------------|----------------|
| Month-to-month contract | Offer 15-20% discount for annual contract upgrade |
| Tenure < 12 months | Schedule customer success call |
| Fiber optic without security | Bundle add-on services at discount |
| Electronic check payment | Offer $5/month for auto-pay switch |
| Monthly charges > $80 | Apply loyalty discount or service optimization |
| Senior citizen | Enroll in dedicated senior support program |
| Critical risk (>75%) | Urgent retention call with 25% discount authority |

---

## API Documentation

### Base URL

- Development: `http://localhost:8000`
- Production: `https://your-domain.com`

### Authentication

All endpoints except `/health`, `/live`, `/ready`, and `/docs` require JWT authentication.

**Obtaining a Token**:
```bash
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=your_username&password=your_password
```

**Using the Token**:
```bash
GET /api/v1/predictions/history
Authorization: Bearer <your_jwt_token>
```

### Endpoint Reference

#### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login (form data) |
| `POST` | `/api/v1/auth/token` | Login (JSON body) |
| `GET` | `/api/v1/auth/me` | Get current user info |
| `POST` | `/api/v1/auth/logout` | Logout (client-side) |

#### Prediction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/predictions/single` | Single customer prediction |
| `POST` | `/api/v1/predictions/batch` | Batch predictions (JSON) |
| `POST` | `/api/v1/predictions/upload` | Upload file for predictions |
| `GET` | `/api/v1/predictions/history` | Get prediction history |
| `GET` | `/api/v1/predictions/stats` | Get prediction statistics |

#### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics/dashboard` | Dashboard aggregate data |
| `GET` | `/api/v1/analytics/model/metrics` | Model performance metrics |
| `GET` | `/api/v1/analytics/model/features` | Feature importance |
| `GET` | `/api/v1/analytics/users/activity` | User activity stats |
| `GET` | `/api/v1/analytics/trends/churn-factors` | Churn factor analysis |
| `GET` | `/api/v1/analytics/export` | Export prediction data |

#### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |
| `GET` | `/ready` | Readiness probe |
| `GET` | `/live` | Liveness probe |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/redoc` | ReDoc documentation |

### Sample API Requests

**Single Prediction**:
```bash
curl -X POST "http://localhost:8000/api/v1/predictions/single" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "Female",
    "SeniorCitizen": 0,
    "Partner": "Yes",
    "Dependents": "No",
    "tenure": 12,
    "PhoneService": "Yes",
    "MultipleLines": "No",
    "InternetService": "Fiber optic",
    "OnlineSecurity": "No",
    "OnlineBackup": "Yes",
    "DeviceProtection": "No",
    "TechSupport": "No",
    "StreamingTV": "Yes",
    "StreamingMovies": "No",
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "MonthlyCharges": 85.50,
    "TotalCharges": 1026.00
  }'
```

**Sample Response**:
```json
{
  "customer_id": null,
  "churn_probability": 0.6823,
  "churn_risk_score": 68,
  "risk_level": "High",
  "will_churn": true,
  "confidence": 0.3646,
  "feature_importance": {
    "Contract_Month-to-month": 0.1842,
    "tenure": 0.1523,
    "InternetService_Fiber optic": 0.1105,
    "OnlineSecurity_No": 0.0891,
    "PaymentMethod_Electronic check": 0.0734
  },
  "recommendations": [
    {
      "priority": 1,
      "action": "Offer Annual Contract",
      "description": "Offer a 15-20% discount for upgrading to a one-year or two-year contract",
      "expected_impact": "Reduces churn by 30-40% for high-risk customers"
    },
    {
      "priority": 2,
      "action": "Bundle Add-on Services",
      "description": "Offer discounted security, backup, and tech support bundle",
      "expected_impact": "Increases stickiness and reduces churn by 20%"
    }
  ],
  "prediction_timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Frontend Application

### Page Overview

#### 1. Login Page
- User authentication with username/password
- Registration for new users
- Demo mode for quick exploration

#### 2. Dashboard (Home)
- **Summary Metrics**: Total customers, churn rate, at-risk count, model accuracy
- **Risk Distribution**: Pie chart of Low/Medium/High/Critical segments
- **Churn Trend**: 30-day trend line of average churn probability
- **Top Churn Factors**: Horizontal bar chart of feature importance
- **Recent Predictions**: Table of latest prediction results

#### 3. Single Prediction
- **Input Form**: All 19 customer features with appropriate widgets
- **Results Display**:
  - Gauge chart showing risk score (0-100%)
  - Risk level badge (color-coded)
  - Personalized recommendations with priority ranking

#### 4. Batch Prediction
- **File Upload**: Drag-and-drop CSV/Excel upload
- **Data Preview**: First 10 rows of uploaded data
- **Batch Results**:
  - Summary statistics (total, high-risk, average probability)
  - Risk distribution pie chart
  - Scatter plot of all predictions
  - Downloadable results CSV

#### 5. Analytics
- **Model Performance**: Accuracy, precision, recall, ROC-AUC metrics
- **Confusion Matrix**: Heatmap visualization
- **Metrics Radar Chart**: Multi-dimensional performance view
- **Churn Insights**: Key statistics about churned customer patterns

#### 6. Settings
- **Model Settings**: Prediction threshold, risk level boundaries
- **Notifications**: Email alerts configuration
- **Profile**: User information and password management

### UI/UX Design

**Color Palette**:
- Primary: `#667eea` (Purple-blue gradient)
- Secondary: `#764ba2` (Deep purple)
- Success/Low Risk: `#48bb78` (Green)
- Warning/Medium Risk: `#ed8936` (Orange)
- Danger/High Risk: `#f56565` (Red)
- Critical Risk: `#c53030` (Dark red)

**Design Principles**:
- Clean, modern interface with card-based layout
- Responsive design for various screen sizes
- Consistent color coding for risk levels
- Animated transitions for better UX
- Professional typography (Inter font)

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│     users       │       │   prediction_logs   │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │──────<│ user_id (FK)        │
│ email           │       │ id (PK)             │
│ username        │       │ customer_id         │
│ full_name       │       │ input_data (JSON)   │
│ hashed_password │       │ churn_probability   │
│ is_active       │       │ risk_level          │
│ role            │       │ will_churn          │
│ created_at      │       │ feature_importance  │
│ updated_at      │       │ recommendations     │
└─────────────────┘       │ created_at          │
                          └─────────────────────┘

┌─────────────────────┐   ┌─────────────────────┐
│  customer_records   │   │   model_versions    │
├─────────────────────┤   ├─────────────────────┤
│ id (PK)             │   │ id (PK)             │
│ customer_id (UK)    │   │ version (UK)        │
│ gender              │   │ accuracy            │
│ senior_citizen      │   │ precision           │
│ partner             │   │ recall              │
│ dependents          │   │ f1_score            │
│ tenure              │   │ roc_auc             │
│ phone_service       │   │ pr_auc              │
│ ... (all features)  │   │ training_samples    │
│ churn_probability   │   │ is_active           │
│ risk_level          │   │ model_path          │
│ last_prediction_at  │   │ training_config     │
│ created_at          │   │ created_at          │
│ updated_at          │   └─────────────────────┘
└─────────────────────┘
```

### User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access: user management, model retraining, all analytics |
| `analyst` | Predictions, analytics, exports, model metrics |
| `viewer` | Read-only access to predictions and basic analytics |

---

## Deployment Guide

### Local Development

```bash
# 1. Clone and setup
git clone <repository-url>
cd churnshield-ai
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Train model (uses sample data if no file provided)
python scripts/train_model.py

# 5. Run services
python scripts/run_api.py      # Terminal 1: API on :8000
python scripts/run_frontend.py # Terminal 2: Frontend on :8501
```

### Docker Deployment

```bash
# Development (API + Frontend)
docker-compose up -d

# Production (with Nginx)
docker-compose --profile production up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Checklist

- [ ] **Security**
  - [ ] Generate strong `SECRET_KEY` (`openssl rand -hex 32`)
  - [ ] Configure SSL/TLS certificates
  - [ ] Set proper CORS origins (not `*`)
  - [ ] Enable rate limiting in Nginx
  - [ ] Review and restrict file upload sizes

- [ ] **Database**
  - [ ] Migrate from SQLite to PostgreSQL
  - [ ] Set up connection pooling
  - [ ] Configure automated backups
  - [ ] Index frequently queried columns

- [ ] **Infrastructure**
  - [ ] Set up health check monitoring
  - [ ] Configure log aggregation (ELK/CloudWatch)
  - [ ] Set up metrics collection (Prometheus)
  - [ ] Configure auto-scaling policies

- [ ] **ML Operations**
  - [ ] Set up model versioning (MLflow)
  - [ ] Configure automated retraining pipeline
  - [ ] Monitor model drift
  - [ ] A/B testing infrastructure

---

## Security Considerations

### Authentication & Authorization

- **Password Storage**: bcrypt hashing with salt
- **Token Management**: JWT with configurable expiration (default 30 min)
- **Role-Based Access**: Admin, Analyst, Viewer permission levels

### Data Protection

- **Input Validation**: Pydantic models for all API inputs
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **XSS Protection**: Streamlit's built-in sanitization
- **File Upload Security**: Type validation, size limits (10MB)

### Infrastructure Security

- **Rate Limiting**: Nginx-level throttling (10 req/s API, 30 req/s general)
- **HTTPS**: TLS 1.2+ with strong cipher suites
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Container Security**: Non-root user, minimal base image

---

## Performance Metrics

### Model Performance Targets

| Metric | Target | Typical Achievement |
|--------|--------|---------------------|
| Accuracy | >85% | 87-92% |
| Precision | >80% | 82-89% |
| Recall | >75% | 78-85% |
| F1 Score | >78% | 80-87% |
| ROC-AUC | >0.85 | 0.88-0.94 |
| PR-AUC | >0.80 | 0.82-0.90 |

### API Performance Targets

| Metric | Target |
|--------|--------|
| Single prediction latency | <200ms |
| Batch prediction (1000 records) | <5s |
| API availability | 99.9% |
| Concurrent users | 100+ |

### System Requirements

**Minimum (Development)**:
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB

**Recommended (Production)**:
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- Network: 100Mbps+

---

## Future Roadmap

### Phase 2 Enhancements

- [ ] **Real-time Predictions**: WebSocket API for streaming predictions
- [ ] **CRM Integration**: Salesforce, HubSpot connectors
- [ ] **Advanced Analytics**: Cohort analysis, customer segmentation
- [ ] **Model Improvements**: Deep learning models (TabNet, Neural Networks)

### Phase 3 Expansion

- [ ] **Multi-tenant Support**: Organization-level isolation
- [ ] **Custom Model Training**: User-uploaded training data
- [ ] **Automated Retraining**: Scheduled model updates with drift detection
- [ ] **A/B Testing**: Built-in experimentation framework

### Phase 4 Enterprise

- [ ] **SSO Integration**: SAML, OAuth2 providers
- [ ] **Audit Logging**: Comprehensive activity tracking
- [ ] **API Gateway**: Kong/AWS API Gateway integration
- [ ] **White-labeling**: Custom branding options

---

## Support & Contributing

### Getting Help

- **Documentation**: This file and `README.md`
- **API Docs**: http://localhost:8000/docs
- **Issues**: GitHub Issues tracker

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Ensure all tests pass (`pytest tests/`)
5. Submit Pull Request

### License

MIT License - See [LICENSE](LICENSE) for details.

---

*ChurnShield AI v1.0.0 - Built with Python, FastAPI, Streamlit, and XGBoost*
