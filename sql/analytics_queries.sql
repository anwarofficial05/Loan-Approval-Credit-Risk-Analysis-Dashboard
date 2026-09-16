-- ==============================================================================
-- CreditLens — Production Analytics SQL Suite
-- 12 Non-Trivial Analytical Queries for Credit Risk & Loan Portfolio Management
-- ==============================================================================

-- ==============================================================================
-- QUERY 1: Overall Portfolio KPIs
-- Business Question: What are the headline operational and risk metrics of our retail
-- lending portfolio, including total application volume, approval rate, capital disbursed,
-- average ticket size, and portfolio default rate?
-- ==============================================================================
SELECT 
    COUNT(*) AS total_applications,
    SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_applications,
    ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 2) AS approval_rate_pct,
    SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS total_disbursed_inr,
    ROUND(AVG(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE NULL END), 0) AS avg_ticket_size_inr,
    SUM(CASE WHEN loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) AS default_count,
    ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END), 0), 2) AS default_rate_pct
FROM loan_applications;


-- ==============================================================================
-- QUERY 2: Approval Rate by Credit Band
-- Business Question: How does our credit approval rate vary across CIBIL credit score
-- tiers, and what is the average loan size in each band?
-- ==============================================================================
SELECT 
    credit_band,
    COUNT(*) AS total_applications,
    SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
    ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 2) AS approval_rate_pct,
    ROUND(AVG(credit_score), 1) AS avg_credit_score,
    ROUND(AVG(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE NULL END), 0) AS avg_approved_loan_inr
FROM loan_applications
GROUP BY credit_band
ORDER BY 
    CASE credit_band
        WHEN 'Excellent (800+)' THEN 1
        WHEN 'Very Good (740-799)' THEN 2
        WHEN 'Good (670-739)' THEN 3
        WHEN 'Fair (580-669)' THEN 4
        WHEN 'Poor (<580)' THEN 5
        ELSE 6
    END;


-- ==============================================================================
-- QUERY 3: Monthly Disbursement Trend with 3-Month Moving Average
-- Business Question: What is our monthly disbursement momentum across 2023-2025, and
-- how does the 3-month trailing moving average smooth out origination seasonality?
-- ==============================================================================
WITH monthly_stats AS (
    SELECT 
        strftime('%Y-%m', application_date) AS disbursement_month,
        COUNT(*) AS total_applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS monthly_disbursed_inr
    FROM loan_applications
    GROUP BY strftime('%Y-%m', application_date)
)
SELECT 
    disbursement_month,
    approved_count,
    monthly_disbursed_inr,
    ROUND(AVG(monthly_disbursed_inr) OVER (
        ORDER BY disbursement_month 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ), 0) AS moving_avg_3m_disbursed_inr
FROM monthly_stats
ORDER BY disbursement_month;


-- ==============================================================================
-- QUERY 4: Default Rate by Income Band and Property Area
-- Business Question: Where are default concentrations highest across geographical
-- demographics (Urban, Semiurban, Rural) when segmented by borrower income capacity?
-- ==============================================================================
SELECT 
    income_band,
    property_area,
    SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_loans,
    SUM(CASE WHEN loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) AS default_count,
    ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END), 0), 2) AS default_rate_pct,
    ROUND(AVG(CASE WHEN loan_status = 'Approved' THEN dti_ratio ELSE NULL END), 3) AS avg_dti_ratio
FROM loan_applications
GROUP BY income_band, property_area
ORDER BY 
    CASE income_band
        WHEN '<25k' THEN 1
        WHEN '25k-50k' THEN 2
        WHEN '50k-100k' THEN 3
        WHEN '100k-200k' THEN 4
        WHEN '200k+' THEN 5
        ELSE 6
    END,
    property_area;


-- ==============================================================================
-- QUERY 5: Top 5 Branch States by Disbursed Amount, with Rank
-- Business Question: Which top 5 regional branch states drive the highest cumulative
-- lending volume, and what is their relative ranking and market share?
-- ==============================================================================
WITH state_summary AS (
    SELECT 
        branch_state,
        COUNT(*) AS total_applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_loans,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS total_disbursed_inr,
        RANK() OVER (ORDER BY SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) DESC) AS disbursement_rank
    FROM loan_applications
    GROUP BY branch_state
)
SELECT 
    disbursement_rank,
    branch_state,
    total_applications,
    approved_loans,
    total_disbursed_inr,
    ROUND(100.0 * total_disbursed_inr / (SELECT SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) FROM loan_applications), 2) AS portfolio_share_pct
FROM state_summary
WHERE disbursement_rank <= 5
ORDER BY disbursement_rank;


-- ==============================================================================
-- QUERY 6: Running Cumulative Disbursement by Month
-- Business Question: How has cumulative capital deployment compounded month-over-month
-- since launch, tracking against institutional capital allocation targets?
-- ==============================================================================
WITH monthly_agg AS (
    SELECT 
        strftime('%Y-%m', application_date) AS yr_month,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS monthly_disbursed_inr,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS monthly_approved_count
    FROM loan_applications
    GROUP BY strftime('%Y-%m', application_date)
)
SELECT 
    yr_month,
    monthly_approved_count,
    monthly_disbursed_inr,
    SUM(monthly_disbursed_inr) OVER (
        ORDER BY yr_month 
        ROWS UNBOUNDED PRECEDING
    ) AS cumulative_disbursed_inr,
    SUM(monthly_approved_count) OVER (
        ORDER BY yr_month 
        ROWS UNBOUNDED PRECEDING
    ) AS cumulative_loans_count
FROM monthly_agg
ORDER BY yr_month;


-- ==============================================================================
-- QUERY 7: Approval Rate by Loan Purpose Filtered to 500+ Applications
-- Business Question: Which loan products exhibit the highest underwriting conversion
-- rates, and what are their corresponding average interest rates and risk profiles?
-- ==============================================================================
SELECT 
    loan_purpose,
    COUNT(*) AS application_volume,
    SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_volume,
    ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 2) AS approval_rate_pct,
    ROUND(AVG(interest_rate), 2) AS avg_interest_rate_pct,
    ROUND(AVG(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE NULL END), 0) AS avg_loan_size_inr,
    ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END), 0), 2) AS default_rate_pct
FROM loan_applications
GROUP BY loan_purpose
HAVING COUNT(*) >= 500
ORDER BY approval_rate_pct DESC;


-- ==============================================================================
-- QUERY 8: High-Risk Approved Cohort Analysis (DTI > 0.45 and Credit Score < 650)
-- Business Question: What is our balance sheet exposure to borrowers who were approved
-- despite vulnerable fundamentals (debt burden exceeding 45% and sub-650 credit score)?
-- ==============================================================================
WITH high_risk_portfolio AS (
    SELECT 
        application_id,
        applicant_name,
        branch_state,
        loan_purpose,
        credit_score,
        dti_ratio,
        loan_amount,
        interest_rate,
        default_flag
    FROM loan_applications
    WHERE loan_status = 'Approved'
      AND dti_ratio > 0.45
      AND credit_score < 650
)
SELECT 
    COUNT(*) AS high_risk_approved_count,
    SUM(loan_amount) AS total_high_risk_exposure_inr,
    ROUND(AVG(credit_score), 1) AS avg_credit_score,
    ROUND(AVG(dti_ratio), 3) AS avg_dti_ratio,
    SUM(default_flag) AS default_count,
    ROUND(100.0 * SUM(default_flag) / COUNT(*), 2) AS default_rate_pct
FROM high_risk_portfolio;


-- ==============================================================================
-- QUERY 9: Year-over-Year Approval Growth by State
-- Business Question: Which state branches are experiencing the highest annual loan
-- origination growth, and where is credit demand accelerating or decelerating?
-- ==============================================================================
WITH yearly_state_approvals AS (
    SELECT 
        branch_state,
        CAST(strftime('%Y', application_date) AS INTEGER) AS app_year,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS disbursed_inr
    FROM loan_applications
    GROUP BY branch_state, strftime('%Y', application_date)
),
lagged_metrics AS (
    SELECT 
        branch_state,
        app_year,
        approved_count,
        disbursed_inr,
        LAG(approved_count, 1) OVER (
            PARTITION BY branch_state 
            ORDER BY app_year
        ) AS prev_year_approved_count,
        LAG(disbursed_inr, 1) OVER (
            PARTITION BY branch_state 
            ORDER BY app_year
        ) AS prev_year_disbursed_inr
    FROM yearly_state_approvals
)
SELECT 
    branch_state,
    app_year,
    approved_count,
    prev_year_approved_count,
    CASE 
        WHEN prev_year_approved_count IS NULL THEN NULL 
        ELSE ROUND(100.0 * (approved_count - prev_year_approved_count) / prev_year_approved_count, 2)
    END AS yoy_approval_growth_pct,
    disbursed_inr,
    CASE 
        WHEN prev_year_disbursed_inr IS NULL THEN NULL 
        ELSE ROUND(100.0 * (disbursed_inr - prev_year_disbursed_inr) / prev_year_disbursed_inr, 2)
    END AS yoy_disbursement_growth_pct
FROM lagged_metrics
ORDER BY branch_state, app_year;


-- ==============================================================================
-- QUERY 10: Top Applicants Ranked within Their Own State by Loan Amount
-- Business Question: Who are the top 3 largest approved borrowers in each state
-- jurisdiction, and what are their underwriting risk profiles?
-- ==============================================================================
WITH ranked_applicants AS (
    SELECT 
        branch_state,
        application_id,
        applicant_name,
        loan_purpose,
        loan_amount,
        total_income,
        credit_score,
        dti_ratio,
        ROW_NUMBER() OVER (
            PARTITION BY branch_state 
            ORDER BY loan_amount DESC
        ) AS state_rank
    FROM loan_applications
    WHERE loan_status = 'Approved'
)
SELECT 
    branch_state,
    state_rank,
    application_id,
    applicant_name,
    loan_purpose,
    loan_amount,
    total_income,
    credit_score,
    dti_ratio
FROM ranked_applicants
WHERE state_rank <= 3
ORDER BY branch_state, state_rank;


-- ==============================================================================
-- QUERY 11: Segmentation Crosstab: Credit Band x Income Band Approval Matrix
-- Business Question: What is the granular 2D approval matrix across borrower credit
-- bands and income strata to identify underserved segments and conservative clusters?
-- ==============================================================================
SELECT 
    credit_band,
    ROUND(100.0 * SUM(CASE WHEN income_band = '<25k' AND loan_status = 'Approved' THEN 1 ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN income_band = '<25k' THEN 1 ELSE 0 END), 0), 1) AS apr_under_25k_pct,
    ROUND(100.0 * SUM(CASE WHEN income_band = '25k-50k' AND loan_status = 'Approved' THEN 1 ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN income_band = '25k-50k' THEN 1 ELSE 0 END), 0), 1) AS apr_25k_50k_pct,
    ROUND(100.0 * SUM(CASE WHEN income_band = '50k-100k' AND loan_status = 'Approved' THEN 1 ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN income_band = '50k-100k' THEN 1 ELSE 0 END), 0), 1) AS apr_50k_100k_pct,
    ROUND(100.0 * SUM(CASE WHEN income_band = '100k-200k' AND loan_status = 'Approved' THEN 1 ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN income_band = '100k-200k' THEN 1 ELSE 0 END), 0), 1) AS apr_100k_200k_pct,
    ROUND(100.0 * SUM(CASE WHEN income_band = '200k+' AND loan_status = 'Approved' THEN 1 ELSE 0 END) / 
          NULLIF(SUM(CASE WHEN income_band = '200k+' THEN 1 ELSE 0 END), 0), 1) AS apr_200k_plus_pct,
    ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 1) AS total_approval_rate_pct
FROM loan_applications
GROUP BY credit_band
ORDER BY 
    CASE credit_band
        WHEN 'Excellent (800+)' THEN 1
        WHEN 'Very Good (740-799)' THEN 2
        WHEN 'Good (670-739)' THEN 3
        WHEN 'Fair (580-669)' THEN 4
        WHEN 'Poor (<580)' THEN 5
        ELSE 6
    END;


-- ==============================================================================
-- QUERY 12: Portfolio Concentration: Share of Total Disbursement Held by Top Decile
-- Business Question: What percentage of total disbursed capital is concentrated in the
-- top 10% largest loans, and does our portfolio have excessive tail-risk exposure?
-- ==============================================================================
WITH decile_loans AS (
    SELECT 
        application_id,
        loan_amount,
        NTILE(10) OVER (ORDER BY loan_amount DESC) AS loan_decile
    FROM loan_applications
    WHERE loan_status = 'Approved'
),
decile_summary AS (
    SELECT 
        loan_decile,
        COUNT(*) AS loan_count,
        SUM(loan_amount) AS decile_disbursed_inr,
        ROUND(AVG(loan_amount), 0) AS avg_loan_inr,
        MIN(loan_amount) AS min_loan_inr,
        MAX(loan_amount) AS max_loan_inr
    FROM decile_loans
    GROUP BY loan_decile
)
SELECT 
    loan_decile,
    loan_count,
    decile_disbursed_inr,
    avg_loan_inr,
    min_loan_inr,
    max_loan_inr,
    ROUND(100.0 * decile_disbursed_inr / (SELECT SUM(loan_amount) FROM loan_applications WHERE loan_status = 'Approved'), 2) AS share_of_total_disbursed_pct
FROM decile_summary
ORDER BY loan_decile;
