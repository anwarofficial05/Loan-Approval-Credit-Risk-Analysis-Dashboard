"""
Integration & Contract Tests for all FastAPI Endpoints
Verifies 200 OK status codes and correct response schemas.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["records_count"] == 50000
    assert data["approval_model_loaded"] is True
    assert data["default_model_loaded"] is True

def test_kpis_endpoint():
    response = client.get("/api/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "total_applications" in data
    assert "approval_rate_pct" in data
    assert "total_disbursed_inr" in data
    assert "default_rate_pct" in data
    assert data["total_applications"]["value"] == 50000
    assert abs(data["approval_rate_pct"]["value"] - 68.0) < 1.0

def test_queries_list_endpoint():
    response = client.get("/api/queries")
    assert response.status_code == 200
    queries = response.json()
    assert len(queries) == 12
    for q in queries:
        assert "id" in q
        assert "title" in q
        assert "sql" in q
        assert "business_question" in q

def test_query_execution_endpoint():
    # Test executing Query 1 (Overall Portfolio KPIs)
    response = client.post("/api/queries/1/run")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["row_count"] == 1
    assert "total_applications" in data["columns"]
    assert data["execution_ms"] > 0

    # Test executing Query 5 (Top 5 Branch States with Rank)
    response = client.post("/api/queries/5/run")
    assert response.status_code == 200
    data5 = response.json()
    assert data5["success"] is True
    assert data5["row_count"] <= 5

    # Test invalid query id
    response_invalid = client.post("/api/queries/99/run")
    assert response_invalid.status_code == 404

def test_applications_paginated_endpoint():
    response = client.get("/api/applications?page=1&page_size=20")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] == 50000
    assert data["page"] == 1
    assert data["page_size"] == 20
    assert len(data["items"]) == 20

    # Test with search & status filter
    res_filtered = client.get("/api/applications?loan_status=Approved&page_size=10")
    assert res_filtered.status_code == 200
    data_filtered = res_filtered.json()
    assert all(item["loan_status"] == "Approved" for item in data_filtered["items"])

def test_single_application_detail():
    # First get an application ID
    list_res = client.get("/api/applications?page=1&page_size=1")
    app_id = list_res.json()["items"][0]["application_id"]

    response = client.get(f"/api/applications/{app_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["application_id"] == app_id
    assert "dti_ratio" in data
    assert "emi" in data
    assert "risk_tier" in data

def test_charts_endpoints():
    chart_names = [
        "monthly_disbursement",
        "approval_by_credit_band",
        "loan_purpose_distribution",
        "default_by_income_band",
        "state_disbursement",
        "segmentation_matrix"
    ]
    for cname in chart_names:
        res = client.get(f"/api/charts/{cname}")
        assert res.status_code == 200, f"Failed on chart {cname}"
        items = res.json()
        assert isinstance(items, list)
        assert len(items) > 0

def test_model_metrics_endpoint():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "approval_model" in data
    assert "default_model" in data
    assert data["approval_model"]["accuracy"] >= 0.80
    assert data["approval_model"]["roc_auc"] >= 0.85
    assert len(data["approval_coefficients"]) > 0
