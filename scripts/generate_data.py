"""
CreditLens Synthetic Data Generator
Generates 50,000 realistic loan applications with calibrated signal for credit risk modeling.
Seed: 42 (reproducible)
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

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

def generate_dataset(n_samples: int = 50000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)

    # First and Last names representing various Indian regions
    first_names_m = [
        "Aarav", "Aditya", "Ajay", "Amit", "Anand", "Arjun", "Dev", "Gaurav", 
        "Karan", "Manish", "Naveen", "Nikhil", "Pranav", "Rahul", "Rajesh", 
        "Ravi", "Rohan", "Sachin", "Sanjay", "Sunil", "Suresh", "Varun", "Vikram", "Vivek"
    ]
    first_names_f = [
        "Aishwarya", "Ananya", "Deepa", "Divya", "Geeta", "Ishita", "Kavita", 
        "Meera", "Neha", "Pooja", "Priya", "Radhika", "Ritu", "Roshni", 
        "Shreya", "Sneha", "Sunita", "Swati", "Tanvi", "Vandana"
    ]
    last_names = [
        "Sharma", "Verma", "Gupta", "Patel", "Mehta", "Deshmukh", "Joshi", "Kulkarni",
        "Nair", "Menon", "Pillai", "Reddy", "Rao", "Choudhury", "Mukherjee", "Banerjee",
        "Singh", "Kaur", "Iyer", "Iyengar", "Bhat", "Hegde", "Mishra", "Pandey"
    ]

    states = [
        "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat", 
        "Uttar Pradesh", "Telangana", "West Bengal", "Rajasthan", "Kerala"
    ]
    state_probs = [0.18, 0.14, 0.12, 0.10, 0.10, 0.09, 0.09, 0.07, 0.06, 0.05]

    purposes = ["Home", "Vehicle", "Personal", "Education", "Business", "Gold"]
    purpose_probs = [0.32, 0.22, 0.18, 0.10, 0.12, 0.06]

    property_areas = ["Urban", "Semiurban", "Rural"]
    area_probs = [0.44, 0.34, 0.22]

    # Pre-generate dates spread from 2023-01-01 to 2025-12-31 with upward trend
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2025, 12, 31)
    total_days = (end_date - start_date).days

    # Polynomial weighting towards recent years for upward trend
    u = np.random.power(1.35, size=n_samples)
    days_offsets = (u * total_days).astype(int)
    app_dates = [start_date + timedelta(days=int(d)) for d in days_offsets]

    # Demographics
    genders = np.random.choice(["Male", "Female"], size=n_samples, p=[0.68, 0.32])
    names = []
    for g in genders:
        first = random.choice(first_names_m) if g == "Male" else random.choice(first_names_f)
        last = random.choice(last_names)
        names.append(f"{first} {last}")

    ages = np.random.randint(21, 66, size=n_samples)
    
    # Marital status correlated with age
    married_prob = np.clip((ages - 21) / 30.0 * 0.75 + 0.15, 0.15, 0.88)
    marital_status = np.where(np.random.rand(n_samples) < married_prob, "Married", "Single")

    # Dependents correlated with marital status and age
    dependents = []
    for m, a in zip(marital_status, ages):
        if m == "Single":
            dep = np.random.choice([0, 1], p=[0.85, 0.15])
        else:
            if a < 30:
                dep = np.random.choice([0, 1, 2], p=[0.40, 0.45, 0.15])
            elif a < 45:
                dep = np.random.choice([0, 1, 2, 3], p=[0.10, 0.35, 0.40, 0.15])
            else:
                dep = np.random.choice([0, 1, 2, 3], p=[0.15, 0.30, 0.35, 0.20])
        dependents.append(int(dep))

    education = np.random.choice(["Graduate", "Not Graduate"], size=n_samples, p=[0.78, 0.22])
    self_employed = np.random.choice(["Yes", "No"], size=n_samples, p=[0.18, 0.82])
    branch_state = np.random.choice(states, size=n_samples, p=state_probs)
    property_area = np.random.choice(property_areas, size=n_samples, p=area_probs)
    loan_purpose = np.random.choice(purposes, size=n_samples, p=purpose_probs)

    # Incomes: Right-skewed lognormal
    # Log-mean ~ 10.7 (median ~ 44,000 INR), right-tailed up to 400,000
    income_raw = np.random.lognormal(mean=10.8, sigma=0.55, size=n_samples)
    # Higher for graduates and older applicants
    grad_boost = np.where(education == "Graduate", 1.25, 0.90)
    age_boost = 0.85 + (ages - 21) / 44.0 * 0.40
    applicant_income = np.clip((income_raw * grad_boost * age_boost).round(-2), 15000, 400000).astype(int)

    # Co-applicant income: 0 for ~40% of rows
    coapplicant_zero = np.random.rand(n_samples) < 0.41
    coapplicant_raw = np.random.lognormal(mean=10.2, sigma=0.6, size=n_samples)
    coapplicant_income = np.where(
        coapplicant_zero, 
        0, 
        np.clip(coapplicant_raw.round(-2), 10000, 250000).astype(int)
    )

    # Loan terms, amounts and interest rates tailored by purpose
    loan_amount = np.zeros(n_samples, dtype=int)
    loan_term_months = np.zeros(n_samples, dtype=int)
    interest_rate = np.zeros(n_samples, dtype=float)

    term_choices = {
        "Home": [120, 180, 240, 360],
        "Vehicle": [36, 60],
        "Personal": [12, 24, 36, 60],
        "Education": [36, 60, 120],
        "Business": [24, 36, 60, 120],
        "Gold": [12, 24, 36]
    }

    for i in range(n_samples):
        purp = loan_purpose[i]
        app_inc = applicant_income[i]
        coapp_inc = coapplicant_income[i]
        tot_inc = app_inc + coapp_inc

        # Terms
        terms = term_choices[purp]
        term = random.choice(terms)
        loan_term_months[i] = term

        # Principal amount correlated with total income and purpose
        if purp == "Home":
            base = tot_inc * random.uniform(25.0, 55.0)
            amt = np.clip(base, 1500000, 10000000)
            rate = round(random.uniform(8.5, 10.5), 2)
        elif purp == "Vehicle":
            base = tot_inc * random.uniform(5.0, 15.0)
            amt = np.clip(base, 250000, 2500000)
            rate = round(random.uniform(9.0, 12.5), 2)
        elif purp == "Personal":
            base = tot_inc * random.uniform(2.0, 8.0)
            amt = np.clip(base, 100000, 1500000)
            rate = round(random.uniform(12.0, 18.5), 2)
        elif purp == "Education":
            base = tot_inc * random.uniform(4.0, 18.0)
            amt = np.clip(base, 200000, 4000000)
            rate = round(random.uniform(9.5, 13.5), 2)
        elif purp == "Business":
            base = tot_inc * random.uniform(6.0, 25.0)
            amt = np.clip(base, 500000, 8000000)
            rate = round(random.uniform(11.5, 16.5), 2)
        else: # Gold
            base = tot_inc * random.uniform(2.0, 10.0)
            amt = np.clip(base, 100000, 2000000)
            rate = round(random.uniform(8.8, 13.5), 2)

        loan_amount[i] = int(round(amt, -3))
        interest_rate[i] = rate

    # Credit score: 300 to 900 (CIBIL distribution centered around 720)
    # Mixture of two beta distributions: one normal credit-worthy, one subprime
    is_subprime = np.random.rand(n_samples) < 0.16
    score_normal = np.random.beta(5.0, 2.0, size=n_samples) * (900 - 620) + 620
    score_subprime = np.random.beta(2.5, 3.0, size=n_samples) * (640 - 300) + 300
    credit_score = np.where(is_subprime, score_subprime, score_normal).round().astype(int)
    credit_score = np.clip(credit_score, 300, 900)

    # Credit history: 0 or 1, strongly driven by credit score
    # Score > 700: 97% positive; Score 600-700: 82% positive; Score < 600: 25% positive
    hist_prob = 1.0 / (1.0 + np.exp(-(credit_score - 615.0) / 28.0))
    credit_history = np.where(np.random.rand(n_samples) < hist_prob, 1, 0)

    # Existing EMI: ~30% have 0, others have 5% to 30% of total income
    has_existing = np.random.rand(n_samples) > 0.32
    tot_inc_arr = applicant_income + coapplicant_income
    existing_emi_ratio = np.random.uniform(0.04, 0.28, size=n_samples)
    existing_emi = np.where(has_existing, (tot_inc_arr * existing_emi_ratio).round(-2), 0).astype(int)

    # Calculate exact EMI and DTI for decisioning
    emis = np.array([
        calculate_amortization_emi(float(p), float(r), int(n))
        for p, r, n in zip(loan_amount, interest_rate, loan_term_months)
    ])
    dti_ratios = (emis + existing_emi) / tot_inc_arr
    lti_ratios = loan_amount / (tot_inc_arr * 12.0)

    # -------------------------------------------------------------
    # Genuine, learnable signal calibration for Approval & Default
    # -------------------------------------------------------------
    # Positive contributors: credit_score, credit_history, graduate, urban
    # Negative contributors: dti_ratio (especially > 0.45), high lti, self_employed
    z_approval = (
        + 2.8 * ((credit_score - 660.0) / 100.0)
        + 2.2 * (credit_history - 0.5)
        - 4.2 * np.maximum(0.0, dti_ratios - 0.40)
        - 2.8 * np.maximum(0.0, dti_ratios - 0.50)
        - 0.35 * np.maximum(0.0, lti_ratios - 4.5)
        + 0.30 * (property_area == "Urban").astype(float)
        + 0.10 * (property_area == "Semiurban").astype(float)
        - 0.25 * (property_area == "Rural").astype(float)
        + 0.15 * (education == "Graduate").astype(float)
        - 0.15 * (self_employed == "Yes").astype(float)
        + 0.08 * ((np.array([d.year for d in app_dates]) - 2023))  # Mild upward trend year-over-year
    )
    # Add modest noise for realism
    noise_app = np.random.normal(0, 0.52, size=n_samples)
    z_approval_total = z_approval + noise_app

    # Find cutoff for exactly ~68.0% approval rate
    target_approval_rate = 0.680
    cutoff = np.percentile(z_approval_total, (1.0 - target_approval_rate) * 100.0)
    approved_mask = z_approval_total >= cutoff
    loan_status = np.where(approved_mask, "Approved", "Rejected")

    # Default model: meaningful for approved loans
    # Driven by high DTI, low credit score, self employment, low income
    z_default = (
        - 2.5 * ((credit_score - 680.0) / 100.0)
        + 3.8 * np.maximum(0.0, dti_ratios - 0.38)
        + 0.45 * (self_employed == "Yes").astype(float)
        - 0.5 * (credit_history - 0.5)
        - 0.3 * ((tot_inc_arr - 60000.0) / 50000.0)
        + 0.2 * (property_area == "Rural").astype(float)
    )
    noise_def = np.random.normal(0, 0.45, size=n_samples)
    z_default_total = z_default + noise_def

    # Only calibrate among approved loans for ~9.0% default rate
    approved_indices = np.where(approved_mask)[0]
    target_default_rate = 0.090
    def_cutoff = np.percentile(z_default_total[approved_indices], (1.0 - target_default_rate) * 100.0)

    default_flag = np.zeros(n_samples, dtype=int)
    for idx in approved_indices:
        if z_default_total[idx] >= def_cutoff:
            default_flag[idx] = 1

    # Format application IDs: LN-2024-000001
    app_ids = [f"LN-{app_dates[i].year}-{i+1:06d}" for i in range(n_samples)]

    df = pd.DataFrame({
        "application_id": app_ids,
        "applicant_name": names,
        "age": ages,
        "gender": genders,
        "marital_status": marital_status,
        "dependents": dependents,
        "education": education,
        "self_employed": self_employed,
        "applicant_income": applicant_income,
        "coapplicant_income": coapplicant_income,
        "loan_amount": loan_amount,
        "loan_term_months": loan_term_months,
        "interest_rate": interest_rate,
        "credit_score": credit_score,
        "credit_history": credit_history,
        "existing_emi": existing_emi,
        "property_area": property_area,
        "loan_purpose": loan_purpose,
        "branch_state": branch_state,
        "application_date": [d.strftime("%Y-%m-%d") for d in app_dates],
        "loan_status": loan_status,
        "default_flag": default_flag
    })

    return df

def inject_missing_values(df: pd.DataFrame, missing_pct: float = 0.04, seed: int = 42) -> pd.DataFrame:
    """Inject ~4% missing values in applicant_income, loan_amount, and credit_history."""
    np.random.seed(seed)
    df_missing = df.copy()
    n = len(df_missing)

    for col in ["applicant_income", "loan_amount", "credit_history"]:
        mask = np.random.rand(n) < missing_pct
        df_missing.loc[mask, col] = np.nan

    return df_missing

def main():
    os.makedirs("data", exist_ok=True)
    os.makedirs("scripts", exist_ok=True)

    print("Generating 50,000 synthetic loan applications...")
    df_clean = generate_dataset(n_samples=50000, seed=42)

    total_apps = len(df_clean)
    approved = (df_clean["loan_status"] == "Approved").sum()
    approval_rate = approved / total_apps * 100.0

    approved_df = df_clean[df_clean["loan_status"] == "Approved"]
    defaults = approved_df["default_flag"].sum()
    default_rate = defaults / len(approved_df) * 100.0

    print(f"Total Applications: {total_apps}")
    print(f"Approved Applications: {approved} ({approval_rate:.2f}%)")
    print(f"Defaults among Approved: {defaults} ({default_rate:.2f}%)")

    # Inject missing values for CSV output
    df_csv = inject_missing_values(df_clean, missing_pct=0.04, seed=42)
    csv_path = os.path.join("data", "loans.csv")
    df_csv.to_csv(csv_path, index=False)
    print(f"Saved dataset with ~4% missing values to {csv_path}")

    # Display missing counts
    print("Missing value counts in CSV:")
    print(df_csv[["applicant_income", "loan_amount", "credit_history"]].isna().sum())

if __name__ == "__main__":
    main()
