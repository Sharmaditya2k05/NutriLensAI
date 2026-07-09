"""
rag/knowledge_base.py
In-memory nutrition knowledge base with semantic retrieval.
Falls back to keyword search when vector store is not available.
"""

from typing import Optional
import re

# ── Nutrition knowledge documents ─────────────────────────────────────────

NUTRITION_DOCS = [
    {
        "id": "sugar_guidelines",
        "title": "Sugar Intake Guidelines",
        "content": """
The WHO recommends that free sugars (added sugars + natural sugars in juices/honey) should be
less than 10% of total energy intake, ideally below 5%. For a 2000 kcal diet, that is roughly
50g/day free sugars maximum, or ideally 25g/day.

On food labels, sugars above 22.5g per 100g are considered HIGH, and below 5g per 100g is LOW.

High sugar intake is linked to: obesity, type 2 diabetes, dental decay, fatty liver disease,
cardiovascular disease, and metabolic syndrome.

Natural sugars in whole fruits are less of a concern because they come packaged with fiber,
vitamins, and antioxidants that slow absorption. It is added/free sugars to watch out for.

Names for added sugar on labels: sucrose, glucose, fructose, dextrose, maltose, corn syrup,
high fructose corn syrup, invert sugar, agave nectar, honey, molasses, fruit juice concentrate.
""",
        "tags": ["sugar", "sweetener", "glucose", "fructose", "added sugar"]
    },
    {
        "id": "sodium_guidelines",
        "title": "Sodium and Salt Intake Guidelines",
        "content": """
The WHO recommends less than 2g of sodium (5g of salt) per day for adults.

On food labels in the EU, salt above 1.5g per 100g is HIGH, below 0.3g per 100g is LOW.
Sodium above 0.6g per 100g is HIGH.

Note: Salt = Sodium × 2.5. If a label shows sodium, multiply by 2.5 to get salt.

High sodium intake causes: high blood pressure (hypertension), increased risk of stroke,
heart disease, kidney disease, and water retention (edema).

Hidden sodium sources: bread, processed meats, cheese, canned soups, sauces, pickles,
instant noodles, chips, and restaurant food.

When comparing products, always check sodium PER 100g, not per serving, since serving
sizes vary widely between brands.
""",
        "tags": ["sodium", "salt", "hypertension", "blood pressure", "kidney"]
    },
    {
        "id": "fat_guidelines",
        "title": "Fat Types and Health Guidelines",
        "content": """
Not all fats are equal. There are four main types:

1. Saturated fat (LIMIT): Found in butter, cheese, red meat, coconut oil, palm oil.
   Raises LDL cholesterol. Keep below 10% of calories (about 20g/day on 2000 kcal diet).
   On labels, HIGH is above 5g per 100g, LOW is below 1.5g per 100g.

2. Trans fat (AVOID): Found in partially hydrogenated oils, some margarines and baked goods.
   Worst type for heart health. Many countries have banned or restricted it.
   Look for "partially hydrogenated" on ingredient lists.

3. Monounsaturated fat (OK to GOOD): Found in olive oil, avocado, nuts.
   Neutral to beneficial for heart health.

4. Polyunsaturated fat (GOOD): Includes Omega-3 (fatty fish, flaxseed, walnuts) and
   Omega-6. Essential fats your body cannot make. Omega-3 is anti-inflammatory.

Total fat HIGH is above 17.5g per 100g, LOW is below 3g per 100g.
""",
        "tags": ["fat", "saturated fat", "trans fat", "omega", "cholesterol", "heart"]
    },
    {
        "id": "fiber_guidelines",
        "title": "Dietary Fiber and Its Benefits",
        "content": """
Adults should aim for 25-30g of dietary fiber per day (most people only get 15g).

On food labels, fiber above 6g per 100g is HIGH (excellent source), above 3g per 100g
is a GOOD source.

Types of fiber:
- Soluble fiber (oats, beans, apples, psyllium): Dissolves in water, slows digestion,
  lowers LDL cholesterol, stabilizes blood sugar.
- Insoluble fiber (wheat bran, vegetables, whole grains): Adds bulk, prevents constipation,
  feeds good gut bacteria.

Benefits of high fiber intake: lower risk of heart disease, type 2 diabetes, colon cancer,
diverticular disease, healthy weight management, better gut microbiome diversity,
improved blood sugar control, lower cholesterol.

Best fiber sources: vegetables, legumes (lentils, chickpeas, beans), whole grains (oats,
barley, quinoa), fruits (with skin), nuts, and seeds.
""",
        "tags": ["fiber", "fibre", "digestive", "gut", "constipation", "cholesterol"]
    },
    {
        "id": "nutri_score_explained",
        "title": "Nutri-Score Label Explained",
        "content": """
Nutri-Score is a 5-colour front-of-pack nutrition label ranging from A (dark green, best)
to E (red, worst). It was developed in France and is used across Europe.

The score is calculated per 100g and accounts for:
NEGATIVE factors (reduce score): calories, saturated fat, sugar, sodium
POSITIVE factors (improve score): fiber, protein, fruits/vegetables/legumes/nuts

Score guide:
- A (dark green): Best nutritional quality. Great everyday choice.
- B (light green): Good nutritional quality.
- C (yellow): Average nutritional quality. Moderate consumption.
- D (orange): Poor nutritional quality. Limit consumption.
- E (red): Very poor nutritional quality. Occasional treat only.

Important: Nutri-Score compares products WITHIN the same category. An E-rated cheese
is worse than a B-rated cheese but that does not mean cheese is worse than vegetables.
Always compare within category.

Nutri-Score does NOT account for: ultra-processing (NOVA), portion size, overall diet,
or organic/natural status.
""",
        "tags": ["nutri-score", "label", "nutrition grade", "A B C D E", "front of pack"]
    },
    {
        "id": "nova_explained",
        "title": "NOVA Food Processing Classification",
        "content": """
NOVA is a food classification system that groups foods by degree of processing:

NOVA 1 — Unprocessed or minimally processed foods:
Natural foods with no added substances. Examples: fresh fruits, vegetables, eggs,
plain meat, milk, plain rice, pasta, flour, frozen vegetables.

NOVA 2 — Processed culinary ingredients:
Substances extracted from food or nature used in cooking. Examples: oils, butter,
sugar, salt, flour, vinegar. Not eaten alone, used to prepare NOVA 1 foods.

NOVA 3 — Processed foods:
Simple combination of NOVA 1 + NOVA 2 ingredients. Often preserved. Examples:
canned vegetables, cured meats, cheese, bread, canned fish, salted nuts, beer, wine.

NOVA 4 — Ultra-processed foods (UPF):
Industrial formulations with many ingredients, including additives not found in your
kitchen. Examples: soft drinks, packaged snacks, instant noodles, chicken nuggets,
breakfast cereals with sugar, flavoured yoghurts, ready meals, industrial bread.

Why it matters: Higher NOVA group is associated with obesity, type 2 diabetes,
cardiovascular disease, depression, cancer, and all-cause mortality.
UPFs tend to be hyperpalatable (engineered to override fullness signals).
""",
        "tags": ["nova", "ultra-processed", "processing", "UPF", "additives"]
    },
    {
        "id": "allergen_guide",
        "title": "Major Food Allergens Guide",
        "content": """
The EU mandates declaration of 14 major allergens. In the US, the FDA mandates 9.

The 14 EU allergens:
1. Cereals containing gluten (wheat, rye, barley, oats)
2. Crustaceans (shrimp, crab, lobster)
3. Eggs
4. Fish
5. Peanuts
6. Soybeans
7. Milk (and lactose)
8. Nuts (almonds, hazelnuts, walnuts, cashews, pecans, pistachios, macadamia)
9. Celery
10. Mustard
11. Sesame seeds
12. Sulphur dioxide and sulphites (in concentrations >10 mg/kg)
13. Lupin
14. Molluscs

Cross-contamination warning: Products made in facilities that also handle allergens
may have "May contain traces of..." warnings. These are voluntary and indicate risk.

For severe allergies (anaphylaxis risk): peanuts, tree nuts, shellfish, and fish.
Always read labels carefully every time, even for familiar products (formulas change).
""",
        "tags": ["allergen", "allergy", "gluten", "nuts", "milk", "eggs", "soy", "peanut"]
    },
    {
        "id": "breakfast_comparison",
        "title": "How to Choose a Healthy Breakfast Cereal",
        "content": """
Breakfast cereals vary enormously in nutritional quality. Here's what to look for:

GOOD choices per 100g:
- Sugar: below 5g (ideally), definitely below 15g
- Fiber: above 6g
- Salt: below 0.3g
- Whole grain listed as first ingredient

RED FLAGS per 100g:
- Sugar above 20g (many popular children's cereals are 30-40g sugar)
- First ingredient is sugar or glucose syrup
- Long list of additives, colors, flavors
- Very low fiber (below 2g)

Best options: Plain rolled oats, muesli (no added sugar), bran flakes,
whole wheat biscuits (e.g. Weetabix), plain puffed rice/wheat.

Misleading claims:
- "Multigrain" just means multiple grains are used — not necessarily whole grain
- "Natural" has no legal definition on cereal packaging
- "Low sugar" can still have maltodextrin (high glycemic index)
- "Fortified with vitamins" does not offset high sugar content
""",
        "tags": ["breakfast", "cereal", "morning", "kids", "multigrain", "oats"]
    },
    {
        "id": "daily_values",
        "title": "Daily Reference Values for Key Nutrients",
        "content": """
These are the recommended daily intakes for an average adult (2000 kcal diet):

Energy: 2000 kcal (2500 for men, 2000 for women on average)
Total fat: 70g (30-35% of calories)
Saturated fat: 20g (max 10% of calories)
Carbohydrates: 260g (50-55% of calories)
Total sugars: 50g free sugars maximum, ideally 25g
Dietary fiber: 25-30g
Protein: 50g (varies by weight — roughly 0.8g per kg body weight)
Salt: 6g maximum (equivalent to 2.4g sodium)
Sodium: 2400mg maximum

Children need less of everything — scale by calorie needs.
Pregnant women, athletes, elderly, and people with conditions have different needs.

Quick mental math:
If a food has 10g of sugar per 100g and you eat 200g, that is 20g sugar —
40% of your daily free sugar budget from one food.
""",
        "tags": ["daily value", "reference intake", "DRV", "RDI", "how much", "recommended"]
    },
]


# ── Simple keyword retriever ──────────────────────────────────────────────

def _tokenize(text: str) -> set:
    return set(re.findall(r'\w+', text.lower()))


def retrieve(query: str, top_k: int = 3) -> list[dict]:
    """
    Retrieve top-k relevant documents for a query using keyword overlap.
    Falls back gracefully — no vector DB required.
    """
    query_tokens = _tokenize(query)
    scored = []

    for doc in NUTRITION_DOCS:
        # Score: overlap with title, tags, and content
        title_tokens = _tokenize(doc["title"])
        tag_tokens = set(t.lower() for tag in doc["tags"] for t in tag.split())
        content_tokens = _tokenize(doc["content"])

        title_score = len(query_tokens & title_tokens) * 3
        tag_score = len(query_tokens & tag_tokens) * 2
        content_score = len(query_tokens & content_tokens)

        total = title_score + tag_score + content_score
        scored.append((total, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [doc for score, doc in scored[:top_k] if score > 0]


def build_context(query: str, product: Optional[dict] = None) -> str:
    """Build a context string from retrieved docs + optional product."""
    docs = retrieve(query, top_k=3)
    context_parts = []

    if docs:
        context_parts.append("=== NUTRITION KNOWLEDGE BASE ===")
        for doc in docs:
            context_parts.append(f"\n--- {doc['title']} ---\n{doc['content'].strip()}")

    if product:
        context_parts.append("\n=== PRODUCT BEING ANALYZED ===")
        context_parts.append(f"Name: {product.get('name', 'Unknown')}")
        context_parts.append(f"Brand: {product.get('brand', 'Unknown')}")
        context_parts.append(f"Nutri-Score: {product.get('nutri_score', 'N/A')}")
        context_parts.append(f"NOVA Group: {product.get('nova_group', 'Unknown')}")
        for key in ["energy_kcal", "fat", "saturated_fat", "sugars", "fiber", "proteins", "salt"]:
            val = product.get(key)
            if val is not None:
                label = key.replace("_", " ").title()
                context_parts.append(f"{label}: {val}g per 100g")
        allergens = product.get("allergens", [])
        if allergens:
            context_parts.append(f"Allergens: {', '.join(allergens)}")

    return "\n".join(context_parts)
