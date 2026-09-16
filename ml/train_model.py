"""
CreditLens Machine Learning Training Pipeline
Trains:
1. Approval Model: Logistic Regression (predicts loan_status)
2. Risk Model: Random Forest with class_weight='balanced' (predicts default_flag)
Saves evaluated metrics to ml/metrics.json, feature importances to ml/feature_importance.json,
and pipeline artifacts to ml/artifacts/.
"""

import os
import json
import sqlite3
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

# Feature definitions
NUMERIC_FEATURES = [
    "age", "applicant_income", "coapplicant_income", "loan_amount",
    "loan_term_months", "interest_rate", "credit_score", "existing_emi",
    "total_income", "emi", "dti_ratio", "loan_to_income"
]

CATEGORICAL_FEATURES = [
    "gender", "marital_status", "dependents", "education",
    "self_employed", "property_area", "loan_purpose", "credit_history"
]

def load_data_from_sqlite(db_path: str = "data/loans.db") -> pd.DataFrame:
    print(f"Loading data from SQLite: {db_path}...")
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query("SELECT * FROM loan_applications", conn)
    conn.close()
    print(f"Loaded {len(df)} records.")
    return df

def build_preprocessor() -> ColumnTransformer:
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERIC_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES)
        ]
    )
    return preprocessor

def get_feature_names(preprocessor: ColumnTransformer) -> list:
    """Extract encoded feature names from fitted ColumnTransformer."""
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    return NUMERIC_FEATURES + cat_feature_names

def train_and_evaluate(db_path: str = "data/loans.db", artifacts_dir: str = "ml/artifacts"):
    os.makedirs(artifacts_dir, exist_ok=True)
    os.makedirs("ml", exist_ok=True)

    df = load_data_from_sqlite(db_path)

    # -------------------------------------------------------------
    # 1. APPROVAL MODEL (Logistic Regression)
    # -------------------------------------------------------------
    print("\n--- Training Loan Approval Model (Logistic Regression) ---")
    X_app = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
    y_app = (df["loan_status"] == "Approved").astype(int).values

    X_train_app, X_test_app, y_train_app, y_test_app = train_test_split(
        X_app, y_app, test_size=0.20, random_state=42, stratify=y_app
    )

    preprocessor_app = build_preprocessor()
    approval_pipeline = Pipeline([
        ("preprocessor", preprocessor_app),
        ("classifier", LogisticRegression(max_iter=1000, C=1.0, random_state=42))
    ])

    approval_pipeline.fit(X_train_app, y_train_app)

    y_pred_app = approval_pipeline.predict(X_test_app)
    y_prob_app = approval_pipeline.predict_proba(X_test_app)[:, 1]

    cm_app = confusion_matrix(y_test_app, y_pred_app).tolist()
    acc_app = accuracy_score(y_test_app, y_pred_app)
    prec_app = precision_score(y_test_app, y_pred_app)
    rec_app = recall_score(y_test_app, y_pred_app)
    f1_app = f1_score(y_test_app, y_pred_app)
    roc_app = roc_auc_score(y_test_app, y_prob_app)

    print(f"Approval Model Test Metrics:")
    print(f"  Accuracy:  {acc_app:.4f} (Target: >= 0.80)")
    print(f"  Precision: {prec_app:.4f}")
    print(f"  Recall:    {rec_app:.4f}")
    print(f"  F1 Score:  {f1_app:.4f}")
    print(f"  ROC-AUC:   {roc_app:.4f} (Target: >= 0.85)")
    print(f"  Confusion Matrix: {cm_app}")

    joblib.dump(approval_pipeline, os.path.join(artifacts_dir, "approval_pipeline.joblib"))

    # Feature Importance for Logistic Regression (coefficients)
    clf_app = approval_pipeline.named_steps["classifier"]
    encoded_names_app = get_feature_names(approval_pipeline.named_steps["preprocessor"])
    coefs = clf_app.coef_[0]

    app_importance = []
    for name, coef in zip(encoded_names_app, coefs):
        app_importance.append({
            "feature": name,
            "weight": round(float(coef), 4),
            "abs_weight": round(float(abs(coef)), 4),
            "direction": "Increases Approval" if coef > 0 else "Decreases Approval"
        })
    app_importance = sorted(app_importance, key=lambda x: x["abs_weight"], reverse=True)

    # -------------------------------------------------------------
    # 2. DEFAULT RISK MODEL (Random Forest with balanced weights)
    # -------------------------------------------------------------
    print("\n--- Training Default Risk Model (Random Forest) ---")
    # Train on approved loans where default flag is meaningful
    df_approved = df[df["loan_status"] == "Approved"].copy()
    X_def = df_approved[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
    y_def = df_approved["default_flag"].values

    X_train_def, X_test_def, y_train_def, y_test_def = train_test_split(
        X_def, y_def, test_size=0.20, random_state=42, stratify=y_def
    )

    preprocessor_def = build_preprocessor()
    default_pipeline = Pipeline([
        ("preprocessor", preprocessor_def),
        ("classifier", RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            class_weight="balanced",
            min_samples_split=20,
            random_state=42,
            n_jobs=-1
        ))
    ])

    default_pipeline.fit(X_train_def, y_train_def)

    y_pred_def = default_pipeline.predict(X_test_def)
    y_prob_def = default_pipeline.predict_proba(X_test_def)[:, 1]

    cm_def = confusion_matrix(y_test_def, y_pred_def).tolist()
    acc_def = accuracy_score(y_test_def, y_pred_def)
    prec_def = precision_score(y_test_def, y_pred_def)
    rec_def = recall_score(y_test_def, y_pred_def)
    f1_def = f1_score(y_test_def, y_pred_def)
    roc_def = roc_auc_score(y_test_def, y_prob_def)

    print(f"Default Risk Model Test Metrics:")
    print(f"  Accuracy:  {acc_def:.4f}")
    print(f"  Precision: {prec_def:.4f}")
    print(f"  Recall:    {rec_def:.4f}")
    print(f"  F1 Score:  {f1_def:.4f}")
    print(f"  ROC-AUC:   {roc_def:.4f}")
    print(f"  Confusion Matrix: {cm_def}")

    joblib.dump(default_pipeline, os.path.join(artifacts_dir, "default_pipeline.joblib"))

    # Feature Importance for Random Forest (Gini importance)
    rf_clf = default_pipeline.named_steps["classifier"]
    encoded_names_def = get_feature_names(default_pipeline.named_steps["preprocessor"])
    rf_importances = rf_clf.feature_importances_

    def_importance = []
    for name, imp in zip(encoded_names_def, rf_importances):
        def_importance.append({
            "feature": name,
            "importance": round(float(imp), 4)
        })
    def_importance = sorted(def_importance, key=lambda x: x["importance"], reverse=True)

    # -------------------------------------------------------------
    # 3. SAVE REAL METRICS & FEATURE IMPORTANCES
    # -------------------------------------------------------------
    metrics_data = {
        "approval_model": {
            "model_type": "Logistic Regression",
            "target": "loan_status (1=Approved, 0=Rejected)",
            "test_sample_size": len(y_test_app),
            "accuracy": round(float(acc_app), 4),
            "precision": round(float(prec_app), 4),
            "recall": round(float(rec_app), 4),
            "f1": round(float(f1_app), 4),
            "roc_auc": round(float(roc_app), 4),
            "confusion_matrix": {
                "true_negatives": cm_app[0][0],
                "false_positives": cm_app[0][1],
                "false_negatives": cm_app[1][0],
                "true_positives": cm_app[1][1],
                "matrix": cm_app
            },
            "parameters": {
                "penalty": "l2",
                "C": 1.0,
                "solver": "lbfgs",
                "max_iter": 1000
            }
        },
        "default_model": {
            "model_type": "Random Forest Classifier",
            "target": "default_flag (1=Default, 0=Non-Default)",
            "test_sample_size": len(y_test_def),
            "accuracy": round(float(acc_def), 4),
            "precision": round(float(prec_def), 4),
            "recall": round(float(rec_def), 4),
            "f1": round(float(f1_def), 4),
            "roc_auc": round(float(roc_def), 4),
            "confusion_matrix": {
                "true_negatives": cm_def[0][0],
                "false_positives": cm_def[0][1],
                "false_negatives": cm_def[1][0],
                "true_positives": cm_def[1][1],
                "matrix": cm_def
            },
            "parameters": {
                "n_estimators": 150,
                "max_depth": 8,
                "class_weight": "balanced",
                "min_samples_split": 20
            }
        }
    }

    metrics_path = os.path.join("ml", "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"\nSaved real evaluated metrics to {metrics_path}")

    feature_importance_data = {
        "approval_model_coefficients": app_importance,
        "default_model_importances": def_importance
    }
    fi_path = os.path.join("ml", "feature_importance.json")
    with open(fi_path, "w", encoding="utf-8") as f:
        json.dump(feature_importance_data, f, indent=2)
    print(f"Saved feature importances to {fi_path}")

if __name__ == "__main__":
    train_and_evaluate()
