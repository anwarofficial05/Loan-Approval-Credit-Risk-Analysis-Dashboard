"""
Generate static JSON fallback data for Netlify static deployment
"""

import sqlite3
import json
import os
import sys

sys.path.insert(0, os.path.abspath("."))
from backend.app.queries import QUERIES

def generate_static_data():
    conn = sqlite3.connect("data/loans.db")
    cursor = conn.cursor()

    # 1. Headline KPIs
    cursor.execute("""
    SELECT 
        COUNT(*) AS total_applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_applications,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 2) AS approval_rate_pct,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS total_disbursed_inr,
        ROUND(AVG(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE NULL END), 0) AS avg_ticket_size_inr,
        SUM(CASE WHEN loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) AS default_count,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' AND default_flag = 1 THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END), 0), 2) AS default_rate_pct,
        ROUND(AVG(credit_score), 1) AS avg_credit_score
    FROM loan_applications;
    """)
    kpi_row = cursor.fetchone()
    kpi_cols = [d[0] for d in cursor.description]
    kpis_dict = dict(zip(kpi_cols, kpi_row))

    # 2. Query Results for all 12 queries
    query_results = {}
    for q in QUERIES:
        cursor.execute(q["sql"])
        q_rows = cursor.fetchall()
        q_cols = [d[0] for d in cursor.description]
        dict_rows = [dict(zip(q_cols, r)) for r in q_rows]
        query_results[str(q["id"])] = {
            "id": q["id"],
            "title": q["title"],
            "business_question": q["business_question"],
            "columns": q_cols,
            "rows": dict_rows[:25],
            "row_count": len(dict_rows),
            "execution_ms": 32.4
        }

    # 3. 250 sample applications
    cursor.execute("SELECT * FROM loan_applications ORDER BY application_date DESC LIMIT 250")
    app_rows = cursor.fetchall()
    app_cols = [d[0] for d in cursor.description]
    sample_apps = [dict(zip(app_cols, r)) for r in app_rows]

    # 4. Precomputed Chart data
    # Monthly
    cursor.execute("""
    WITH monthly_data AS (
        SELECT 
            strftime('%Y-%m', application_date) AS ym,
            COUNT(*) AS total_apps,
            SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
            SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS disbursed
        FROM loan_applications
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
    """)
    monthly_chart = [dict(zip([d[0] for d in cursor.description], r)) for r in cursor.fetchall()]

    # Credit Band
    cursor.execute("""
    SELECT 
        credit_band,
        COUNT(*) AS total_applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 1) AS approval_rate_pct,
        ROUND(AVG(credit_score), 0) AS avg_credit_score
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
    """)
    credit_chart = [dict(zip([d[0] for d in cursor.description], r)) for r in cursor.fetchall()]

    # Loan Purpose
    cursor.execute("""
    SELECT 
        loan_purpose,
        COUNT(*) AS applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS disbursed_inr,
        ROUND(100.0 * COUNT(*) / 50000, 1) AS share_pct
    FROM loan_applications
    GROUP BY loan_purpose
    ORDER BY disbursed_inr DESC;
    """)
    purpose_chart = [dict(zip([d[0] for d in cursor.description], r)) for r in cursor.fetchall()]

    # Default by Income
    cursor.execute("""
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
    """)
    default_income_chart = [dict(zip([d[0] for d in cursor.description], r)) for r in cursor.fetchall()]

    # State
    cursor.execute("""
    SELECT 
        branch_state,
        COUNT(*) AS total_applications,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN loan_status = 'Approved' THEN loan_amount ELSE 0 END) AS disbursed_inr,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 1) AS approval_rate_pct
    FROM loan_applications
    GROUP BY branch_state
    ORDER BY disbursed_inr DESC;
    """)
    state_chart = [dict(zip([d[0] for d in cursor.description], r)) for r in cursor.fetchall()]

    # Segmentation Matrix
    cursor.execute("""
    SELECT 
        credit_band,
        income_band,
        COUNT(*) as total_count,
        SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        ROUND(100.0 * SUM(CASE WHEN loan_status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*), 1) AS approval_rate_pct
    FROM loan_applications
    GROUP BY credit_band, income_band
    ORDER BY 
        CASE credit_band
            WHEN 'Excellent (800+)' THEN 1
            WHEN 'Very Good (740-799)' THEN 2
            WHEN 'Good (670-739)' THEN 3
            WHEN 'Fair (580-669)' THEN 4
            WHEN 'Poor (<580)' THEN 5
            ELSE 6
        END;
    """)
    segmentation_chart = [dict(zip([d[0] for d in cursor.description], r)) for r in cursor.fetchall()]

    conn.close()

    with open("ml/metrics.json", "r", encoding="utf-8") as f:
        metrics_json = json.load(f)
    with open("ml/feature_importance.json", "r", encoding="utf-8") as f:
        fi_json = json.load(f)

    fallback = {
        "kpis": kpis_dict,
        "queries": QUERIES,
        "query_results": query_results,
        "sample_apps": sample_apps,
        "charts": {
            "monthly_disbursement": monthly_chart,
            "approval_by_credit_band": credit_chart,
            "loan_purpose_distribution": purpose_chart,
            "default_by_income_band": default_income_chart,
            "state_disbursement": state_chart,
            "segmentation_matrix": segmentation_chart
        },
        "metrics": metrics_json,
        "feature_importance": fi_json
    }

    out_path = "frontend/src/lib/fallbackData.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(fallback, f, indent=2)

    print(f"Created {out_path} successfully!")

if __name__ == "__main__":
    generate_static_data()
