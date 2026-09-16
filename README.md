# CreditLens — Loan Approval & Credit Risk Analytics Dashboard

CreditLens is an institutional-grade credit underwriting and risk analytics web application engineered for retail banks, Non-Banking Financial Companies (NBFCs), and digital lending institutions. It pairs high-throughput raw SQL analytics over a 50,000 loan application portfolio with production-grade machine learning pipelines that deliver real-time loan approval decisions, default probability estimates, and factor-by-factor explainability. Designed with an executive high-density dark slate interface, CreditLens empowers credit risk committees, underwriters, and portfolio managers to dissect portfolio concentration, detect tail risk, monitor geographic disbursement momentum, and stress-test new facility applications in sub-100 milliseconds.

---

## UI Preview & Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CreditLens  v1.0 NBFC             [Core Engine: ACTIVE]  [50,000 Loaded]    │
├──────────────┬──────────────────────────────────────────────────────────────┤
│  OVERVIEW    │  TOTAL APPS      APPROVAL RATE    TOTAL DISBURSED  DEFAULT   │
│  APPLICATIONS│  50,000          68.0%            ₹10,542.80 Cr    9.00%     │
│  SQL ENGINE  ├──────────────────────────────────────────────────────────────┤
│  RISK SCORER │  [Monthly Disbursement + 3M MA] [Approval by Credit Band]    │
│  MODEL METRIC│  [Purpose Share Donut]          [Default by Income & Area]   │
│              │  [State Disbursement Horizontal][2D Credit x Income Heatmap] │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

*(Screenshots can be placed in `docs/screenshots/` showing the 5 dedicated institutional pages: Overview Dashboard, 50,000 Application Explorer with Slide-Over Drawer, SQL Analytics Explorer with Syntax Highlighting, Real-Time Risk Scorer with Factor Drivers, and Model Governance with Visual Confusion Matrix).*

---

## Tech Stack

- **Backend**: Python 3.11 / 3.12, FastAPI, SQLAlchemy (raw SQL engine + ORM models), SQLite (file-based `data/loans.db` with indexed multi-column performance)
- **Machine Learning**: scikit-learn, pandas, numpy, joblib (ColumnTransformer with median/mode imputation, Logistic Regression, Random Forest Classifier with balanced class weights)
- **Frontend**: React 18, Vite, TypeScript (strict mode), Tailwind CSS, Recharts, Lucide React
- **Testing**: pytest (financial math, API contract validation, and missing-field inference tests)
- **Packaging**: pip / requirements.txt for Python, npm for React

---

## Business & Credit Context

For readers and interviewers unfamiliar with banking and retail credit origination:

1. **Loan Origination System (LOS)**: The end-to-end institutional workflow through which a borrower applies for credit, submits KYC and income documents, undergoes credit bureau verification, and receives an underwriting sanction or rejection.
2. **Equated Monthly Installment (EMI)**: The fixed monthly repayment amount calculated via the standard amortization formula:
   $$\text{EMI} = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$$
   where $P$ is principal, $r$ is monthly interest rate $(\text{annual rate} / 12 / 100)$, and $n$ is tenure in months.
3. **Debt-to-Income (DTI) Ratio**: The percentage of a borrower's gross monthly earnings committed toward debt service:
   $$\text{DTI} = \frac{\text{New Amortized EMI} + \text{Existing Debt Obligations}}{\text{Total Household Monthly Income}}$$
   In Indian retail lending, a DTI exceeding **45% - 50%** triggers underwriting review or outright rejection due to insufficient cash flow buffers.
4. **Non-Performing Asset (NPA) / Default**: When a borrower fails to meet principal or interest obligations for greater than 90 days. NBFC balance sheet stability hinges on keeping early-stage defaults low (our calibrated approved cohort maintains a strict **9.0%** long-term default rate).

---

## 12 Production SQL Analytics Queries

All 12 queries are stored in `sql/analytics_queries.sql` and can be executed live through the **SQL Explorer** page:

1. **Overall Portfolio KPIs**: Computes total applications, approved count, approval rate (%), total disbursed (INR), average ticket size, default count, and default rate (%) using conditional `CASE WHEN` aggregation.
2. **Approval Rate by Credit Band**: Multi-tier breakdown across CIBIL credit score categories (`Poor <580`, `Fair 580-669`, `Good 670-739`, `Very Good 740-799`, `Excellent 800+`) with average sanctioned amounts.
3. **Monthly Disbursement Trend with 3-Month Moving Average**: Tracks monthly capital deployed across 2023–2025 using `AVG(monthly_disbursed) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)` to smooth seasonality.
4. **Default Rate by Income Band & Property Area**: Multi-level `GROUP BY income_band, property_area` identifying regional risk pockets (Urban vs Semiurban vs Rural).
5. **Top 5 Branch States by Disbursed Amount, with Rank**: Applies `RANK() OVER (ORDER BY disbursed DESC)` to rank state branches and compute cumulative market share.
6. **Running Cumulative Disbursement by Month**: Computes cumulative deployed balance sheet capital using `SUM(disbursed) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING)`.
7. **Approval Rate by Loan Purpose (500+ Applications)**: Product-level conversion analysis using `GROUP BY loan_purpose HAVING COUNT(*) >= 500`.
8. **High-Risk Approved Cohort**: Common Table Expression (CTE) isolating vulnerable approvals (`DTI > 0.45` and `Credit Score < 650`) to monitor tail exposure.
9. **Year-over-Year Approval Growth by State**: CTE combining `LAG() OVER (PARTITION BY state ORDER BY year)` to track branch growth acceleration and deceleration.
10. **Top Applicants Ranked within State by Loan Amount**: Window function `ROW_NUMBER() OVER (PARTITION BY branch_state ORDER BY loan_amount DESC)` isolating the top 3 exposure accounts per state.
11. **Segmentation Crosstab (Credit Band × Income Band Approval Matrix)**: 2D matrix pivot using conditional `CASE WHEN` across 5 income tiers and 5 credit score bands.
12. **Portfolio Concentration in Top Decile**: Applies `NTILE(10) OVER (ORDER BY loan_amount DESC)` to quantify the percentage of balance sheet capital concentrated in the top 10% largest facilities.

---

## Real Evaluated Machine Learning Metrics

Both models were evaluated on an **80/20 stratified out-of-sample test split** (10,000 test applications for approval, 6,800 test loans for default). Real numbers from `ml/metrics.json`:

### 1. Loan Approval Model (Logistic Regression)
- **Accuracy**: **92.82%** (Target: $\ge 80\%$)
- **ROC-AUC**: **0.9796** (Target: $\ge 0.85$)
- **Precision**: 93.58%
- **Recall**: 96.03%
- **F1 Score**: 94.79%
- **Confusion Matrix**:
  - True Negatives (Correct Rejections): 2,752
  - False Positives (Incorrect Approvals): 448
  - False Negatives (Incorrect Rejections): 270
  - True Positives (Correct Approvals): 6,530

### 2. Default Risk Model (Random Forest Classifier with `class_weight='balanced'`)
- **ROC-AUC**: **0.9336**
- **Accuracy**: 85.62%
- **Recall / Sensitivity**: 85.62% (High capture of high-risk obligors)
- **Confusion Matrix**:
  - True Negatives: 5,298
  - False Positives: 890
  - False Negatives: 88
  - True Positives: 524

---

## Setup & Running Locally

Everything runs locally with zero paid services or external dependencies.

### One-Command Setup

**On Windows:**
```cmd
scripts\setup.bat
```

**On Linux / macOS:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

### Step-by-Step Manual Commands

#### 1. Backend Setup & Data Seeding
```bash
# Install Python dependencies
pip install -r requirements.txt

# Generate 50,000 synthetic loans (seed=42)
python scripts/generate_data.py

# Build SQLite database and compute derived underwriting fields
python scripts/setup_db.py

# Train ML pipelines and save real metrics
python ml/train_model.py

# Run pytest automated test suite
pytest backend/tests
```

#### 2. Start Services

**Terminal 1 — FastAPI Backend:**
```bash
uvicorn backend.app.main:app --reload --port 8000
```
*API docs available at: `http://127.0.0.1:8000/docs`*

**Terminal 2 — React Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Access Web Dashboard at: `http://localhost:5173`*

---

## Verification & Test Suite

CreditLens includes 19 automated pytest unit and integration tests covering:
1. Standard amortization formula mathematical equivalence across home, auto, and personal loan tenures.
2. DTI and LTI ratio bounds and zero-income edge cases.
3. Contract schema conformity (`200 OK`) on all API endpoints.
4. Real-time inference `/api/predict` with valid, high-risk, and incomplete payloads with missing optional fields.

Run tests:
```bash
pytest backend/tests -v
```
