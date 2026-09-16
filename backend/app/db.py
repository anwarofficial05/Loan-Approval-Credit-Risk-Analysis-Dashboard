"""
Database Connection and Raw SQL Execution Utilities
"""

import time
import sqlite3
from typing import Dict, Any, List, Tuple
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import DATABASE_URL, DB_PATH

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_raw_sql(sql: str) -> Dict[str, Any]:
    """
    Executes raw SQL query on SQLite database, returning execution time,
    columns list, rows, and total row count.
    """
    t0 = time.perf_counter()
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        raw_rows = cursor.fetchall()
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        # Convert rows into list of dicts for JSON serialization
        dict_rows = [dict(zip(columns, row)) for row in raw_rows]

        return {
            "success": True,
            "columns": columns,
            "rows": dict_rows,
            "row_count": len(dict_rows),
            "execution_ms": round(elapsed_ms, 2),
            "error": None
        }
    except Exception as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        return {
            "success": False,
            "columns": [],
            "rows": [],
            "row_count": 0,
            "execution_ms": round(elapsed_ms, 2),
            "error": str(e)
        }
    finally:
        conn.close()
