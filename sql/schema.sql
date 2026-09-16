-- CreditLens SQLite Database DDL Schema
-- Table: loan_applications

DROP TABLE IF EXISTS loan_applications;

CREATE TABLE loan_applications (
    application_id        TEXT PRIMARY KEY,
    applicant_name        TEXT NOT NULL,
    age                   INTEGER NOT NULL,
    gender                TEXT NOT NULL,
    marital_status        TEXT NOT NULL,
    dependents            INTEGER NOT NULL,
    education             TEXT NOT NULL,
    self_employed         TEXT NOT NULL,
    applicant_income      INTEGER,               -- can be NULL (~4% missing)
    coapplicant_income    INTEGER NOT NULL,
    loan_amount           INTEGER,               -- can be NULL (~4% missing)
    loan_term_months      INTEGER NOT NULL,
    interest_rate         REAL NOT NULL,
    credit_score          INTEGER NOT NULL,
    credit_history        INTEGER,               -- can be NULL (~4% missing)
    existing_emi          INTEGER NOT NULL,
    property_area         TEXT NOT NULL,
    loan_purpose          TEXT NOT NULL,
    branch_state          TEXT NOT NULL,
    application_date      DATE NOT NULL,
    loan_status           TEXT NOT NULL,
    default_flag          INTEGER NOT NULL,      -- 0 or 1 (meaningful for approved loans)

    -- Derived analytical fields computed and stored
    total_income          INTEGER NOT NULL,
    emi                   INTEGER NOT NULL,
    dti_ratio             REAL NOT NULL,
    loan_to_income        REAL NOT NULL,
    income_band           TEXT NOT NULL,
    credit_band           TEXT NOT NULL,
    risk_tier             TEXT NOT NULL
);

-- Performance indices for sub-10ms analytical queries & filtering
CREATE INDEX idx_loan_status ON loan_applications(loan_status);
CREATE INDEX idx_branch_state ON loan_applications(branch_state);
CREATE INDEX idx_application_date ON loan_applications(application_date);
CREATE INDEX idx_credit_band ON loan_applications(credit_band);
CREATE INDEX idx_income_band ON loan_applications(income_band);
CREATE INDEX idx_risk_tier ON loan_applications(risk_tier);
CREATE INDEX idx_loan_purpose ON loan_applications(loan_purpose);
CREATE INDEX idx_property_area ON loan_applications(property_area);
CREATE INDEX idx_dti_credit ON loan_applications(dti_ratio, credit_score);
