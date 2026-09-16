"""
Test runner for the 12 analytics queries against data/loans.db
"""

import sqlite3
import time
import sys
import os

sys.path.insert(0, os.path.abspath("."))
from backend.app.queries import QUERIES

def test_queries():
    conn = sqlite3.connect("data/loans.db")
    cursor = conn.cursor()

    print("=" * 85)
    print(f"{'#':<3} | {'Query Title':<45} | {'Rows':<5} | {'Cols':<5} | {'Latency':<8}")
    print("=" * 85)

    for q in QUERIES:
        t0 = time.perf_counter()
        cursor.execute(q["sql"])
        rows = cursor.fetchall()
        elapsed_ms = (time.perf_counter() - t0) * 1000
        cols = [d[0] for d in cursor.description]
        print(f"{q['id']:<3} | {q['title'][:45]:<45} | {len(rows):<5} | {len(cols):<5} | {elapsed_ms:6.2f} ms")

    conn.close()
    print("=" * 85)
    print("All 12 queries executed successfully against 50,000 records!")

if __name__ == "__main__":
    test_queries()
