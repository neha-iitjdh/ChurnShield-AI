# ChurnShield AI - Railway Deployment Guide

This guide walks you through deploying ChurnShield AI on Railway with two services:
- **API Service** (FastAPI backend)
- **Frontend Service** (Streamlit)

## Prerequisites

1. A [Railway account](https://railway.app) (free tier available)
2. Your code pushed to a GitHub repository
3. (Optional) Trained ML model in the `models/` directory

---

## Step 1: Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select your ChurnShield repository

---

## Step 2: Deploy the API Service (Backend)

### 2.1 Initial Setup
Railway will automatically detect your Python project and start building. The default configuration uses the `Procfile` which runs the FastAPI server.

### 2.2 Configure Environment Variables
In the Railway dashboard for your API service:

1. Go to **Variables** tab
2. Add the following variables:

| Variable | Value | Required |
|----------|-------|----------|
| `SECRET_KEY` | `<generate-a-secure-key>` | Yes |
| `DEBUG` | `false` | No |
| `DATABASE_URL` | `sqlite+aiosqlite:///./churnshield.db` | No |

**Generate a secret key:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2.3 Verify Deployment
- Click on your service to see the deployment logs
- Once deployed, Railway will provide a URL like: `https://churnshield-api-xxxxx.railway.app`
- Test the API: `https://your-api-url.railway.app/docs`

---

## Step 3: Deploy the Frontend Service (Streamlit)

### 3.1 Create a Second Service
1. In your Railway project, click **"+ New"** > **"Service"**
2. Select **"GitHub Repo"** and choose the same repository
3. This creates a second service from the same codebase

### 3.2 Configure the Start Command
In the new service settings:

1. Go to **Settings** tab
2. Under **Deploy** section, find **Custom Start Command**
3. Set it to:
```bash
streamlit run src/frontend/app.py --server.port $PORT --server.address 0.0.0.0 --server.headless true
```

### 3.3 Configure Environment Variables
Add these variables to the frontend service:

| Variable | Value |
|----------|-------|
| `API_BASE_URL` | `https://your-api-url.railway.app` |

### 3.4 Rename Services (Optional)
- Rename the API service to `api` or `backend`
- Rename the frontend service to `frontend` or `web`

---

## Step 4: Generate Public URLs

For each service:
1. Go to **Settings** tab
2. Under **Networking**, click **"Generate Domain"**
3. Railway will create a public URL like `https://your-service.railway.app`

---

## Step 5: Configure CORS (Production)

Update the `CORS_ORIGINS` environment variable in your API service to include your frontend URL:

```
CORS_ORIGINS=["https://your-frontend.railway.app"]
```

Or in `config/settings.py`, update `cors_origins` with your actual frontend URL.

---

## Deployment Verification

### Test the API
```bash
# Health check
curl https://your-api.railway.app/health

# API documentation
open https://your-api.railway.app/docs
```

### Test the Frontend
Open your frontend URL in a browser:
```
https://your-frontend.railway.app
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Railway                             │
│  ┌─────────────────┐         ┌─────────────────────┐    │
│  │  Frontend       │         │  API Service        │    │
│  │  (Streamlit)    │ ──────> │  (FastAPI)          │    │
│  │  Port: $PORT    │         │  Port: $PORT        │    │
│  └─────────────────┘         └─────────────────────┘    │
│         │                            │                   │
│         ▼                            ▼                   │
│  ┌─────────────────┐         ┌─────────────────────┐    │
│  │ Railway Domain  │         │  SQLite Database    │    │
│  │ (Auto-generated)│         │  (In-container)     │    │
│  └─────────────────┘         └─────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Variables Reference

### API Service
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port (auto-set by Railway) | - |
| `SECRET_KEY` | JWT signing key | (required) |
| `DEBUG` | Enable debug mode | `false` |
| `DATABASE_URL` | Database connection string | SQLite |
| `CORS_ORIGINS` | Allowed CORS origins | `["*"]` |

### Frontend Service
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port (auto-set by Railway) | - |
| `API_BASE_URL` | Backend API URL | `http://localhost:8000` |

---

## Production Considerations

### Database
The default SQLite database works for demos but data is lost on redeploy. For production:

1. Add a **PostgreSQL** plugin in Railway:
   - Click **"+ New"** > **"Database"** > **"PostgreSQL"**
   - Railway auto-creates `DATABASE_URL` variable

2. Update your database URL format:
   ```
   DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
   ```

3. Add `asyncpg` to requirements.txt

### ML Model Persistence
The trained model needs to be included in your repository or loaded from external storage:
- **Option 1:** Commit the model files to `models/` directory
- **Option 2:** Use cloud storage (S3, GCS) and download on startup
- **Option 3:** Train on startup (slow cold starts)

### Custom Domain
1. Go to service **Settings** > **Networking**
2. Click **"+ Custom Domain"**
3. Add your domain and configure DNS

---

## Troubleshooting

### Build Fails
- Check build logs in Railway dashboard
- Ensure all dependencies are in `requirements.txt`
- Verify Python version compatibility

### App Crashes on Start
- Check start command is correct
- Verify `PORT` environment variable is used
- Check logs for import/module errors

### API Not Accessible
- Ensure you've generated a public domain
- Check CORS configuration
- Verify health endpoint: `/health`

### Streamlit Shows Errors
- Confirm API_BASE_URL is correct
- Check browser console for CORS errors
- Verify API service is healthy

---

## Cost Estimate

Railway Pricing (as of 2024):
- **Hobby Plan:** $5/month for 500 execution hours
- **Pro Plan:** $20/month for more resources

Two services (API + Frontend) typically use ~1000 hours/month if running 24/7.

---

## Quick Commands

```bash
# Train model locally before deploying
make train

# Test locally with Docker
make docker-up

# View logs
railway logs

# Open deployed app
railway open
```

---

## Support

- [Railway Docs](https://docs.railway.app)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Streamlit Docs](https://docs.streamlit.io)
