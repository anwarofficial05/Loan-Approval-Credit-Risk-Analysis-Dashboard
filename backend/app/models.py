"""
SQLAlchemy ORM Models
"""

from sqlalchemy import Column, String, Integer, Float, Date
from backend.app.db import Base

class LoanApplication(Base):
    __tablename__ = "loan_applications"

    application_id = Column(String, primary_key=True, index=True)
    applicant_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    marital_status = Column(String, nullable=False)
    dependents = Column(Integer, nullable=False)
    education = Column(String, nullable=False)
    self_employed = Column(String, nullable=False)
    applicant_income = Column(Integer, nullable=True)
    coapplicant_income = Column(Integer, nullable=False)
    loan_amount = Column(Integer, nullable=True)
    loan_term_months = Column(Integer, nullable=False)
    interest_rate = Column(Float, nullable=False)
    credit_score = Column(Integer, nullable=False)
    credit_history = Column(Integer, nullable=True)
    existing_emi = Column(Integer, nullable=False)
    property_area = Column(String, nullable=False)
    loan_purpose = Column(String, nullable=False)
    branch_state = Column(String, nullable=False)
    application_date = Column(String, nullable=False)
    loan_status = Column(String, nullable=False)
    default_flag = Column(Integer, nullable=False)

    # Derived fields
    total_income = Column(Integer, nullable=False)
    emi = Column(Integer, nullable=False)
    dti_ratio = Column(Float, nullable=False)
    loan_to_income = Column(Float, nullable=False)
    income_band = Column(String, nullable=False)
    credit_band = Column(String, nullable=False)
    risk_tier = Column(String, nullable=False)
