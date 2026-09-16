"""
Pydantic Schemas for Request & Response Payloads
"""

from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# ==========================================
# Health & General
# ==========================================
class HealthResponse(BaseModel):
    status: str
    database: str
    records_count: int
    approval_model_loaded: bool
    default_model_loaded: bool

# ==========================================
# KPIs
# ==========================================
class KPIMetric(BaseModel):
    value: Union[int, float]
    formatted: str
    delta_pct: Optional[float] = None
    trend_direction: Optional[str] = None  # 'up', 'down', 'neutral'

class PortfolioKPIsResponse(BaseModel):
    total_applications: KPIMetric
    approved_applications: KPIMetric
    approval_rate_pct: KPIMetric
    total_disbursed_inr: KPIMetric
    avg_ticket_size_inr: KPIMetric
    default_rate_pct: KPIMetric
    avg_credit_score: KPIMetric

# ==========================================
# SQL Queries
# ==========================================
class QueryItem(BaseModel):
    id: int
    title: str
    category: str
    technique: str
    business_question: str
    sql: str

class QueryRunResponse(BaseModel):
    id: int
    title: str
    business_question: str
    success: bool
    execution_ms: float
    row_count: int
    columns: List[str]
    rows: List[Dict[str, Any]]
    error: Optional[str] = None

# ==========================================
# Applications
# ==========================================
class ApplicationListItem(BaseModel):
    application_id: str
    applicant_name: str
    age: int
    gender: str
    education: str
    total_income: int
    loan_amount: int
    loan_term_months: int
    interest_rate: float
    credit_score: int
    credit_band: str
    dti_ratio: float
    loan_purpose: str
    branch_state: str
    application_date: str
    loan_status: str
    risk_tier: str

class PaginatedApplicationsResponse(BaseModel):
    total_count: int
    page: int
    page_size: int
    total_pages: int
    items: List[ApplicationListItem]

class ApplicationDetailResponse(BaseModel):
    application_id: str
    applicant_name: str
    age: int
    gender: str
    marital_status: str
    dependents: int
    education: str
    self_employed: str
    applicant_income: Optional[int]
    coapplicant_income: int
    total_income: int
    loan_amount: Optional[int]
    loan_term_months: int
    interest_rate: float
    credit_score: int
    credit_history: Optional[int]
    existing_emi: int
    property_area: str
    loan_purpose: str
    branch_state: str
    application_date: str
    loan_status: str
    default_flag: int
    emi: int
    dti_ratio: float
    loan_to_income: float
    income_band: str
    credit_band: str
    risk_tier: str

# ==========================================
# Charts
# ==========================================
class MonthlyDisbursementPoint(BaseModel):
    month: str
    approved_count: int
    total_applications: int
    disbursed_inr: float
    moving_avg_3m_inr: float

class CreditBandPoint(BaseModel):
    credit_band: str
    total_applications: int
    approved_count: int
    approval_rate_pct: float
    avg_credit_score: float

class LoanPurposePoint(BaseModel):
    loan_purpose: str
    applications: int
    approved: int
    disbursed_inr: float
    share_pct: float

class DefaultRateIncomePoint(BaseModel):
    income_band: str
    urban_default_pct: float
    semiurban_default_pct: float
    rural_default_pct: float
    overall_default_pct: float

class StateDisbursementPoint(BaseModel):
    branch_state: str
    approved_count: int
    disbursed_inr: float
    rank: int

class SegmentationMatrixCell(BaseModel):
    credit_band: str
    income_band: str
    approval_rate_pct: float
    total_count: int

# ==========================================
# Prediction / Underwriting
# ==========================================
class FactorImpact(BaseModel):
    factor: str
    impact: str  # "Increases Approval Odds" or "Reduces Approval Odds"
    weight: float
    explanation: str

class PredictRequest(BaseModel):
    applicant_name: str = "Priya Sharma"
    age: int = Field(32, ge=21, le=65)
    gender: str = "Female"
    marital_status: str = "Married"
    dependents: int = Field(1, ge=0, le=3)
    education: str = "Graduate"
    self_employed: str = "No"
    applicant_income: Optional[int] = Field(65000, ge=0)
    coapplicant_income: int = Field(30000, ge=0)
    loan_amount: Optional[int] = Field(2500000, ge=50000)
    loan_term_months: int = Field(180, ge=12, le=360)
    interest_rate: float = Field(8.75, ge=5.0, le=30.0)
    credit_score: int = Field(745, ge=300, le=900)
    credit_history: Optional[int] = Field(1, ge=0, le=1)
    existing_emi: int = Field(12000, ge=0)
    property_area: str = "Urban"
    loan_purpose: str = "Home"
    branch_state: str = "Maharashtra"

class PredictResponse(BaseModel):
    approval_probability: float
    approval_probability_pct: float
    predicted_decision: str  # "Approved" or "Rejected"
    default_probability: float
    default_probability_pct: float
    risk_tier: str  # "Low", "Medium", "High"
    computed_emi: int
    computed_total_income: int
    computed_dti_ratio: float
    computed_loan_to_income: float
    income_band: str
    credit_band: str
    contributing_factors: List[FactorImpact]

# ==========================================
# Model Metrics
# ==========================================
class ConfusionMatrixData(BaseModel):
    true_negatives: int
    false_positives: int
    false_negatives: int
    true_positives: int
    matrix: List[List[int]]

class ModelMetricItem(BaseModel):
    model_type: str
    target: str
    test_sample_size: int
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    confusion_matrix: ConfusionMatrixData
    parameters: Dict[str, Any]

class FeatureImportanceItem(BaseModel):
    feature: str
    weight: Optional[float] = None
    importance: Optional[float] = None
    direction: Optional[str] = None

class ModelMetricsResponse(BaseModel):
    approval_model: ModelMetricItem
    default_model: ModelMetricItem
    approval_coefficients: List[Dict[str, Any]]
    default_importances: List[Dict[str, Any]]
