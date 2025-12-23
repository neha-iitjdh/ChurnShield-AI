# ChurnShield AI - Production Dockerfile
# Multi-stage build for optimal image size

# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Production image
FROM python:3.11-slim as production

WORKDIR /app

# Create non-root user for security
RUN groupadd -r churnshield && useradd -r -g churnshield churnshield

# Copy Python packages from builder
COPY --from=builder /root/.local /home/churnshield/.local

# Make sure scripts in .local are usable
ENV PATH=/home/churnshield/.local/bin:$PATH

# Copy application code
COPY --chown=churnshield:churnshield . .

# Create necessary directories
RUN mkdir -p /app/data/raw /app/data/processed /app/models /app/logs \
    && chown -R churnshield:churnshield /app

# Switch to non-root user
USER churnshield

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose ports
EXPOSE 8000 8501

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command (can be overridden)
CMD ["python", "-m", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
