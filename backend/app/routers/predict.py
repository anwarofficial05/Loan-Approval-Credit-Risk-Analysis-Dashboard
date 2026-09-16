"""
Router: Real-Time Loan Approval & Risk Prediction Inference Engine
"""

import os
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from backend.app.config import ARTIFACTS_DIR
from backend.app.schemas import PredictRequest, PredictResponse, FactorImpact
from backend.app.calculations import (
    calculate_amortization_emi,
    calculate_dti,
    calculate_lti,
    get_income_band,
    get_credit_band,
    get_risk_tier_from_prob
)

router = APIRouter(prefix="/api/predict", tags=["Prediction"])

APPROVAL_PIPELINE = None
DEFAULT_PIPELINE = None

def get_pipelines():
    global APPROVAL_PIPELINE, DEFAULT_PIPELINE
    if APPROVAL_PIPELINE is None:
        app_path = os.path.join(ARTIFACTS_DIR, "approval_pipeline.joblib")
        if os.path.exists(app_path):
            APPROVAL_PIPELINE = joblib.load(app_path)
        else:
            raise RuntimeError(f"Approval model artifact not found at {app_path}. Run ml/train_model.py first.")

    if DEFAULT_PIPELINE is None:
        def_path = os.path.join(ARTIFACTS_DIR, "default_pipeline.joblib")
        if os.path.exists(def_path):
            DEFAULT_PIPELINE = joblib.load(def_path)
        else:
            raise RuntimeError(f"Default model artifact not found at {def_path}. Run ml/train_model.py first.")

    return APPROVAL_PIPELINE, DEFAULT_PIPELINE

@router.post("", response_model=PredictResponse)
def predict_application(req: PredictRequest):
    app_pipeline, def_pipeline = get_pipelines()

    # Handle missing optional fields with defaults
    app_income = req.applicant_income if req.applicant_income is not None else 48000
    coapp_income = req.coapplicant_income if req.coapplicant_income is not None else 0
    loan_amt = req.loan_amount if req.loan_amount is not None else 1500000
    cred_hist = req.credit_history if req.credit_history is not None else 1

    total_income = app_income + coapp_income
    if total_income <= 0:
        total_income = 15000

    emi = int(round(calculate_amortization_emi(float(loan_amt), float(req.interest_rate), int(req.loan_term_months))))
    dti = calculate_dti(emi, req.existing_emi, total_income)
    lti = calculate_lti(loan_amt, total_income)

    inc_band = get_income_band(total_income)
    cred_band = get_credit_band(req.credit_score)

    input_df = pd.DataFrame([{
        "age": req.age,
        "applicant_income": req.applicant_income,
        "coapplicant_income": coapp_income,
        "loan_amount": req.loan_amount,
        "loan_term_months": req.loan_term_months,
        "interest_rate": req.interest_rate,
        "credit_score": req.credit_score,
        "existing_emi": req.existing_emi,
        "total_income": total_income,
        "emi": emi,
        "dti_ratio": dti,
        "loan_to_income": lti,
        "gender": req.gender,
        "marital_status": req.marital_status,
        "dependents": req.dependents,
        "education": req.education,
        "self_employed": req.self_employed,
        "property_area": req.property_area,
        "loan_purpose": req.loan_purpose,
        "credit_history": cred_hist
    }])

    # 1. Approval Inference
    prob_approved = float(app_pipeline.predict_proba(input_df)[0, 1])
    decision = "Approved" if prob_approved >= 0.50 else "Rejected"

    # 2. Default Inference
    prob_default = float(def_pipeline.predict_proba(input_df)[0, 1])
    risk_tier = get_risk_tier_from_prob(prob_default)

    # 3. Compute Top 5 Contributing Factors (using Logistic Regression weights * scaled feature deviation)
    # Extract coefficients and preprocessor
    preprocessor = app_pipeline.named_steps["preprocessor"]
    clf = app_pipeline.named_steps["classifier"]
    coefs = clf.coef_[0]

    # Preprocess input to find transformed vector
    transformed_features = preprocessor.transform(input_df)[0]
    contributions = transformed_features * coefs

    # Get feature names
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    cat_names = cat_encoder.get_feature_names_out([
        "gender", "marital_status", "dependents", "education",
        "self_employed", "property_area", "loan_purpose", "credit_history"
    ]).tolist()
    feature_names = [
        "age", "applicant_income", "coapplicant_income", "loan_amount",
        "loan_term_months", "interest_rate", "credit_score", "existing_emi",
        "total_income", "emi", "dti_ratio", "loan_to_income"
    ] + cat_names

    # Build factor impact list
    factor_list = []
    for f_name, c_val, raw_w in zip(feature_names, contributions, coefs):
        impact_dir = "Increases Approval Odds" if c_val > 0 else "Reduces Approval Odds"
        
        # Domain-friendly explanation
        if "credit_score" in f_name:
            expl = f"Credit score of {req.credit_score} — {'strong prime score reinforces repayment ability' if req.credit_score >= 700 else 'subprime score indicates past credit vulnerability'}"
            label = f"Credit Score ({req.credit_score})"
        elif "dti_ratio" in f_name:
            expl = f"DTI ratio of {dti:.2f} — {'favorable debt-to-income preserves disposable cash flow' if dti <= 0.40 else 'elevated monthly obligations strain repayment capacity'}"
            label = f"Debt-to-Income Ratio ({dti:.2f})"
        elif "credit_history" in f_name:
            expl = f"Credit history {'clean without delinquency' if cred_hist == 1 else 'contains past defaults/derogatory marks'}"
            label = f"Credit History ({'Clean' if cred_hist == 1 else 'Delinquent'})"
        elif "loan_to_income" in f_name:
            expl = f"Loan-to-income ratio of {lti:.1f}x annual income — {'conservative leverage profile' if lti <= 4.0 else 'aggressive debt burden relative to earnings'}"
            label = f"Loan-to-Income ({lti:.1f}x)"
        elif "total_income" in f_name or "applicant_income" in f_name:
            expl = f"Household monthly income ₹{total_income:,} — {'substantial income base supports debt service' if total_income >= 60000 else 'modest buffer for financial shocks'}"
            label = f"Total Income (₹{total_income:,})"
        elif "property_area" in f_name:
            expl = f"Property location in {req.property_area} region"
            label = f"Property Area ({req.property_area})"
        elif "education" in f_name:
            expl = f"Education level: {req.education} qualification"
            label = f"Education ({req.education})"
        elif "self_employed" in f_name:
            expl = f"Self-employment status: {'fluctuating business revenue profile' if req.self_employed == 'Yes' else 'stable salaried employment income'}"
            label = f"Self-Employed ({req.self_employed})"
        elif "loan_amount" in f_name:
            expl = f"Requested loan facility of ₹{loan_amt:,}"
            label = f"Loan Amount (₹{loan_amt:,})"
        elif "interest_rate" in f_name:
            expl = f"Contractual interest rate of {req.interest_rate:.2f}% p.a."
            label = f"Interest Rate ({req.interest_rate:.2f}%)"
        else:
            expl = f"Applicant profile factor: {f_name.replace('_', ' ').title()}"
            label = f_name.replace('_', ' ').title()

        factor_list.append(FactorImpact(
            factor=label,
            impact=impact_dir,
            weight=round(float(c_val), 3),
            explanation=expl
        ))

    # Sort by absolute contribution weight descending and pick top 5
    top_factors = sorted(factor_list, key=lambda x: abs(x.weight), reverse=True)[:5]

    return PredictResponse(
        approval_probability=round(prob_approved, 4),
        approval_probability_pct=round(prob_approved * 100.0, 1),
        predicted_decision=decision,
        default_probability=round(prob_default, 4),
        default_probability_pct=round(prob_default * 100.0, 1),
        risk_tier=risk_tier,
        computed_emi=emi,
        computed_total_income=total_income,
        computed_dti_ratio=dti,
        computed_loan_to_income=lti,
        income_band=inc_band,
        credit_band=cred_band,
        contributing_factors=top_factors
    )
