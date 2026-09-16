"""
Application Configuration and Path Constants
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "loans.db"
ML_DIR = BASE_DIR / "ml"
ARTIFACTS_DIR = ML_DIR / "artifacts"
METRICS_PATH = ML_DIR / "metrics.json"
FEATURE_IMPORTANCE_PATH = ML_DIR / "feature_importance.json"

DATABASE_URL = f"sqlite:///{DB_PATH}"

# CORS origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]
