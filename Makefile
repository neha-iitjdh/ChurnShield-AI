# ChurnShield AI - Makefile
# Common commands for development and deployment

.PHONY: help install dev train api frontend docker-build docker-up docker-down test lint clean

# Default target
help:
	@echo "ChurnShield AI - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Install development dependencies"
	@echo "  make train       - Train the ML model"
	@echo "  make api         - Run the FastAPI server"
	@echo "  make frontend    - Run the Streamlit frontend"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linters"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - Clean temporary files"

# Install dependencies
install:
	pip install -r requirements.txt

# Install development dependencies
dev:
	pip install -r requirements.txt
	pip install pytest pytest-asyncio pytest-cov black ruff mypy pre-commit

# Train the model
train:
	python scripts/train_model.py

# Train with custom data
train-data:
	@read -p "Enter path to data file: " DATA_PATH; \
	python scripts/train_model.py --data $$DATA_PATH

# Run the API server
api:
	python scripts/run_api.py

# Run the Streamlit frontend
frontend:
	python scripts/run_frontend.py

# Build Docker images
docker-build:
	docker-compose build

# Start Docker containers
docker-up:
	docker-compose up -d

# Start Docker containers with logs
docker-up-logs:
	docker-compose up

# Stop Docker containers
docker-down:
	docker-compose down

# Start with production profile
docker-prod:
	docker-compose --profile production up -d

# View Docker logs
docker-logs:
	docker-compose logs -f

# Run tests
test:
	pytest tests/ -v --cov=src --cov-report=term-missing

# Run tests with coverage report
test-cov:
	pytest tests/ -v --cov=src --cov-report=html
	@echo "Coverage report generated in htmlcov/"

# Run linters
lint:
	ruff check src/ tests/
	black --check src/ tests/

# Format code
format:
	black src/ tests/
	ruff check --fix src/ tests/

# Type checking
typecheck:
	mypy src/

# Clean temporary files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true

# Initialize the database
init-db:
	python -c "import asyncio; from src.api.database import init_db; asyncio.run(init_db())"

# Create sample data
sample-data:
	python -c "from src.ml.preprocessing import get_sample_data; df = get_sample_data(); df.to_csv('data/raw/sample_data.csv', index=False); print('Sample data saved to data/raw/sample_data.csv')"
