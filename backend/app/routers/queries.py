"""
Router: SQL Queries Explorer & Execution
"""

from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.queries import QUERIES, get_query_by_id
from backend.app.db import execute_raw_sql
from backend.app.schemas import QueryItem, QueryRunResponse

router = APIRouter(prefix="/api/queries", tags=["SQL Queries"])

@router.get("", response_model=List[QueryItem])
def list_queries():
    """Return catalog of 12 non-trivial analytical SQL queries with descriptions."""
    return QUERIES

@router.post("/{query_id}/run", response_model=QueryRunResponse)
def run_query(query_id: int):
    """Execute raw SQL query by ID, returning columns, rows, timing in ms, and count."""
    try:
        query_def = get_query_by_id(query_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Query {query_id} not found. Must be between 1 and 12.")

    sql = query_def["sql"]
    result = execute_raw_sql(sql)

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing Query {query_id}: {result['error']}"
        )

    return QueryRunResponse(
        id=query_def["id"],
        title=query_def["title"],
        business_question=query_def["business_question"],
        success=True,
        execution_ms=result["execution_ms"],
        row_count=result["row_count"],
        columns=result["columns"],
        rows=result["rows"],
        error=None
    )
