"""
Unit & Inference Tests for Real-Time Prediction Endpoint
Tests standard cases, edge cases, and missing optional fields.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_prediction_strong_applicant():
    payload = {
        "applicant_name": "Aarav Patel",
        "age": 35,
        "gender": "Male",
        "marital_status": "Married",
        "dependents": 1,
        "education": "Graduate",
        "self_employed": "No",
        "applicant_income": 95000,
        "coapplicant_income": 45000,
        "loan_amount": 3500000,
        "loan_term_months": 240,
        "interest_rate": 8.75,
        "credit_score": 785,
        "credit_history": 1,
        "existing_emi": 8000,
        "property_area": "Urban",
        "loan_purpose": "Home",
        "branch_state": "Maharashtra"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_decision"] == "Approved"
    assert data["approval_probability"] > 0.70
    assert data["risk_tier"] in ["Low", "Medium"]
    assert len(data["contributing_factors"]) == 5
    for f in data["contributing_factors"]:
        assert "factor" in f
        assert "impact" in f
        assert "weight" in f
        assert "explanation" in f

def test_prediction_high_risk_applicant():
    payload = {
        "applicant_name": "Ravi Verma",
        "age": 28,
        "gender": "Male",
        "marital_status": "Single",
        "dependents": 0,
        "education": "Not Graduate",
        "self_employed": "Yes",
        "applicant_income": 22000,
        "coapplicant_income": 0,
        "loan_amount": 800000,
        "loan_term_months": 24,
        "interest_rate": 16.5,
        "credit_score": 480,
        "credit_history": 0,
        "existing_emi": 11000,
        "property_area": "Rural",
        "loan_purpose": "Personal",
        "branch_state": "Uttar Pradesh"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_decision"] == "Rejected"
    assert data["approval_probability"] < 0.35
    assert data["risk_tier"] in ["Medium", "High"]

def test_prediction_missing_optional_fields():
    # applicant_income, loan_amount, and credit_history omitted or None
    payload = {
        "applicant_name": "Sunita Rao",
        "age": 40,
        "gender": "Female",
        "marital_status": "Married",
        "dependents": 2,
        "education": "Graduate",
        "self_employed": "No",
        "applicant_income": None,
        "coapplicant_income": 25000,
        "loan_amount": None,
        "loan_term_months": 180,
        "interest_rate": 9.25,
        "credit_score": 710,
        "credit_history": None,
        "existing_emi": 5000,
        "property_area": "Semiurban",
        "loan_purpose": "Home",
        "branch_state": "Karnataka"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_decision" in data
    assert "approval_probability" in data
    assert "default_probability" in data
    assert "risk_tier" in data
    assert data["computed_emi"] > 0
    assert len(data["contributing_factors"]) == 5
