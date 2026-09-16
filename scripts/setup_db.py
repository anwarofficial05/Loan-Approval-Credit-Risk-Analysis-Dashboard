"""
CreditLens Database Setup Script
Creates SQLite database from schema.sql, loads data/loans.csv, computes derived fields,
and builds optimized query indices.
"""

import os
import sqlite3
import pandas as pd
import numpy as np

def calculate_amortization_emi(principal: float, annual_rate_pct: float, tenure_months: int) -> float:
    """Standard amortization formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)"""
    if tenure_months <= 0 or principal <= 0:
        return 0.0
    r = (annual_rate_pct / 100.0) / 12.0
    if r == 0:
        return principal / tenure_months
    factor = (1.0 + r) ** tenure_months
    emi = principal * r * factor / (factor - 1.0)
    return emi

def get_income_band(income: float) -> str:
    if income < 25000:
        return "<25k"
    elif income < 50000:
        return "25k-50k"
    elif income < 100000:
        return "50k-100k"
    elif income < 200000:
        return "100k-200k"
    else:
        return "200k+"

def get_credit_band(score: int) -> str:
    if score < 580:
        return "Poor (<580)"
    elif score <= 669:
        return "Fair (580-669)"
    elif score <= 739:
        return "Good (670-739)"
    elif score <= 799:
        return "Very Good (740-799)"
    else:
        return "Excellent (800+)"

def get_risk_tier(default_flag: int, credit_score: int, dti_ratio: float, status: str) -> str:
    if default_flag == 1 or credit_score < 580 or dti_ratio > 0.48 or status == "Rejected":
        if credit_score < 550 or dti_ratio > 0.52 or default_flag == 1:
            return "High"
        return "Medium"
    elif credit_score < 680 or dti_ratio > 0.38:
        return "Medium"
    else:
        return "Low"

def setup_database(csv_path: str = "data/loans.csv", db_path: str = "data/loans.db", schema_path: str = "sql/schema.sql"):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Source data file {csv_path} not found. Run scripts/generate_data.py first.")

    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)

    # Compute derived fields using median imputation where nulls exist
    median_income = df["applicant_income"].median()
    median_loan = df["loan_amount"].median()

    imputed_app_income = df["applicant_income"].fillna(median_income).values
    coapp_income = df["coapplicant_income"].values
    total_income = imputed_app_income + coapp_income

    imputed_loan_amount = df["loan_amount"].fillna(median_loan).values
    interest_rates = df["interest_rate"].values
    terms = df["loan_term_months"].values
    existing_emis = df["existing_emi"].values
    credit_scores = df["credit_score"].values
    default_flags = df["default_flag"].values
    statuses = df["loan_status"].values

    emis = np.array([
        int(round(calculate_amortization_emi(float(p), float(r), int(n))))
        for p, r, n in zip(imputed_loan_amount, interest_rates, terms)
    ])

    dti_ratios = np.round((emis + existing_emis) / total_income, 4)
    lti_ratios = np.round(imputed_loan_amount / (total_income * 12.0), 3)

    income_bands = [get_income_band(inc) for inc in total_income]
    credit_bands = [get_credit_band(cs) for cs in credit_scores]
    risk_tiers = [
        get_risk_tier(int(df_flag), int(cs), float(dti), st)
        for df_flag, cs, dti, st in zip(default_flags, credit_scores, dti_ratios, statuses)
    ]

    df["total_income"] = total_income.astype(int)
    df["emi"] = emis
    df["dti_ratio"] = dti_ratios
    df["loan_to_income"] = lti_ratios
    df["income_band"] = income_bands
    df["credit_band"] = credit_bands
    df["risk_tier"] = risk_tiers

    # Ensure data directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Execute schema DDL
    print(f"Executing schema from {schema_path}...")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cursor.executescript(schema_sql)

    # Insert data
    print(f"Inserting {len(df)} rows into {db_path}...")
    df.to_sql("loan_applications", conn, if_exists="append", index=False)

    conn.commit()

    # Verification query
    cursor.execute("SELECT COUNT(*) FROM loan_applications")
    row_count = cursor.fetchone()[0]

    cursor.execute("SELECT loan_status, COUNT(*) FROM loan_applications GROUP BY loan_status")
    status_counts = cursor.fetchall()

    cursor.execute("SELECT risk_tier, COUNT(*) FROM loan_applications GROUP BY risk_tier")
    risk_counts = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM loan_applications WHERE applicant_income IS NULL")
    null_income_count = cursor.fetchone()[0]

    conn.close()

    print("\nDatabase setup complete!")
    print(f"Total rows in DB: {row_count}")
    print(f"Status breakdown: {status_counts}")
    print(f"Risk tier breakdown: {risk_counts}")
    print(f"Preserved NULL applicant_income rows: {null_income_count}")

if __name__ == "__main__":
    setup_database()
