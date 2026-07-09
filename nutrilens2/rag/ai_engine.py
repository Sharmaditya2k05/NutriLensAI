"""
rag/ai_engine.py
GenAI explanation and chat using Google Gemini (free tier).
Falls back to rule-based explanations when no API key is set.

Get a free Gemini API key at: https://aistudio.google.com/apikey
"""

import os
from typing import Optional
from rag.knowledge_base import build_context, retrieve

try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


SYSTEM_PROMPT = """You are NutriLens AI, a friendly and knowledgeable nutrition assistant.
You analyze food product labels and help users understand their nutritional content.

Guidelines:
- Explain things clearly in simple language. Avoid jargon.
- Be honest about health concerns without being alarmist.
- Always clarify this is for educational purposes, not medical advice.
- Keep responses concise but informative (3-5 sentences unless more is needed).
- Use the provided nutrition knowledge and product data to ground your answers.
- Be conversational and helpful.
- If product data is available, reference specific numbers when relevant.
- Give practical, actionable advice.
"""


def _call_gemini(prompt: str) -> Optional[str]:
    """Call Gemini API with a single prompt string."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or not GEMINI_AVAILABLE:
        return None
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=600,
                temperature=0.4,
            ),
        )
        return response.text
    except Exception as e:
        print(f"[Gemini error] {e}")
        return None


def _call_gemini_chat(messages: list, context: str) -> Optional[str]:
    """Call Gemini with multi-turn conversation history."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or not GEMINI_AVAILABLE:
        return None
    try:
        client = genai.Client(api_key=api_key)

        # Build a single prompt incorporating history + context
        history_text = ""
        for turn in messages[:-1]:  # all but last
            if turn["role"] == "user":
                history_text += f"\nUser: {turn['content']}"
            else:
                history_text += f"\nAssistant: {turn['content']}"

        last_user = messages[-1]["content"] if messages else ""

        full_prompt = f"""Context and knowledge base:
{context}

Conversation so far:{history_text if history_text else ' (new conversation)'}

User: {last_user}

Respond as NutriLens AI:"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=600,
                temperature=0.5,
            ),
        )
        return response.text
    except Exception as e:
        print(f"[Gemini chat error] {e}")
        return None


# ── Rule-based fallbacks ───────────────────────────────────────────────────

def _rule_based_explanation(product: dict) -> str:
    from utils.nutrition import classify_health, get_red_flags, get_positives

    health = classify_health(product)
    flags = get_red_flags(product)
    positives = get_positives(product)
    name = product.get("name", "This product")
    ns = product.get("nutri_score", "N/A")

    parts = [f"**{name}** receives a **{health['label']}** classification."]

    if ns not in ("N/A", ""):
        parts.append(f"Its Nutri-Score is **{ns}** — {_ns_desc(ns)}.")

    high_flags = [f["nutrient"] for f in flags if f["level"] == "high"]
    if high_flags:
        parts.append(f"Main concerns: high {', '.join(high_flags).lower()}.")

    if positives:
        pos_names = [p["nutrient"] for p in positives]
        parts.append(f"On the positive side, it provides good amounts of {', '.join(pos_names).lower()}.")

    nova = product.get("nova_group")
    if nova == 4:
        parts.append("It is an ultra-processed food (NOVA 4) — best consumed occasionally rather than daily.")

    parts.append("*For personalised dietary advice, consult a qualified nutritionist or healthcare professional.*")
    return " ".join(parts)


def _rule_based_alternatives(product: dict, category: str) -> str:
    from utils.nutrition import get_red_flags
    flags = [f["nutrient"] for f in get_red_flags(product) if f["level"] == "high"]
    if flags:
        return (
            f"Look for alternatives with lower {', '.join(f.lower() for f in flags)}. "
            "Compare products in the same category using their Nutri-Score — aim for A or B. "
            "Prioritise whole, minimally processed options (NOVA 1 or 2) where possible."
        )
    return (
        "Compare similar products by checking their Nutri-Score and NOVA group. "
        "Whole food alternatives are generally the best choice."
    )


def _rule_based_chat(query: str, product: Optional[dict]) -> str:
    docs = retrieve(query, top_k=2)
    if docs:
        doc = docs[0]
        paragraphs = [p.strip() for p in doc["content"].strip().split("\n\n") if p.strip()]
        answer = paragraphs[0] if paragraphs else doc["content"][:300]
        return (
            f"**{doc['title']}**\n\n{answer}\n\n"
            "*Add your free Gemini API key to `.env` for full AI answers. "
            "Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).*"
        )
    return (
        "I don't have specific information on that in my knowledge base. "
        "Try asking about sugar, sodium, fat, fibre, allergens, Nutri-Score, or NOVA groups."
    )


# ── Public API ─────────────────────────────────────────────────────────────

def generate_explanation(product: dict) -> str:
    """Generate a human-readable health explanation for a product."""
    context = build_context(
        f"analyze nutrition label health assessment for {product.get('name', 'food product')}",
        product,
    )
    prompt = (
        f"{context}\n\n"
        "Please analyse this food product and explain in simple language: "
        "is it healthy? What are the main concerns and positives? "
        "Keep it to 4-6 sentences."
    )
    result = _call_gemini(prompt)
    return result or _rule_based_explanation(product)


def generate_alternatives_suggestion(product: dict, category: str) -> str:
    """Generate suggestion text for better product alternatives."""
    from utils.nutrition import get_red_flags
    flags = [f["nutrient"] for f in get_red_flags(product) if f["level"] == "high"]

    context = build_context(f"healthy alternatives for {category}", product)
    prompt = (
        f"{context}\n\n"
        f"What healthier alternatives should someone look for instead of this product? "
        f"The main concerns are: {', '.join(flags) or 'general nutrition'}. "
        "Give 2-3 specific, practical suggestions in 3-5 sentences."
    )
    result = _call_gemini(prompt)
    return result or _rule_based_alternatives(product, category)


def chat(query: str, history: list, product: Optional[dict] = None) -> str:
    """Main chat function. Accepts conversation history + optional product context."""
    context = build_context(query, product)

    # Build message list
    messages = []
    for turn in history[-6:]:
        messages.append({"role": "user", "content": turn["user"]})
        if turn.get("assistant"):
            messages.append({"role": "assistant", "content": turn["assistant"]})
    messages.append({"role": "user", "content": query})

    result = _call_gemini_chat(messages, context)
    return result or _rule_based_chat(query, product)


def _ns_desc(ns: str) -> str:
    return {
        "A": "excellent nutritional quality",
        "B": "good nutritional quality",
        "C": "average nutritional quality",
        "D": "poor nutritional quality",
        "E": "very poor nutritional quality",
    }.get(ns, "nutritional quality unknown")
