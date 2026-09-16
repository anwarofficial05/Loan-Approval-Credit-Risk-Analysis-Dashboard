"""
CreditLens FastAPI Main Application
"""

import os
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import CORS_ORIGINS, DB_PATH, ARTIFACTS_DIR
from backend.app.schemas import HealthResponse
from backend.app.routers import kpis, queries, applications, charts, predict, model_info

app = FastAPI(
    title="CreditLens — Loan Approval & Credit Risk Analytics API",
    description="Enterprise Credit Risk Analytics, Raw SQL Intelligence & ML Underwriting Engine",
    version="1.0.0"
)

# Enable CORS for Vite dev server and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all subrouters under /api
app.include_router(kpis.router)
app.include_router(queries.router)
app.include_router(applications.router)
app.include_router(charts.router)
app.include_router(predict.router)
app.include_router(model_info.router)

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Health status check verifying database and ML model readiness."""
    db_connected = False
    row_count = 0
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(str(DB_PATH))
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM loan_applications")
            row_count = cur.fetchone()[0]
            conn.close()
            db_connected = True
        except Exception:
            db_connected = False

    app_model_exists = os.path.exists(os.path.join(ARTIFACTS_DIR, "approval_pipeline.joblib"))
    def_model_exists = os.path.exists(os.path.join(ARTIFACTS_DIR, "default_pipeline.joblib"))

    return HealthResponse(
        status="healthy" if (db_connected and app_model_exists and def_model_exists) else "degraded",
        database=f"Connected ({row_count} records)" if db_connected else "Disconnected",
        records_count=row_count,
        approval_model_loaded=app_model_exists,
        default_model_loaded=def_model_exists
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
