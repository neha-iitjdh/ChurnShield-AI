# ChurnShield AI - Free Deployment Guide

Deploy ChurnShield AI for **free** using:
- **Streamlit Cloud** - Frontend (completely free for public repos)
- **Render** - API backend (free tier: 750 hours/month)

---

## Option 1: Streamlit Cloud Only (Simplest)

If you just want the frontend demo (with mock predictions):

### Steps:
1. Push your code to GitHub (public repo)
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Click **"New app"**
4. Select your repository
5. Set **Main file path**: `src/frontend/app.py`
6. Click **"Deploy"**

**That's it!** Your app will be live at `https://your-app.streamlit.app`

---

## Option 2: Full Stack (Frontend + API)

### Part A: Deploy API on Render (Free)

#### Step 1: Create Render Account
1. Go to [render.com](https://render.com) and sign up (free)
2. Connect your GitHub account

#### Step 2: Deploy API
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `churnshield-api`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

4. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `SECRET_KEY` | Click "Generate" |
   | `DEBUG` | `false` |

5. Click **"Create Web Service"**

#### Step 3: Get Your API URL
After deployment, Render provides a URL like:
```
https://churnshield-api.onrender.com
```

Test it: `https://your-api.onrender.com/docs`

---

### Part B: Deploy Frontend on Streamlit Cloud

#### Step 1: Go to Streamlit Cloud
1. Visit [share.streamlit.io](https://share.streamlit.io)
2. Sign in with GitHub

#### Step 2: Deploy the App
1. Click **"New app"**
2. Select your repository
3. Set **Main file path**: `src/frontend/app.py`
4. Click **"Advanced settings"** and add:
   ```
   API_BASE_URL = https://your-api.onrender.com
   ```
5. Click **"Deploy"**

Your frontend will be live at: `https://your-app.streamlit.app`

---

## Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   Streamlit Cloud       │     │      Render (Free)      │
│   (Free - Unlimited)    │────▶│                         │
│                         │     │   FastAPI Backend       │
│   Frontend App          │     │   /api/v1/*             │
│   your-app.streamlit.app│     │   your-api.onrender.com │
└─────────────────────────┘     └─────────────────────────┘
```

---

## Free Tier Limits

### Streamlit Cloud
- **Unlimited** for public repositories
- 1 private app on free tier
- Auto-sleeps after inactivity (quick wake-up)

### Render Free Tier
- 750 hours/month (enough for ~31 days if one service)
- Auto-sleeps after 15 minutes of inactivity
- ~30 second cold start when waking up
- 512 MB RAM, 0.1 CPU

---

## Important Notes

### Render Sleep Behavior
Free tier services sleep after 15 min of inactivity. First request after sleep takes ~30 seconds. Solutions:
- Use a free cron service to ping `/health` every 14 minutes
- Upgrade to paid ($7/month) for always-on

### Database Persistence
SQLite data is **not persistent** on Render free tier (lost on redeploy). For persistent data:
- Use Render's free PostgreSQL (90 days, then $7/month)
- Use [Supabase](https://supabase.com) free tier (500MB PostgreSQL)
- Use [PlanetScale](https://planetscale.com) free tier (MySQL)

### ML Model
Include trained model in your repo's `models/` directory, or the app will run without predictions.

Train locally first:
```bash
make train
```

Then commit the model files.

---

## Quick Deployment Checklist

- [ ] Code pushed to public GitHub repo
- [ ] ML model trained and in `models/` directory
- [ ] Deploy API to Render
- [ ] Copy Render API URL
- [ ] Deploy frontend to Streamlit Cloud
- [ ] Add `API_BASE_URL` in Streamlit secrets
- [ ] Test both endpoints

---

## Troubleshooting

### "Module not found" errors
Ensure all dependencies are in `requirements.txt`

### API returns 503
Render free tier is sleeping. Wait 30 seconds and retry.

### CORS errors in browser
Update `cors_origins` in `config/settings.py` with your Streamlit URL:
```python
cors_origins: list = ["https://your-app.streamlit.app"]
```

### Streamlit shows connection error
Check that `API_BASE_URL` secret is set correctly in Streamlit Cloud.

---

## Alternative Free Options

| Platform | Frontend | Backend | Notes |
|----------|----------|---------|-------|
| **Streamlit Cloud** | Yes | No | Best for Streamlit apps |
| **Render** | Yes | Yes | 750 hrs/month, sleeps |
| **Koyeb** | Yes | Yes | 2 nano instances free |
| **Fly.io** | Yes | Yes | 3 shared VMs free |
| **Hugging Face Spaces** | Yes | No | Great for ML demos |

---

## Support

- [Streamlit Cloud Docs](https://docs.streamlit.io/streamlit-community-cloud)
- [Render Docs](https://render.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
