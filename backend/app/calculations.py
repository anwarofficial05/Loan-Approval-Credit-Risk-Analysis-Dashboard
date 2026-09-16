"""
Financial and Risk Calculation Utilities
Provides amortization math, DTI/LTI ratios, and tier bucketing.
"""

def calculate_amortization_emi(principal: float, annual_rate_pct: float, tenure_months: int) -> float:
    """
    Standard monthly amortization formula:
    EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    where r is monthly interest rate: (annual_rate_pct / 100) / 12
    """
    if tenure_months <= 0 or principal <= 0:
        return 0.0
    r = (annual_rate_pct / 100.0) / 12.0
    if r <= 0:
        return principal / tenure_months
    factor = (1.0 + r) ** tenure_months
    emi = principal * r * factor / (factor - 1.0)
    return emi

def calculate_dti(emi: float, existing_emi: float, total_income: float) -> float:
    """
    Debt-to-Income ratio: (New EMI + Existing EMI) / Total Monthly Income
    """
    if total_income <= 0:
        return 1.0
    return round((emi + existing_emi) / total_income, 4)

def calculate_lti(loan_amount: float, total_income: float) -> float:
    """
    Loan-to-Income ratio: Loan Amount / (Total Monthly Income * 12)
    """
    if total_income <= 0:
        return 0.0
    return round(loan_amount / (total_income * 12.0), 3)

def get_income_band(income: float) -> str:
    """
    Bucket total income into standard banking income segments.
    """
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
    """
    Categorize CIBIL credit score into standard risk bands.
    """
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

def get_risk_tier_from_prob(default_prob: float) -> str:
    """
    Assign Low / Medium / High risk tier from model default probability
    (calibrated for class_weight='balanced' model output).
    """
    if default_prob < 0.45:
        return "Low"
    elif default_prob < 0.65:
        return "Medium"
    else:
        return "High"

