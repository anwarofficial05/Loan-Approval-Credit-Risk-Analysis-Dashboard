"""
Router: Loan Applications Explorer (Server Paginated, Filtered, Sorted)
"""

from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.db import get_db
from backend.app.schemas import PaginatedApplicationsResponse, ApplicationListItem, ApplicationDetailResponse

router = APIRouter(prefix="/api/applications", tags=["Applications"])

ALLOWED_SORT_COLUMNS = {
    "application_id": "application_id",
    "applicant_name": "applicant_name",
    "application_date": "application_date",
    "loan_amount": "loan_amount",
    "total_income": "total_income",
    "credit_score": "credit_score",
    "dti_ratio": "dti_ratio",
    "loan_status": "loan_status",
    "risk_tier": "risk_tier"
}

@router.get("", response_model=PaginatedApplicationsResponse)
def get_applications(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by ID or applicant name"),
    loan_status: Optional[str] = Query(None, description="Filter: Approved or Rejected"),
    branch_state: Optional[str] = Query(None, description="Filter: Indian State"),
    loan_purpose: Optional[str] = Query(None, description="Filter: Loan Purpose"),
    credit_band: Optional[str] = Query(None, description="Filter: Credit Band"),
    risk_tier: Optional[str] = Query(None, description="Filter: Risk Tier (Low/Medium/High)"),
    sort_by: str = Query("application_date", description="Field to sort by"),
    sort_dir: str = Query("desc", pattern="^(asc|desc|ASC|DESC)$", description="Sort direction"),
    db: Session = Depends(get_db)
):
    where_clauses = ["1=1"]
    params = {}

    if search:
        where_clauses.append("(application_id LIKE :search OR applicant_name LIKE :search)")
        params["search"] = f"%{search.strip()}%"
    if loan_status and loan_status != "All":
        where_clauses.append("loan_status = :loan_status")
        params["loan_status"] = loan_status
    if branch_state and branch_state != "All":
        where_clauses.append("branch_state = :branch_state")
        params["branch_state"] = branch_state
    if loan_purpose and loan_purpose != "All":
        where_clauses.append("loan_purpose = :loan_purpose")
        params["loan_purpose"] = loan_purpose
    if credit_band and credit_band != "All":
        where_clauses.append("credit_band = :credit_band")
        params["credit_band"] = credit_band
    if risk_tier and risk_tier != "All":
        where_clauses.append("risk_tier = :risk_tier")
        params["risk_tier"] = risk_tier

    where_sql = " AND ".join(where_clauses)
    order_col = ALLOWED_SORT_COLUMNS.get(sort_by, "application_date")
    order_direction = "DESC" if sort_dir.lower() == "desc" else "ASC"

    # Count total matching rows
    count_sql = f"SELECT COUNT(*) FROM loan_applications WHERE {where_sql}"
    total_count = db.execute(text(count_sql), params).scalar() or 0

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_sql = f"""
    SELECT 
        application_id, applicant_name, age, gender, education,
        total_income, COALESCE(loan_amount, 0) as loan_amount, loan_term_months, interest_rate,
        credit_score, credit_band, dti_ratio, loan_purpose, branch_state,
        application_date, loan_status, risk_tier
    FROM loan_applications
    WHERE {where_sql}
    ORDER BY {order_col} {order_direction}
    LIMIT :limit OFFSET :offset;
    """

    rows = db.execute(text(data_sql), params).mappings().all()

    items = [
        ApplicationListItem(
            application_id=r["application_id"],
            applicant_name=r["applicant_name"],
            age=r["age"],
            gender=r["gender"],
            education=r["education"],
            total_income=r["total_income"],
            loan_amount=r["loan_amount"],
            loan_term_months=r["loan_term_months"],
            interest_rate=r["interest_rate"],
            credit_score=r["credit_score"],
            credit_band=r["credit_band"],
            dti_ratio=r["dti_ratio"],
            loan_purpose=r["loan_purpose"],
            branch_state=r["branch_state"],
            application_date=r["application_date"],
            loan_status=r["loan_status"],
            risk_tier=r["risk_tier"]
        )
        for r in rows
    ]

    total_pages = (total_count + page_size - 1) // page_size

    return PaginatedApplicationsResponse(
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items
    )

@router.get("/{app_id}", response_model=ApplicationDetailResponse)
def get_application_by_id(app_id: str, db: Session = Depends(get_db)):
    sql = "SELECT * FROM loan_applications WHERE application_id = :app_id"
    row = db.execute(text(sql), {"app_id": app_id}).mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found.")

    return ApplicationDetailResponse(**dict(row))
