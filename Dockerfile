# ============================================================
# Dockerfile - Package our app into a container
# ============================================================
# Think of Docker as a "box" that contains:
# - Python
# - All our dependencies (FastAPI, scikit-learn, etc.)
# - Our code
# This box can run anywhere: your laptop, cloud servers, etc.

# Step 1: Start with Python base image
# This gives us Python 3.11 pre-installed
FROM python:3.11-slim

# Step 2: Set working directory inside the container
# All commands after this run from /app
WORKDIR /app

# Step 3: Copy requirements first (for caching)
# Docker caches layers - if requirements.txt hasn't changed,
# it won't reinstall packages (saves time!)
COPY requirements.txt .

# Step 4: Install Python dependencies
# --no-cache-dir reduces image size
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy our source code
COPY src/ ./src/

# Step 6: Expose port 8000
# This tells Docker our app listens on port 8000
EXPOSE 8000

# Step 7: Set the startup command
# When container starts, run our API
# --host 0.0.0.0 makes it accessible from outside the container
CMD ["python", "-m", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
