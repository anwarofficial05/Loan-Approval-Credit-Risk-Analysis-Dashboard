@echo off
REM CreditLens — Windows Automated End-to-End Setup Script
REM Creates virtualenv, installs dependencies, seeds 50,000 loans, initializes database, and trains ML models.

echo ================================================================================
echo CreditLens: Initializing Production Environment (Windows)
echo ================================================================================

REM 1. Create Python virtual environment if not present
if not exist "venv" (
    echo Creating Python virtual environment in .\venv...
    python -m venv venv
)

REM 2. Activate virtual environment
call venv\Scripts\activate.bat

REM 3. Install Python dependencies
echo Installing backend and ML dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

REM 4. Generate 50,000 synthetic loans dataset
echo Generating 50,000 synthetic loans (seed 42)...
python scripts\generate_data.py

REM 5. Build SQLite database and calculate derived underwriting fields
echo Creating SQLite database schema and loading data...
python scripts\setup_db.py

REM 6. Train Machine Learning Models
echo Training ML models (Logistic Regression and Random Forest) and saving metrics...
python ml\train_model.py

REM 7. Run backend tests
echo Executing backend test suite...
pytest backend\tests

REM 8. Install frontend dependencies and build
echo Installing frontend dependencies...
cd frontend
call npm install
call npm run build
cd ..

echo ================================================================================
echo Setup Complete! Start CreditLens with two commands:
echo 1. Backend:  uvicorn backend.app.main:app --reload --port 8000
echo 2. Frontend: cd frontend ^&^& npm run dev
echo ================================================================================
pause
