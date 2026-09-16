"""
Router: Pre-shaped Dashboard Chart Feeds
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.db import get_db

router = APIRouter(prefix="/api/charts", tags=["Charts"])

def build_filter_clause(
    branch_state: Optional[str] = None,
    loan_purpose: Optional[str] = None,
    credit_band: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> (str, Dict[str, Any]):
    clauses = ["1=1"]
    params = {}
    if branch_state and branch_state != "All":
        clauses.append("branch_state = :branch_state")
        params["branch_state"] = branch_state
    if loan_purpose and loan_purpose != "All":
        clauses.append("loan_purpose = :loan_purpose")
        params["loan_purpose"] = loan_purpose
    if credit_band and credit_band != "All":
        clauses.append("credit_band = :credit_band")
        params["credit_band"] = credit_band
    if date_from:
        clauses.append("application_date >= :date_from")
        params["date_from"] = date_from
    if date_to:
        clauses.append("application_date <= :date_to")
        params["date_to"] = date_to
    return " AND ".join(clauses), params

@router.get("/monthly_disbursement")
def get_monthly_disbursement_chart(
    branch_state: Optional[str] = Query(None),
    loan_purpose: Optional[str] = Query(None),
    credit_band: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    where_sql, params = build_filter_clause(branch_state, loan_purpose, credit_band, date_from, date_to)
    sql = f"""
    WITH monthly_data AS (
        SELECT 
            strftime('%Y-%m', application_date) AS ym,
            COUNT(*) AS total_apps,
            SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
            SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS disbursed
        FROM loan_applications
        WHERE {where_sql}
        GROUP BY strftime('%Y-%m', application_date)
    )
    SELECT 
        ym AS month,
        total_apps,
        approved_count,
        COALESCE(disbursed, 0) AS disbursed_inr,
        ROUND(AVG(COALESCE(disbursed, 0)) OVER (
            ORDER BY ym ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
        ), 0) AS moving_avg_3m_inr
    FROM monthly_data
    ORDER BY ym;
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/approval_by_credit_band")
def get_approval_by_credit_band_chart(
    branch_state: Optional[str] = Query(None),
    loan_purpose: Optional[str] = Query(None),
    credit_band: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    where_sql, params = build_filter_clause(branch_state, loan_purpose, credit_band, date_from, date_to)
    sql = f"""
    SELECT 
        credit_band,
        COUNT(*) AS total_applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 1) AS approval_rate_pct,
        ROUND(AVG(credit_score), 0) AS avg_credit_score
    FROM loan_applications
    WHERE {where_sql}
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
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/loan_purpose_distribution")
def get_loan_purpose_distribution_chart(
    branch_state: Optional[str] = Query(None),
    loan_purpose: Optional[str] = Query(None),
    credit_band: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    where_sql, params = build_filter_clause(branch_state, loan_purpose, credit_band, date_from, date_to)
    sql = f"""
    SELECT 
        loan_purpose,
        COUNT(*) AS applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS disbursed_inr,
        ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM loan_applications WHERE {where_sql}), 1) AS share_pct
    FROM loan_applications
    WHERE {where_sql}
    GROUP BY loan_purpose
    ORDER BY disbursed_inr DESC;
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/default_by_income_band")
def get_default_by_income_band_chart(
    branch_state: Optional[str] = Query(None),
    loan_purpose: Optional[str] = Query(None),
    credit_band: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    where_sql, params = build_filter_clause(branch_state, loan_purpose, credit_band, date_from, date_to)
    sql = f"""
    SELECT 
        income_band,
        ROUND(100.0 * SUM(CASE WHEN property_area = 'Urban' AND loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) / 
              NULLIF(SUM(CASE WHEN property_area = 'Urban' AND loan_status = 'Approved' THEN 1 ELSE 0 END), 0), 2) AS urban_default_pct,
        ROUND(100.0 * SUM(CASE WHEN property_area = 'Semiurban' AND loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) / 
              NULLIF(SUM(CASE WHEN property_area = 'Semiurban' AND loan_status = 'Approved' THEN 1 ELSE 0 END), 0), 2) AS semiurban_default_pct,
        ROUND(100.0 * SUM(CASE WHEN property_area = 'Rural' AND loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) / 
              NULLIF(SUM(CASE WHEN property_area = 'Rural' AND loan_status = 'Approved' THEN 1 ELSE 0 END), 0), 2) AS rural_default_pct,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) / 
              NULLIF(SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END), 0), 2) AS overall_default_pct
    FROM loan_applications
    WHERE {where_sql}
    GROUP BY income_band
    ORDER BY 
        CASE income_band
            WHEN '<25k' THEN 1
            WHEN '25k-50k' THEN 2
            WHEN '50k-100k' THEN 3
            WHEN '100k-200k' THEN 4
            WHEN '200k+' THEN 5
            ELSE 6
        END;
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/state_disbursement")
def get_state_disbursement_chart(
    branch_state: Optional[str] = Query(None),
    loan_purpose: Optional[str] = Query(None),
    credit_band: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    where_sql, params = build_filter_clause(branch_state, loan_purpose, credit_band, date_from, date_to)
    sql = f"""
    SELECT 
        branch_state,
        COUNT(*) AS total_applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS disbursed_inr,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 1) AS approval_rate_pct
    FROM loan_applications
    WHERE {where_sql}
    GROUP BY branch_state
    ORDER BY disbursed_inr DESC;
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/segmentation_matrix")
def get_segmentation_matrix_chart(
    branch_state: Optional[str] = Query(None),
    loan_purpose: Optional[str] = Query(None),
    credit_band: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    where_sql, params = build_filter_clause(branch_state, loan_purpose, credit_band, date_from, date_to)
    sql = f"""
    SELECT 
        credit_band,
        income_band,
        COUNT(*) as total_count,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 1) AS approval_rate_pct
    FROM loan_applications
    WHERE {where_sql}
    GROUP BY credit_band, income_band
    ORDER BY 
        CASE credit_band
            WHEN 'Excellent (800+)' THEN 1
            WHEN 'Very Good (740-799)' THEN 2
            WHEN 'Good (670-739)' THEN 3
            WHEN 'Fair (580-669)' THEN 4
            WHEN 'Poor (<580)' THEN 5
            ELSE 6
        END,
        CASE income_band
            WHEN '<25k' THEN 1
            WHEN '25k-50k' THEN 2
            WHEN '50k-100k' THEN 3
            WHEN '100k-200k' THEN 4
            WHEN '200k+' THEN 5
            ELSE 6
        END;
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/{chart_name}")
def get_chart_by_name(chart_name: str, db: Session = Depends(get_db)):
    if chart_name == "monthly_disbursement":
        return get_monthly_disbursement_chart(db=db)
    elif chart_name == "approval_by_credit_band":
        return get_approval_by_credit_band_chart(db=db)
    elif chart_name == "loan_purpose_distribution":
        return get_loan_purpose_distribution_chart(db=db)
    elif chart_name == "default_by_income_band":
        return get_default_by_income_band_chart(db=db)
    elif chart_name == "state_disbursement":
        return get_state_disbursement_chart(db=db)
    elif chart_name == "segmentation_matrix":
        return get_segmentation_matrix_chart(db=db)
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Chart '{chart_name}' not recognized. Available: monthly_disbursement, approval_by_credit_band, loan_purpose_distribution, default_by_income_band, state_disbursement, segmentation_matrix"
        )
