"""
utils/food_api.py
Wrappers for Open Food Facts API and USDA FoodData Central.
All network calls are isolated here so the rest of the app stays clean.
"""

import requests
import os
import json
import re
from typing import Optional

OFF_BASE = "https://world.openfoodfacts.org"
USDA_BASE = "https://api.nal.usda.gov/fdc/v1"

HEADERS = {
    "User-Agent": os.getenv("OFF_USER_AGENT", "NutriLensAI/1.0 (educational project)")
}


# ── Open Food Facts ────────────────────────────────────────────────────────

def search_products(query: str, page: int = 1, page_size: int = 8) -> list[dict]:
    """Search products by name. Returns a list of cleaned product dicts."""
    try:
        url = f"{OFF_BASE}/cgi/search.pl"
        params = {
            "search_terms": query,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "page": page,
            "page_size": page_size,
            "fields": "code,product_name,brands,image_small_url,nutrition_grades,nova_group,categories_tags,nutriments,allergens_tags,ingredients_text"
        }
        r = requests.get(url, params=params, headers=HEADERS, timeout=10)
        r.raise_for_status()
        data = r.json()
        products = data.get("products", [])
        return [_clean_product(p) for p in products if p.get("product_name")]
    except Exception as e:
        return []


def get_product_by_barcode(barcode: str) -> Optional[dict]:
    """Fetch a single product by barcode."""
    try:
        url = f"{OFF_BASE}/api/v0/product/{barcode}.json"
        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()
        data = r.json()
        if data.get("status") == 1:
            return _clean_product(data["product"])
        return None
    except Exception:
        return None


def _clean_product(p: dict) -> dict:
    """Normalize a raw OFF product into a flat, usable dict."""
    n = p.get("nutriments", {})

    def g(key, fallback=None):
        val = n.get(f"{key}_100g", n.get(key, fallback))
        try:
            return round(float(val), 2) if val is not None else fallback
        except (TypeError, ValueError):
            return fallback

    # Allergen cleanup
    allergen_tags = p.get("allergens_tags", [])
    allergens = [a.replace("en:", "").replace("-", " ").title() for a in allergen_tags]

    # Category cleanup
    cat_tags = p.get("categories_tags", [])
    categories = []
    for c in cat_tags[:3]:
        c = c.split(":")[-1].replace("-", " ").title()
        if len(c) > 2:
            categories.append(c)

    return {
        "barcode": p.get("code", ""),
        "name": p.get("product_name", "Unknown Product").strip(),
        "brand": p.get("brands", "Unknown Brand").strip(),
        "image_url": p.get("image_small_url") or p.get("image_url", ""),
        "nutri_score": (p.get("nutrition_grades") or "").upper() or "N/A",
        "nova_group": p.get("nova_group", None),
        "categories": categories,
        "ingredients_text": p.get("ingredients_text", ""),
        "allergens": allergens,
        # Per 100g nutrition
        "energy_kcal": g("energy-kcal"),
        "fat": g("fat"),
        "saturated_fat": g("saturated-fat"),
        "carbohydrates": g("carbohydrates"),
        "sugars": g("sugars"),
        "fiber": g("fiber"),
        "proteins": g("proteins"),
        "salt": g("salt"),
        "sodium": g("sodium"),
    }


# ── USDA FoodData Central (fallback / enrichment) ──────────────────────────

def search_usda(query: str, max_results: int = 5) -> list[dict]:
    """Search USDA FoodData Central for nutrition data."""
    api_key = os.getenv("USDA_API_KEY", "DEMO_KEY")
    try:
        url = f"{USDA_BASE}/foods/search"
        params = {
            "query": query,
            "pageSize": max_results,
            "api_key": api_key,
            "dataType": "Branded,Foundation"
        }
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        foods = r.json().get("foods", [])
        return foods
    except Exception:
        return []


# ── Mock / Demo data (used when offline or API returns nothing) ────────────

DEMO_PRODUCTS = {
    "nutella": {
        "barcode": "3017620422003",
        "name": "Nutella",
        "brand": "Ferrero",
        "image_url": "",
        "nutri_score": "E",
        "nova_group": 4,
        "categories": ["Chocolate Spreads", "Sweet Spreads"],
        "ingredients_text": "Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat-reduced cocoa (7.4%), lecithin as emulsifier (soy), vanillin",
        "allergens": ["Milk", "Nuts", "Soy"],
        "energy_kcal": 530,
        "fat": 30.9,
        "saturated_fat": 10.6,
        "carbohydrates": 57.5,
        "sugars": 56.3,
        "fiber": 3.4,
        "proteins": 6.3,
        "salt": 0.107,
        "sodium": 0.042,
    },
    "oats": {
        "barcode": "8901262043100",
        "name": "Quaker Oats",
        "brand": "Quaker",
        "image_url": "",
        "nutri_score": "A",
        "nova_group": 1,
        "categories": ["Cereals", "Oats"],
        "ingredients_text": "Whole grain rolled oats",
        "allergens": ["Gluten"],
        "energy_kcal": 367,
        "fat": 6.9,
        "saturated_fat": 1.2,
        "carbohydrates": 58.7,
        "sugars": 0.9,
        "fiber": 9.4,
        "proteins": 12.5,
        "salt": 0.0,
        "sodium": 0.0,
    },
    "lays": {
        "barcode": "0028400090032",
        "name": "Lay's Classic Potato Chips",
        "brand": "Lay's",
        "image_url": "",
        "nutri_score": "D",
        "nova_group": 4,
        "categories": ["Snacks", "Chips", "Potato Chips"],
        "ingredients_text": "Potatoes, vegetable oil (sunflower, corn, and/or canola oil), salt",
        "allergens": [],
        "energy_kcal": 536,
        "fat": 34.5,
        "saturated_fat": 3.1,
        "carbohydrates": 53.0,
        "sugars": 0.5,
        "fiber": 3.8,
        "proteins": 6.6,
        "salt": 1.2,
        "sodium": 0.48,
    },
    "maggi": {
        "barcode": "8901058811414",
        "name": "Maggi 2-Minute Noodles",
        "brand": "Nestlé India",
        "image_url": "",
        "nutri_score": "D",
        "nova_group": 4,
        "categories": ["Instant Noodles", "Snacks"],
        "ingredients_text": "Wheat flour (maida), palm oil, salt, sugar, flavor enhancer (monosodium glutamate), onion powder, spices (turmeric, coriander, red chilli), garlic powder, citric acid",
        "allergens": ["Gluten"],
        "energy_kcal": 430,
        "fat": 17.0,
        "saturated_fat": 8.0,
        "carbohydrates": 59.0,
        "sugars": 2.0,
        "fiber": 2.4,
        "proteins": 9.0,
        "salt": 2.6,
        "sodium": 1.04,
    },
    "amul_butter": {
        "barcode": "8901262011013",
        "name": "Amul Butter",
        "brand": "Amul",
        "image_url": "",
        "nutri_score": "D",
        "nova_group": 2,
        "categories": ["Dairy", "Butter"],
        "ingredients_text": "Pasteurised cream, common salt, permitted natural colour (Annatto)",
        "allergens": ["Milk"],
        "energy_kcal": 720,
        "fat": 80.0,
        "saturated_fat": 51.0,
        "carbohydrates": 0.6,
        "sugars": 0.6,
        "fiber": 0,
        "proteins": 0.9,
        "salt": 2.5,
        "sodium": 1.0,
    },
    "haldirams": {
        "barcode": "8904004400015",
        "name": "Haldiram's Aloo Bhujia",
        "brand": "Haldiram's",
        "image_url": "",
        "nutri_score": "D",
        "nova_group": 4,
        "categories": ["Snacks", "Namkeen", "Indian Snacks"],
        "ingredients_text": "Potato flakes, gram flour (besan), edible vegetable oil (palmolein), salt, spices (red chilli, turmeric, coriander), asafoetida (hing), black salt",
        "allergens": [],
        "energy_kcal": 545,
        "fat": 33.0,
        "saturated_fat": 15.0,
        "carbohydrates": 52.0,
        "sugars": 2.5,
        "fiber": 4.5,
        "proteins": 8.0,
        "salt": 2.0,
        "sodium": 0.8,
    },
    "parle_g": {
        "barcode": "8901263010353",
        "name": "Parle-G Biscuits",
        "brand": "Parle",
        "image_url": "",
        "nutri_score": "D",
        "nova_group": 4,
        "categories": ["Biscuits", "Snacks"],
        "ingredients_text": "Wheat flour (maida), sugar, edible vegetable oil (palm), milk solids, invert syrup, leavening agents (503(ii), 500(ii)), salt, emulsifier (322)",
        "allergens": ["Gluten", "Milk", "Soy"],
        "energy_kcal": 462,
        "fat": 14.5,
        "saturated_fat": 6.7,
        "carbohydrates": 76.0,
        "sugars": 26.5,
        "fiber": 2.0,
        "proteins": 6.5,
        "salt": 0.7,
        "sodium": 0.28,
    },
    "mother_dairy_curd": {
        "barcode": "8901200000001",
        "name": "Mother Dairy Dahi (Curd)",
        "brand": "Mother Dairy",
        "image_url": "",
        "nutri_score": "A",
        "nova_group": 1,
        "categories": ["Dairy", "Curd", "Probiotics"],
        "ingredients_text": "Toned milk, bacterial culture (Lactobacillus)",
        "allergens": ["Milk"],
        "energy_kcal": 60,
        "fat": 3.0,
        "saturated_fat": 1.9,
        "carbohydrates": 4.7,
        "sugars": 4.7,
        "fiber": 0,
        "proteins": 3.1,
        "salt": 0.08,
        "sodium": 0.03,
    },
    "aashirvaad_atta": {
        "barcode": "8901063010017",
        "name": "Aashirvaad Whole Wheat Atta",
        "brand": "Aashirvaad (ITC)",
        "image_url": "",
        "nutri_score": "A",
        "nova_group": 1,
        "categories": ["Flour", "Whole Grains", "Staples"],
        "ingredients_text": "100% whole wheat grain",
        "allergens": ["Gluten"],
        "energy_kcal": 341,
        "fat": 1.5,
        "saturated_fat": 0.3,
        "carbohydrates": 71.0,
        "sugars": 0.3,
        "fiber": 11.0,
        "proteins": 12.1,
        "salt": 0.01,
        "sodium": 0.004,
    },
}

def get_demo_product(name: str) -> Optional[dict]:
    name_lower = name.lower()
    # Direct key match
    for key, product in DEMO_PRODUCTS.items():
        if key in name_lower or name_lower in key:
            return product
    # Alias matches
    aliases = {
        'amul': 'amul_butter', 'butter': 'amul_butter',
        'bhujia': 'haldirams', 'namkeen': 'haldirams',
        'parle': 'parle_g', 'biscuit': 'parle_g',
        'dahi': 'mother_dairy_curd', 'curd': 'mother_dairy_curd', 'yogurt': 'mother_dairy_curd',
        'atta': 'aashirvaad_atta', 'wheat': 'aashirvaad_atta',
        'noodles': 'maggi', 'noodle': 'maggi',
    }
    for alias, key in aliases.items():
        if alias in name_lower:
            return DEMO_PRODUCTS.get(key)
    return None
