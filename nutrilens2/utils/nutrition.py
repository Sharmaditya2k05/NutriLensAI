"""
utils/nutrition.py
All nutrition logic: scoring, flag detection, label generation, chart data.
Pure functions — no Streamlit dependencies.
"""

from typing import Optional


# ── Daily Reference Values (based on EU/WHO guidelines per day) ──────────
DRV = {
    "energy_kcal": 2000,
    "fat": 70,
    "saturated_fat": 20,
    "carbohydrates": 260,
    "sugars": 50,
    "fiber": 25,
    "proteins": 50,
    "salt": 6,
    "sodium": 2.4,
}

# Thresholds per 100g (WHO / Nutri-Score guidelines)
THRESHOLDS = {
    "sugars":        {"high": 22.5, "moderate": 5.0},
    "fat":           {"high": 17.5, "moderate": 3.0},
    "saturated_fat": {"high": 5.0,  "moderate": 1.5},
    "salt":          {"high": 1.5,  "moderate": 0.3},
    "sodium":        {"high": 0.6,  "moderate": 0.12},
    "energy_kcal":   {"high": 400,  "moderate": 200},
}

POSITIVE_THRESHOLDS = {
    "fiber":    {"good": 3.0, "excellent": 6.0},
    "proteins": {"good": 5.0, "excellent": 10.0},
}

ALLERGEN_SEVERITY = {
    "Milk": "high", "Eggs": "high", "Fish": "high", "Crustaceans": "high",
    "Tree Nuts": "high", "Peanuts": "high", "Wheat": "high", "Soybeans": "high",
    "Nuts": "high", "Gluten": "high", "Soy": "high", "Celery": "moderate",
    "Mustard": "moderate", "Sesame": "moderate", "Sulphur Dioxide": "moderate",
    "Lupin": "moderate", "Molluscs": "moderate",
}

CONTROVERSIAL_INGREDIENTS = {
    "palm oil": ("⚠️ Environmental concern", "warn"),
    "high fructose corn syrup": ("🚨 Linked to metabolic issues", "danger"),
    "hydrogenated": ("🚨 Trans fat source", "danger"),
    "aspartame": ("⚠️ Artificial sweetener", "warn"),
    "sodium nitrate": ("⚠️ Processed meat preservative", "warn"),
    "monosodium glutamate": ("ℹ️ Flavor enhancer (MSG)", "info"),
    "carrageenan": ("⚠️ May cause digestive issues", "warn"),
    "artificial color": ("⚠️ Synthetic dye", "warn"),
    "red 40": ("⚠️ Synthetic dye", "warn"),
    "yellow 5": ("⚠️ Synthetic dye", "warn"),
    "bha": ("🚨 Possible carcinogen", "danger"),
    "bht": ("🚨 Possible carcinogen", "danger"),
    "sodium benzoate": ("⚠️ Preservative concern", "warn"),
}


def classify_health(product: dict) -> dict:
    """
    Classify a product as Healthy / Moderate / Unhealthy.
    Returns: {label, score (0-100), color, emoji, rationale}
    """
    score = 55  # baseline
    penalties = []
    bonuses = []

    # Negative factors
    for nutrient, thresh in THRESHOLDS.items():
        val = product.get(nutrient)
        if val is None:
            continue
        if val > thresh["high"]:
            score -= 10
            penalties.append(f"High {_fmt_name(nutrient)} ({val}g)")
        elif val > thresh["moderate"]:
            score -= 4
            penalties.append(f"Moderate {_fmt_name(nutrient)} ({val}g)")

    # Positive factors
    for nutrient, thresh in POSITIVE_THRESHOLDS.items():
        val = product.get(nutrient)
        if val is None:
            continue
        if val >= thresh["excellent"]:
            score += 15
            bonuses.append(f"Excellent {_fmt_name(nutrient)} ({val}g)")
        elif val >= thresh["good"]:
            score += 7
            bonuses.append(f"Good {_fmt_name(nutrient)} ({val}g)")

    # NOVA group bonus/penalty
    nova = product.get("nova_group")
    if nova == 1:
        score += 10
        bonuses.append("Unprocessed food (NOVA 1)")
    elif nova == 2:
        score += 5
    elif nova == 3:
        score -= 5
    elif nova == 4:
        score -= 15
        penalties.append("Ultra-processed food (NOVA 4)")

    # Nutri-Score adjustment
    ns = product.get("nutri_score", "N/A")
    ns_map = {"A": 15, "B": 8, "C": 0, "D": -8, "E": -18}
    score += ns_map.get(ns, 0)

    score = max(5, min(100, score))

    if score >= 65:
        label, color, emoji = "Healthy", "#22c55e", "✅"
    elif score >= 40:
        label, color, emoji = "Moderate", "#f59e0b", "⚠️"
    else:
        label, color, emoji = "Unhealthy", "#ef4444", "🚨"

    return {
        "label": label,
        "score": score,
        "color": color,
        "emoji": emoji,
        "penalties": penalties,
        "bonuses": bonuses,
    }


def get_red_flags(product: dict) -> list[dict]:
    """Return list of red flag dicts for a product."""
    flags = []
    nutrient_labels = {
        "sugars": "Sugar", "fat": "Total Fat", "saturated_fat": "Saturated Fat",
        "salt": "Salt", "sodium": "Sodium", "energy_kcal": "Calories",
    }
    units = {
        "energy_kcal": "kcal", "sugars": "g", "fat": "g",
        "saturated_fat": "g", "salt": "g", "sodium": "g"
    }

    for nutrient, thresh in THRESHOLDS.items():
        val = product.get(nutrient)
        if val is None:
            continue
        label = nutrient_labels.get(nutrient, nutrient)
        unit = units.get(nutrient, "g")
        if val > thresh["high"]:
            flags.append({
                "nutrient": label, "value": val, "unit": unit,
                "level": "high", "threshold": thresh["high"],
                "message": f"{label} is very high at {val}{unit}/100g (limit: {thresh['high']}{unit})"
            })
        elif val > thresh["moderate"]:
            flags.append({
                "nutrient": label, "value": val, "unit": unit,
                "level": "moderate", "threshold": thresh["moderate"],
                "message": f"{label} is moderately high at {val}{unit}/100g"
            })

    return flags


def get_positives(product: dict) -> list[dict]:
    """Return list of positive nutrient dicts."""
    positives = []
    for nutrient, thresh in POSITIVE_THRESHOLDS.items():
        val = product.get(nutrient)
        if val is None:
            continue
        if val >= thresh["good"]:
            level = "excellent" if val >= thresh["excellent"] else "good"
            positives.append({
                "nutrient": nutrient.title(),
                "value": val,
                "level": level,
                "message": f"{'Excellent' if level == 'excellent' else 'Good'} source of {nutrient} ({val}g/100g)"
            })
    return positives


def get_drv_percentages(product: dict) -> dict:
    """Return % of daily reference value for each nutrient (per 100g serving)."""
    result = {}
    for nutrient, daily in DRV.items():
        val = product.get(nutrient)
        if val is not None and daily > 0:
            pct = round((val / daily) * 100, 1)
            result[nutrient] = min(pct, 200)
    return result


def detect_controversial_ingredients(ingredients_text: str) -> list[dict]:
    """Scan ingredients text for controversial additives."""
    if not ingredients_text:
        return []
    text_lower = ingredients_text.lower()
    found = []
    for ingredient, (message, severity) in CONTROVERSIAL_INGREDIENTS.items():
        if ingredient in text_lower:
            found.append({
                "ingredient": ingredient.title(),
                "message": message,
                "severity": severity,
            })
    return found


def nutri_score_description(score: str) -> str:
    descriptions = {
        "A": "Excellent nutritional quality — green choice",
        "B": "Good nutritional quality",
        "C": "Average nutritional quality",
        "D": "Poor nutritional quality — moderate consumption",
        "E": "Very poor nutritional quality — consume sparingly",
        "N/A": "Nutri-Score not available for this product",
    }
    return descriptions.get(score, "Unknown")


def nova_description(nova: Optional[int]) -> str:
    descriptions = {
        1: "Unprocessed or minimally processed food",
        2: "Processed culinary ingredient",
        3: "Processed food",
        4: "Ultra-processed food — industrial formulation",
    }
    return descriptions.get(nova, "Processing level unknown")


def _fmt_name(nutrient: str) -> str:
    return nutrient.replace("_", " ").replace("kcal", "(kcal)").title()


def get_nutri_score_color(score: str) -> str:
    return {
        "A": "#1a9641", "B": "#74b816", "C": "#f59e0b",
        "D": "#f97316", "E": "#dc2626", "N/A": "#6b7280"
    }.get(score, "#6b7280")


def get_nova_color(nova: Optional[int]) -> str:
    return {1: "#22c55e", 2: "#84cc16", 3: "#f59e0b", 4: "#ef4444"}.get(nova, "#6b7280")
