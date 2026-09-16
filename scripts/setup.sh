#!/usr/bin/env bash
# CreditLens — Automated End-to-End Setup Script
# Creates virtualenv, installs dependencies, seeds 50,000 loans, initializes database, and trains ML models.

set -e

echo "================================================================================"
echo "CreditLens: Initializing Production Environment"
echo "================================================================================"

# 1. Create Python virtual environment if not present
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment in ./venv..."
    python3 -m venv venv
fi

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install Python dependencies
echo "Installing backend and ML dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# 4. Generate 50,000 synthetic loans dataset
echo "Generating 50,000 synthetic loans (seed 42)..."
python scripts/generate_data.py

# 5. Build SQLite database and calculate derived underwriting fields
echo "Creating SQLite database schema and loading data..."
python scripts/setup_db.py

# 6. Train Machine Learning Models
echo "Training ML models (Logistic Regression & Random Forest) and saving metrics..."
python ml/train_model.py

# 7. Run backend tests
echo "Executing test suite..."
pytest backend/tests

# 8. Install frontend dependencies and build
echo "Installing frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

echo "================================================================================"
echo "Setup Complete! Start CreditLens with two commands:"
echo "1. Backend:  uvicorn backend.app.main:app --reload --port 8000"
echo "2. Frontend: cd frontend && npm run dev"
echo "================================================================================"
