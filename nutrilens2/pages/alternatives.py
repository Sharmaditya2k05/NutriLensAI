"""pages/alternatives.py — Alternative Recommender matching reference design."""
import streamlit as st
from utils.food_api import search_products, get_demo_product
from utils.nutrition import classify_health, get_red_flags, get_nutri_score_color
from rag.ai_engine import generate_alternatives_suggestion

# Curated alternatives database
ALTERNATIVES_DB = {
    "nutella": [
        {
            "name": "Artisana Almond",
            "brand": "Organic · 400g",
            "tag": "SMART CHOICE", "tag_cls": "tag-smart",
            "nutri_score": "A", "avg_price": "$12.99",
            "sugars": 4.2, "emoji": "🥜",
            "reasons": ["92% less sugar", "High in healthy fats", "Single ingredient"],
        },
        {
            "name": "Rigoni di Asiago",
            "brand": "Nocciolata · 350g",
            "tag": "DIRECT REPLACEMENT", "tag_cls": "tag-direct",
            "nutri_score": "C", "avg_price": "$7.99",
            "sugars": 21.0, "emoji": "🍯",
            "reasons": ["No palm oil", "60% less added sugar", "Organic ingredients"],
        },
        {
            "name": "Natural PB",
            "brand": "Kirkland · 1kg",
            "tag": "BEST VALUE", "tag_cls": "tag-value",
            "nutri_score": "A", "avg_price": "$4.50",
            "sugars": 2.0, "emoji": "🥜",
            "reasons": ["Highest protein (25g)", "Most cost effective", "Zero added sugar"],
        },
    ],
    "lays": [
        {
            "name": "Baked Lentil Crisps",
            "brand": "Hippeas · 100g",
            "tag": "SMART CHOICE", "tag_cls": "tag-smart",
            "nutri_score": "B", "avg_price": "$3.99",
            "sugars": 1.5, "emoji": "🌿",
            "reasons": ["60% less fat", "High protein", "Plant-based"],
        },
        {
            "name": "Rice Cakes Plain",
            "brand": "Quaker · 130g",
            "tag": "DIRECT REPLACEMENT", "tag_cls": "tag-direct",
            "nutri_score": "B", "avg_price": "$2.49",
            "sugars": 0.5, "emoji": "🍚",
            "reasons": ["75% less sodium", "Whole grain", "Low calorie"],
        },
        {
            "name": "Roasted Almonds",
            "brand": "Blue Diamond · 200g",
            "tag": "BEST VALUE", "tag_cls": "tag-value",
            "nutri_score": "A", "avg_price": "$5.99",
            "sugars": 4.0, "emoji": "🥜",
            "reasons": ["Heart healthy fats", "High protein + fibre", "Minimal processing"],
        },
    ],
    "oats": [
        {
            "name": "Bob's Red Mill",
            "brand": "Whole Grain Oats · 900g",
            "tag": "SMART CHOICE", "tag_cls": "tag-smart",
            "nutri_score": "A", "avg_price": "$7.99",
            "sugars": 0.6, "emoji": "🌾",
            "reasons": ["Slightly higher fibre", "Steel-cut for lower GI", "No additives"],
        },
        {
            "name": "Purely Elizabeth",
            "brand": "Probiotic Oats · 312g",
            "tag": "DIRECT REPLACEMENT", "tag_cls": "tag-direct",
            "nutri_score": "A", "avg_price": "$8.99",
            "sugars": 2.0, "emoji": "🌱",
            "reasons": ["Added probiotics", "Prebiotic fibre", "Organic certified"],
        },
        {
            "name": "Muesli Unsweetened",
            "brand": "Bob's Red Mill · 680g",
            "tag": "BEST VALUE", "tag_cls": "tag-value",
            "nutri_score": "A", "avg_price": "$6.49",
            "sugars": 1.5, "emoji": "🥣",
            "reasons": ["More variety of grains", "Nuts and seeds included", "Lower GI"],
        },
    ],
}

HEALTH_IMPACTS = {
    "nutella": {
        "sugar_change": "-92%", "sugar_label": "Sugar",
        "protein_change": "+12g", "protein_label": "Protein",
        "summary": "By switching from Nutella to Almond Butter daily, you could reduce your sugar intake by nearly 4kg per year. That's equivalent to 16,000 calories saved.",
        "tip": "Try adding a few drops of liquid stevia and a pinch of salt to pure almond butter to mimic the sweetness of Nutella without the insulin spike.",
    },
    "lays": {
        "sugar_change": "-75%", "sugar_label": "Sodium",
        "protein_change": "+8g", "protein_label": "Protein",
        "summary": "Switching from Lay's to lentil crisps daily could reduce your sodium intake by 0.9g per day — roughly 330g per year below the WHO recommended limit.",
        "tip": "Season air-popped popcorn with nutritional yeast and herbs for a similarly satisfying crunchy snack with a fraction of the sodium.",
    },
    "oats": {
        "sugar_change": "+2g", "sugar_label": "Fibre",
        "protein_change": "+3g", "protein_label": "Protein",
        "summary": "Upgrading to steel-cut oats gives a lower glycemic index, meaning slower energy release and better satiety — keeping you fuller for longer.",
        "tip": "Soak oats overnight in the fridge to reduce cooking time and further lower the glycemic index.",
    },
}


def render():
    col_h, col_info = st.columns([3, 1])
    with col_h:
        st.markdown('<div class="page-title">Alternative Recommender</div>', unsafe_allow_html=True)
        st.markdown('<div class="page-sub">Compare your scanned product with healthier, expert-vetted alternatives to optimise your daily nutrition.</div>',
                    unsafe_allow_html=True)

    # Product selection
    selected_key = None
    product = st.session_state.get("alt_product")

    if product:
        name_lower = product.get("name", "").lower()
        for k in ALTERNATIVES_DB:
            if k in name_lower:
                selected_key = k
                break
        if not selected_key:
            selected_key = "nutella"  # fallback
    else:
        # Let user pick
        st.markdown("**Choose a product to find alternatives for:**")
        dcol1, dcol2, dcol3 = st.columns(3)
        with dcol1:
            if st.button("🍫 Nutella", use_container_width=True):
                st.session_state["alt_product"] = get_demo_product("nutella")
                st.rerun()
        with dcol2:
            if st.button("🥔 Lay's Chips", use_container_width=True):
                st.session_state["alt_product"] = get_demo_product("lays")
                st.rerun()
        with dcol3:
            if st.button("🌾 Quaker Oats", use_container_width=True):
                st.session_state["alt_product"] = get_demo_product("oats")
                st.rerun()

        st.markdown('<div class="info-box">→ Or analyze a product in <b>My Scans</b> and click "Find Healthier Alternatives".</div>',
                    unsafe_allow_html=True)
        return

    product = product or get_demo_product(selected_key or "nutella")
    selected_key = selected_key or "nutella"
    alternatives = ALTERNATIVES_DB.get(selected_key, ALTERNATIVES_DB["nutella"])
    impact = HEALTH_IMPACTS.get(selected_key, HEALTH_IMPACTS["nutella"])

    # Info bar
    with col_info:
        st.markdown(f"""
        <div class="nl-card" style="padding:0.6rem 1rem; text-align:center;">
            <div style="font-size:0.72rem; color:#9CA3AF;">ℹ️ {len(alternatives)} Alternatives found for</div>
            <div style="font-weight:700; color:#111827; font-size:0.88rem;">{product.get('name','')}</div>
        </div>
        """, unsafe_allow_html=True)

    # ── Product cards row ──
    all_cols = st.columns(4)

    # Current product card
    p = product
    h = classify_health(p)
    flags = get_red_flags(p)
    flag_tags = " ".join([f'<span class="badge badge-red">{f["nutrient"].upper()}</span>'
                          for f in flags[:2] if f["level"]=="high"])
    ns = p.get("nutri_score", "N/A")
    ns_color = get_nutri_score_color(ns)

    with all_cols[0]:
        st.markdown(f"""
        <div class="alt-card alt-card-current">
            <div style="position:absolute; top:12px; left:12px;">
                <span class="tag-current">CURRENT SCAN</span>
            </div>
            <div style="text-align:center; padding:1.5rem 0 0.8rem 0; font-size:3.5rem;">🍫</div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1.05rem; color:#111827; margin-bottom:2px;">
                {p.get('name','')[:20]}
            </div>
            <div style="font-size:0.75rem; color:#9CA3AF; margin-bottom:12px;">
                {p.get('brand','')[:25]}
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #F3F4F6; font-size:0.82rem;">
                <span style="color:#6B7280;">Nutri-Score</span>
                <span style="background:{ns_color}; color:#fff; font-weight:700; padding:1px 10px; border-radius:4px;">{ns}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #F3F4F6; font-size:0.82rem;">
                <span style="color:#6B7280;">Sugar (per 100g)</span>
                <span style="color:#EF4444; font-weight:700;">{p.get('sugars','?')}g</span>
            </div>
            <div style="margin-top:10px; font-size:0.72rem; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Identified Risks:</div>
            <div style="margin-top:4px;">{flag_tags}</div>
        </div>
        """, unsafe_allow_html=True)

    # Alternative cards
    tag_emoji = {"SMART CHOICE":"✨","DIRECT REPLACEMENT":"🔄","BEST VALUE":"💰"}
    ns_colors_local = {"A":"#1B6B3A","B":"#74b816","C":"#f59e0b","D":"#f97316","E":"#dc2626"}

    for i, alt in enumerate(alternatives):
        with all_cols[i+1]:
            ns_c = ns_colors_local.get(alt["nutri_score"], "#9CA3AF")
            reasons_html = "".join([
                f'<div style="font-size:0.78rem; color:#15803D; margin-bottom:3px;">✓ {r}</div>'
                for r in alt["reasons"]
            ])
            st.markdown(f"""
            <div class="alt-card">
                <div style="position:absolute; top:12px; left:12px;">
                    <span class="{alt['tag_cls']}">{tag_emoji.get(alt['tag'],'')} {alt['tag']}</span>
                </div>
                <div style="text-align:center; padding:1.5rem 0 0.8rem 0; font-size:3.5rem;">{alt['emoji']}</div>
                <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1.05rem; color:#111827; margin-bottom:2px;">
                    {alt['name']}
                </div>
                <div style="font-size:0.75rem; color:#9CA3AF; margin-bottom:12px;">{alt['brand']}</div>
                <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #F3F4F6; font-size:0.82rem;">
                    <span style="color:#6B7280;">Nutri-Score</span>
                    <span style="background:{ns_c}; color:#fff; font-weight:700; padding:1px 10px; border-radius:4px;">{alt['nutri_score']}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #F3F4F6; font-size:0.82rem;">
                    <span style="color:#6B7280;">Avg Price</span>
                    <span style="color:#111827; font-weight:600;">{alt['avg_price']}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #F3F4F6; font-size:0.82rem;">
                    <span style="color:#6B7280;">Sugar (per 100g)</span>
                    <span style="color:#15803D; font-weight:700;">{alt['sugars']}g</span>
                </div>
                <div style="margin-top:10px; font-size:0.72rem; color:#6B7280; font-weight:600; margin-bottom:6px;">Why it's better:</div>
                {reasons_html}
            </div>
            """, unsafe_allow_html=True)
            st.markdown("<div style='height:6px'></div>", unsafe_allow_html=True)
            if st.button("Select Alternative", key=f"alt_select_{i}", use_container_width=True):
                st.success(f"✓ Great choice! {alt['name']} added to your watchlist.")

    # ── Health Impact Banner ──
    st.markdown("<div style='height:1rem'></div>", unsafe_allow_html=True)
    col_impact, col_tip = st.columns([3, 2])

    with col_impact:
        st.markdown(f"""
        <div class="impact-banner">
            <div style="font-family:'Plus Jakarta Sans',sans-serif; font-size:1.2rem; font-weight:800; margin-bottom:8px;">
                Health Impact of Swapping
            </div>
            <div style="font-size:0.85rem; color:rgba(255,255,255,0.85); line-height:1.6; margin-bottom:1.2rem;">
                {impact['summary']}
            </div>
            <div style="display:flex; gap:12px;">
                <div class="impact-stat">
                    <div style="font-size:1.4rem; font-weight:800;">{impact['sugar_change']}</div>
                    <div style="font-size:0.72rem; color:rgba(255,255,255,0.7);">{impact['sugar_label']}</div>
                </div>
                <div class="impact-stat">
                    <div style="font-size:1.4rem; font-weight:800;">{impact['protein_change']}</div>
                    <div style="font-size:0.72rem; color:rgba(255,255,255,0.7);">{impact['protein_label']}</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_tip:
        st.markdown(f"""
        <div class="nl-card" style="height:100%;">
            <div style="font-size:1.5rem; margin-bottom:8px; color:#1B6B3A;">💡</div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:1rem; color:#111827; margin-bottom:10px;">
                Advisor Tip
            </div>
            <div style="font-size:0.85rem; color:#6B7280; line-height:1.7; font-style:italic;">
                "{impact['tip']}"
            </div>
            <div style="margin-top:12px;">
                <span style="font-size:0.82rem; font-weight:600; color:#1B6B3A; cursor:pointer;">Read full guide →</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    # AI-generated alternatives text
    with st.expander("🤖 AI Alternative Analysis", expanded=False):
        if "alt_ai_text" not in st.session_state:
            with st.spinner("Generating AI alternatives analysis…"):
                cat = product.get("categories", ["food"])[0] if product.get("categories") else "food"
                st.session_state["alt_ai_text"] = generate_alternatives_suggestion(product, cat)
        st.markdown(f'<div class="nl-card nl-card-green"><div style="font-size:0.88rem; line-height:1.8;">{st.session_state["alt_ai_text"]}</div></div>',
                    unsafe_allow_html=True)

    # Reset
    st.markdown("<div style='height:0.5rem'></div>", unsafe_allow_html=True)
    if st.button("← Analyse a different product"):
        st.session_state.pop("alt_product", None)
        st.session_state.pop("alt_ai_text", None)
        st.rerun()
