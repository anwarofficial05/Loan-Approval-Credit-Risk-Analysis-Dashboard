"""
Router: ML Model Metrics & Feature Importances
"""

import os
import json
from fastapi import APIRouter, HTTPException
from backend.app.config import METRICS_PATH, FEATURE_IMPORTANCE_PATH
from backend.app.schemas import ModelMetricsResponse

router = APIRouter(prefix="/api/model", tags=["Model"])

@router.get("/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(
            status_code=500,
            detail=f"Model metrics file {METRICS_PATH} not found. Run ml/train_model.py first."
        )

    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        metrics_data = json.load(f)

    app_fi = []
    def_fi = []
    if os.path.exists(FEATURE_IMPORTANCE_PATH):
        with open(FEATURE_IMPORTANCE_PATH, "r", encoding="utf-8") as f:
            fi_data = json.load(f)
            app_fi = fi_data.get("approval_model_coefficients", [])
            def_fi = fi_data.get("default_model_importances", [])

    return ModelMetricsResponse(
        approval_model=metrics_data["approval_model"],
        default_model=metrics_data["default_model"],
        approval_coefficients=app_fi,
        default_importances=def_fi
    )
