"""
Unit Tests for Financial & Risk Calculations
"""

import pytest
from backend.app.calculations import (
    calculate_amortization_emi,
    calculate_dti,
    calculate_lti,
    get_income_band,
    get_credit_band,
    get_risk_tier_from_prob
)

def test_calculate_amortization_emi_standard():
    # 1,000,000 principal, 12% per annum, 12 months tenure
    # r = 0.01. Formula gives ~ 88848.79
    emi = calculate_amortization_emi(1000000.0, 12.0, 12)
    assert round(emi, 2) == 88848.79

def test_calculate_amortization_emi_home_loan():
    # 5,000,000 principal, 9% annual, 240 months (20 years)
    emi = calculate_amortization_emi(5000000.0, 9.0, 240)
    assert round(emi, 0) == 44986.0

def test_calculate_amortization_zero_or_negative():
    assert calculate_amortization_emi(0.0, 10.0, 12) == 0.0
    assert calculate_amortization_emi(100000.0, 10.0, 0) == 0.0
    assert calculate_amortization_emi(-50000.0, 10.0, 12) == 0.0

def test_calculate_dti():
    # EMI 25,000 + existing 5,000 on 60,000 income = 30000/60000 = 0.50
    dti = calculate_dti(25000, 5000, 60000)
    assert dti == 0.5

    # Zero total income should return 1.0 (maximum risk ratio)
    assert calculate_dti(10000, 5000, 0) == 1.0

def test_calculate_lti():
    # 2,400,000 loan on 50,000 monthly income (600,000 annual) -> 4.0
    lti = calculate_lti(2400000, 50000)
    assert lti == 4.0
    assert calculate_lti(1000000, 0) == 0.0

def test_income_bands():
    assert get_income_band(18000) == "<25k"
    assert get_income_band(35000) == "25k-50k"
    assert get_income_band(75000) == "50k-100k"
    assert get_income_band(150000) == "100k-200k"
    assert get_income_band(350000) == "200k+"

def test_credit_bands():
    assert get_credit_band(450) == "Poor (<580)"
    assert get_credit_band(620) == "Fair (580-669)"
    assert get_credit_band(710) == "Good (670-739)"
    assert get_credit_band(770) == "Very Good (740-799)"
    assert get_credit_band(830) == "Excellent (800+)"

def test_risk_tier_from_prob():
    assert get_risk_tier_from_prob(0.35) == "Low"
    assert get_risk_tier_from_prob(0.55) == "Medium"
    assert get_risk_tier_from_prob(0.75) == "High"

