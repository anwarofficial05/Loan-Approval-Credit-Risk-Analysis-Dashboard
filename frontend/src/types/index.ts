export interface KPIMetric {
  value: number;
  formatted: string;
  delta_pct?: number;
  trend_direction?: 'up' | 'down' | 'neutral';
}

export interface PortfolioKPIs {
  total_applications: KPIMetric;
  approved_applications: KPIMetric;
  approval_rate_pct: KPIMetric;
  total_disbursed_inr: KPIMetric;
  avg_ticket_size_inr: KPIMetric;
  default_rate_pct: KPIMetric;
  avg_credit_score: KPIMetric;
}

export interface QueryItem {
  id: number;
  title: string;
  category: string;
  technique: string;
  business_question: string;
  sql: string;
}

export interface QueryRunResult {
  id: number;
  title: string;
  business_question: string;
  success: boolean;
  execution_ms: number;
  row_count: number;
  columns: string[];
  rows: Record<string, any>[];
  error?: string | null;
}

export interface ApplicationListItem {
  application_id: string;
  applicant_name: string;
  age: number;
  gender: string;
  education: string;
  total_income: number;
  loan_amount: number;
  loan_term_months: number;
  interest_rate: number;
  credit_score: number;
  credit_band: string;
  dti_ratio: number;
  loan_purpose: string;
  branch_state: string;
  application_date: string;
  loan_status: string;
  risk_tier: string;
}

export interface PaginatedApplications {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: ApplicationListItem[];
}

export interface ApplicationDetail {
  application_id: string;
  applicant_name: string;
  age: number;
  gender: string;
  marital_status: string;
  dependents: number;
  education: string;
  self_employed: string;
  applicant_income: number | null;
  coapplicant_income: number;
  total_income: number;
  loan_amount: number | null;
  loan_term_months: number;
  interest_rate: number;
  credit_score: number;
  credit_history: number | null;
  existing_emi: number;
  property_area: string;
  loan_purpose: string;
  branch_state: string;
  application_date: string;
  loan_status: string;
  default_flag: number;
  emi: number;
  dti_ratio: number;
  loan_to_income: number;
  income_band: string;
  credit_band: string;
  risk_tier: string;
}

export interface MonthlyDisbursementPoint {
  month: string;
  total_apps: number;
  approved_count: number;
  disbursed_inr: number;
  moving_avg_3m_inr: number;
}

export interface CreditBandPoint {
  credit_band: string;
  total_applications: number;
  approved_count: number;
  approval_rate_pct: number;
  avg_credit_score: number;
}

export interface LoanPurposePoint {
  loan_purpose: string;
  applications: number;
  approved: number;
  disbursed_inr: number;
  share_pct: number;
}

export interface DefaultIncomePoint {
  income_band: string;
  urban_default_pct: number;
  semiurban_default_pct: number;
  rural_default_pct: number;
  overall_default_pct: number;
}

export interface StateDisbursementPoint {
  branch_state: string;
  total_applications: number;
  approved_count: number;
  disbursed_inr: number;
  approval_rate_pct: number;
}

export interface SegmentationCell {
  credit_band: string;
  income_band: string;
  total_count: number;
  approved_count: number;
  approval_rate_pct: number;
}

export interface FactorImpact {
  factor: string;
  impact: string;
  weight: number;
  explanation: string;
}

export interface PredictRequest {
  applicant_name: string;
  age: number;
  gender: string;
  marital_status: string;
  dependents: number;
  education: string;
  self_employed: string;
  applicant_income?: number | null;
  coapplicant_income: number;
  loan_amount?: number | null;
  loan_term_months: number;
  interest_rate: number;
  credit_score: number;
  credit_history?: number | null;
  existing_emi: number;
  property_area: string;
  loan_purpose: string;
  branch_state: string;
}

export interface PredictResponse {
  approval_probability: number;
  approval_probability_pct: number;
  predicted_decision: 'Approved' | 'Rejected';
  default_probability: number;
  default_probability_pct: number;
  risk_tier: 'Low' | 'Medium' | 'High';
  computed_emi: number;
  computed_total_income: number;
  computed_dti_ratio: number;
  computed_loan_to_income: number;
  income_band: string;
  credit_band: string;
  contributing_factors: FactorImpact[];
}

export interface ConfusionMatrix {
  true_negatives: number;
  false_positives: number;
  false_negatives: number;
  true_positives: number;
  matrix: number[][];
}

export interface ModelDetail {
  model_type: string;
  target: string;
  test_sample_size: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  confusion_matrix: ConfusionMatrix;
  parameters: Record<string, any>;
}

export interface ModelMetricsData {
  approval_model: ModelDetail;
  default_model: ModelDetail;
  approval_coefficients: {
    feature: string;
    weight: number;
    abs_weight: number;
    direction: string;
  }[];
  default_importances: {
    feature: string;
    importance: number;
  }[];
}

export interface GlobalFilters {
  branch_state: string;
  loan_purpose: string;
  credit_band: string;
  date_from?: string;
  date_to?: string;
}
