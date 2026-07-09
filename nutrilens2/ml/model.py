"""
ml/model.py
Rule-based label creation + ML classification pipeline.
Uses scikit-learn; model is cached to disk after first training.
"""

import os
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from typing import Optional

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.impute import SimpleImputer

MODEL_PATH = Path(__file__).parent / "saved_model.joblib"
FEATURE_COLS = [
    "energy_kcal", "fat", "saturated_fat", "carbohydrates",
    "sugars", "fiber", "proteins", "salt"
]

LABEL_MAP = {"healthy": 0, "moderate": 1, "unhealthy": 2}
LABEL_REVERSE = {v: k for k, v in LABEL_MAP.items()}


# ── Label creation ────────────────────────────────────────────────────────

def create_label(row: dict) -> str:
    """Rule-based ground truth label for training data."""
    sugars = row.get("sugars") or 0
    sat_fat = row.get("saturated_fat") or 0
    salt = row.get("salt") or 0
    fiber = row.get("fiber") or 0
    proteins = row.get("proteins") or 0
    energy = row.get("energy_kcal") or 0

    unhealthy_score = 0
    if sugars > 22.5: unhealthy_score += 2
    elif sugars > 12: unhealthy_score += 1
    if sat_fat > 5.0: unhealthy_score += 2
    elif sat_fat > 2: unhealthy_score += 1
    if salt > 1.5: unhealthy_score += 2
    elif salt > 0.75: unhealthy_score += 1
    if energy > 450: unhealthy_score += 1

    healthy_score = 0
    if fiber >= 6: healthy_score += 2
    elif fiber >= 3: healthy_score += 1
    if proteins >= 10: healthy_score += 2
    elif proteins >= 5: healthy_score += 1

    net = healthy_score - unhealthy_score
    if net >= 2:
        return "healthy"
    elif net <= -2:
        return "unhealthy"
    else:
        return "moderate"


# ── Synthetic training data ───────────────────────────────────────────────

def generate_training_data(n: int = 3000) -> pd.DataFrame:
    """
    Generate realistic synthetic nutrition data for training.
    Each category has its own distribution reflecting real-world patterns.
    """
    np.random.seed(42)
    records = []

    profiles = {
        "fruit_veg": {
            "energy_kcal": (45, 20), "fat": (0.3, 0.3), "saturated_fat": (0.05, 0.05),
            "carbohydrates": (9, 5), "sugars": (7, 4), "fiber": (2.5, 1.5),
            "proteins": (1.2, 0.8), "salt": (0.02, 0.02),
        },
        "whole_grains": {
            "energy_kcal": (340, 40), "fat": (3, 2), "saturated_fat": (0.5, 0.3),
            "carbohydrates": (65, 10), "sugars": (1.5, 1.5), "fiber": (8, 3),
            "proteins": (12, 3), "salt": (0.1, 0.1),
        },
        "dairy": {
            "energy_kcal": (120, 50), "fat": (5, 4), "saturated_fat": (3, 2),
            "carbohydrates": (10, 5), "sugars": (8, 4), "fiber": (0, 0),
            "proteins": (8, 3), "salt": (0.3, 0.2),
        },
        "snacks_junk": {
            "energy_kcal": (520, 60), "fat": (30, 10), "saturated_fat": (8, 4),
            "carbohydrates": (55, 15), "sugars": (25, 15), "fiber": (2, 1.5),
            "proteins": (6, 3), "salt": (1.8, 0.8),
        },
        "beverages_sugary": {
            "energy_kcal": (180, 60), "fat": (0, 0), "saturated_fat": (0, 0),
            "carbohydrates": (45, 15), "sugars": (40, 15), "fiber": (0, 0),
            "proteins": (0, 0), "salt": (0.05, 0.05),
        },
        "meat_processed": {
            "energy_kcal": (280, 80), "fat": (20, 8), "saturated_fat": (7, 3),
            "carbohydrates": (5, 5), "sugars": (1, 1), "fiber": (0.5, 0.5),
            "proteins": (18, 5), "salt": (2.5, 1),
        },
        "breakfast_cereal": {
            "energy_kcal": (370, 50), "fat": (5, 3), "saturated_fat": (1.5, 1),
            "carbohydrates": (70, 15), "sugars": (20, 15), "fiber": (5, 3),
            "proteins": (8, 3), "salt": (0.8, 0.4),
        },
        "confectionery": {
            "energy_kcal": (490, 60), "fat": (25, 10), "saturated_fat": (14, 5),
            "carbohydrates": (60, 15), "sugars": (55, 10), "fiber": (1.5, 1.5),
            "proteins": (5, 3), "salt": (0.2, 0.2),
        },
    }

    per_profile = n // len(profiles)

    for profile_name, params in profiles.items():
        for _ in range(per_profile):
            row = {}
            for col, (mean, std) in params.items():
                val = np.random.normal(mean, std)
                row[col] = max(0, round(val, 2))
            row["label"] = create_label(row)
            records.append(row)

    df = pd.DataFrame(records)
    return df


# ── Model pipeline ────────────────────────────────────────────────────────

def build_pipeline(model_type: str = "random_forest") -> Pipeline:
    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"),
        "decision_tree": DecisionTreeClassifier(max_depth=8, random_state=42, class_weight="balanced"),
        "random_forest": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight="balanced"),
        "gradient_boosting": GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42),
    }
    clf = models.get(model_type, models["random_forest"])
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("clf", clf),
    ])


def train_model(model_type: str = "random_forest") -> dict:
    """Train and evaluate a model, return metrics."""
    df = generate_training_data(3000)
    X = df[FEATURE_COLS].values
    y = df["label"].map(LABEL_MAP).values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline(model_type)
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring="f1_weighted")
    report = classification_report(y_test, y_pred, target_names=["healthy", "moderate", "unhealthy"], output_dict=True)

    # Save model
    joblib.dump(pipeline, MODEL_PATH)

    return {
        "accuracy": round(acc, 4),
        "f1_weighted": round(f1, 4),
        "cv_mean": round(cv_scores.mean(), 4),
        "cv_std": round(cv_scores.std(), 4),
        "report": report,
        "model_type": model_type,
        "train_size": len(X_train),
        "test_size": len(X_test),
    }


def load_model():
    """Load saved model, train if not found."""
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    # Auto-train on first use
    train_model("random_forest")
    return joblib.load(MODEL_PATH)


def predict(product: dict) -> dict:
    """Predict health label for a product dict."""
    try:
        model = load_model()
        features = np.array([[
            product.get(col) or 0 for col in FEATURE_COLS
        ]])
        pred_int = model.predict(features)[0]
        probas = model.predict_proba(features)[0]

        label = LABEL_REVERSE.get(pred_int, "moderate")
        confidence = round(float(probas[pred_int]) * 100, 1)

        label_colors = {"healthy": "#22c55e", "moderate": "#f59e0b", "unhealthy": "#ef4444"}
        label_emojis = {"healthy": "✅", "moderate": "⚠️", "unhealthy": "🚨"}

        return {
            "label": label,
            "confidence": confidence,
            "color": label_colors.get(label, "#6b7280"),
            "emoji": label_emojis.get(label, ""),
            "probabilities": {
                "healthy": round(float(probas[0]) * 100, 1),
                "moderate": round(float(probas[1]) * 100, 1),
                "unhealthy": round(float(probas[2]) * 100, 1),
            }
        }
    except Exception as e:
        return {"label": "unknown", "confidence": 0, "color": "#6b7280", "emoji": "❓", "probabilities": {}, "error": str(e)}


def compare_models() -> dict:
    """Train and compare all model types. Returns results dict."""
    df = generate_training_data(2000)
    X = df[FEATURE_COLS].values
    y = df["label"].map(LABEL_MAP).values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    results = {}
    model_types = ["logistic_regression", "decision_tree", "random_forest", "gradient_boosting"]

    for mt in model_types:
        p = build_pipeline(mt)
        p.fit(X_train, y_train)
        y_pred = p.predict(X_test)
        results[mt] = {
            "accuracy": round(accuracy_score(y_test, y_pred), 4),
            "f1": round(f1_score(y_test, y_pred, average="weighted"), 4),
        }

    return results
