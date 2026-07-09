"""pages/scans.py — My Scans: search, analyze, full report."""
import streamlit as st
import plotly.graph_objects as go
from utils.food_api import search_products, get_product_by_barcode, get_demo_product
from utils.nutrition import (
    classify_health, get_red_flags, get_positives, get_drv_percentages,
    detect_controversial_ingredients, get_nutri_score_color, get_nova_color,
    nutri_score_description, nova_description,
)
from ml.model import predict
from rag.ai_engine import generate_explanation


def render():
    col_title, col_btn = st.columns([4, 1])
    with col_title:
        st.markdown('<div class="page-title">My Scans</div>', unsafe_allow_html=True)
        st.markdown('<div class="page-sub">Search a food product by name or barcode for a full nutrition analysis.</div>',
                    unsafe_allow_html=True)

    # Search bar
    col_q, col_s = st.columns([5, 1])
    with col_q:
        default = st.session_state.get("scan_query", "")
        query = st.text_input("", placeholder="Search product name or enter barcode…",
                              value=default, label_visibility="collapsed", key="scan_input")
    with col_s:
        st.markdown('<div class="btn-primary">', unsafe_allow_html=True)
        search_hit = st.button("Search", use_container_width=True, key="scan_go")
        st.markdown('</div>', unsafe_allow_html=True)

    if search_hit and query:
        st.session_state["scan_query"] = query
        st.session_state.pop("selected_product", None)
        st.session_state.pop("ai_explanation", None)

    # Quick demo buttons
    st.markdown("<div style='margin: 0.5rem 0 1rem 0;'>", unsafe_allow_html=True)
    dcol1, dcol2, dcol3, dcol4 = st.columns(4)
    demos = [("🍫 Nutella","nutella"), ("🌾 Quaker Oats","oats"),
             ("🥔 Lay's Chips","lays"), ("🔍 Try any product","")]
    for i, (label, key) in enumerate(demos):
        with [dcol1, dcol2, dcol3, dcol4][i]:
            if st.button(label, key=f"demo_{key or 'any'}_{i}", use_container_width=True):
                if key:
                    demo = get_demo_product(key)
                    if demo:
                        st.session_state["selected_product"] = demo
                        st.session_state.pop("ai_explanation", None)
                        st.rerun()
    st.markdown("</div>", unsafe_allow_html=True)

    # Run search
    current_query = st.session_state.get("scan_query", "")
    if current_query and "selected_product" not in st.session_state:
        _do_search(current_query)

    # Show product
    if "selected_product" in st.session_state:
        _show_product(st.session_state["selected_product"])


def _do_search(query: str):
    demo = get_demo_product(query)
    with st.spinner(f"Searching for '{query}'…"):
        results = search_products(query, page_size=6)
    if demo:
        results = [demo] + [r for r in results if r.get("name", "").lower() != demo.get("name", "").lower()]
    results = results[:6]

    if not results:
        if query.isdigit() and len(query) >= 8:
            p = get_product_by_barcode(query)
            if p:
                st.session_state["selected_product"] = p
                st.rerun()
        st.markdown(f'<div class="warn-box">No products found for "<b>{query}</b>". Try another name or barcode.</div>',
                    unsafe_allow_html=True)
        return

    st.markdown(f"**{len(results)} results** — click a product to analyze")
    cols = st.columns(3)
    for i, p in enumerate(results):
        with cols[i % 3]:
            _result_card(p, i)


def _result_card(p: dict, idx: int):
    ns = p.get("nutri_score", "N/A")
    ns_color = get_nutri_score_color(ns)
    h = classify_health(p)

    st.markdown(f"""
    <div class="nl-card" style="margin-bottom:0.25rem; border-left:3px solid {h['color']};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:0.9rem; color:#111827; white-space:nowrap;
                            overflow:hidden; text-overflow:ellipsis;">{p.get('name','Unknown')[:40]}</div>
                <div style="font-size:0.77rem; color:#9CA3AF; margin-top:1px;">{p.get('brand','')[:30]}</div>
            </div>
            <span style="background:{ns_color}; color:#fff; font-weight:700;
                          padding:3px 10px; border-radius:20px; font-size:0.78rem; flex-shrink:0; margin-left:8px;">{ns}</span>
        </div>
        <div style="margin-top:6px; font-size:0.75rem; color:#6B7280;">
            {', '.join(p.get('categories',[])[:2]) or 'Food product'}
        </div>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Analyze →", key=f"sel_{idx}_{p.get('barcode','')}", use_container_width=True):
        st.session_state["selected_product"] = p
        st.session_state.pop("ai_explanation", None)
        st.rerun()


def _show_product(p: dict):
    st.markdown("---")

    # Back
    if st.button("← Back to results"):
        st.session_state.pop("selected_product", None)
        st.session_state.pop("ai_explanation", None)
        st.rerun()

    name  = p.get("name", "Unknown Product")
    brand = p.get("brand", "")
    h     = classify_health(p)
    ml    = predict(p)
    ns    = p.get("nutri_score", "N/A")
    nova  = p.get("nova_group")

    # ── Header ──
    col_info, col_verdict = st.columns([3, 2])
    with col_info:
        st.markdown(f"""
        <div style="font-family:'Plus Jakarta Sans',sans-serif; font-size:1.5rem;
                    font-weight:800; color:#111827; margin-bottom:2px;">{name}</div>
        <div style="font-size:0.88rem; color:#9CA3AF; margin-bottom:1rem;">{brand}</div>
        """, unsafe_allow_html=True)

        # NS + NOVA badges
        ns_cls = f"ns-{ns.replace('/','') if ns != 'N/A' else 'NA'}"
        nova_color = get_nova_color(nova)
        st.markdown(f"""
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
            <div style="text-align:center;">
                <div class="{ns_cls}" style="width:40px; height:40px; border-radius:8px;
                     display:flex; align-items:center; justify-content:center;
                     font-weight:800; font-size:1.1rem; margin-bottom:3px;">{ns}</div>
                <div style="font-size:0.68rem; color:#9CA3AF; font-weight:500;">Nutri-Score</div>
            </div>
            <div style="text-align:center;">
                <div style="width:40px; height:40px; border-radius:8px; background:{nova_color};
                     color:#fff; display:flex; align-items:center; justify-content:center;
                     font-weight:800; font-size:1.1rem; margin-bottom:3px;">{nova or '?'}</div>
                <div style="font-size:0.68rem; color:#9CA3AF; font-weight:500;">NOVA</div>
            </div>
            <div style="font-size:0.78rem; color:#6B7280; max-width:220px; line-height:1.5;">
                {nutri_score_description(ns)}<br>
                <span style="color:{nova_color};">{nova_description(nova)}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_verdict:
        verdict_cls = {"Healthy":"nl-card-green","Moderate":"nl-card-amber","Unhealthy":"nl-card-red"}.get(h["label"],"nl-card")
        st.markdown(f"""
        <div class="{verdict_cls}" style="border-radius:16px; padding:1.2rem; text-align:center;">
            <div style="font-size:2.5rem; margin-bottom:6px;">{h['emoji']}</div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif; font-size:1.3rem;
                        font-weight:800; color:{h['color']};">{h['label']}</div>
            <div style="font-size:0.78rem; color:#6B7280; margin-top:4px;">
                Score: {h['score']}/100
            </div>
            <div style="margin-top:10px; font-size:0.78rem; color:#374151;">
                ML: <b style="color:{ml['color']}">{ml['label'].title()}</b> &nbsp;·&nbsp;
                {ml['confidence']}% confidence
            </div>
            <div style="margin-top:8px;">
                {"".join([
                    f'<div style="display:flex; align-items:center; gap:6px; margin:4px 0;">'
                    f'<div style="flex:1; background:#F3F4F6; border-radius:3px; height:6px;">'
                    f'<div style="background:{c}; width:{pct:.0f}%; height:100%; border-radius:3px;"></div></div>'
                    f'<span style="font-size:0.7rem; color:{c}; width:60px;">{cat.title()} {pct:.0f}%</span>'
                    f'</div>'
                    for cat, pct, c in [
                        ("healthy", ml["probabilities"].get("healthy",0), "#22C55E"),
                        ("moderate", ml["probabilities"].get("moderate",0), "#F59E0B"),
                        ("unhealthy", ml["probabilities"].get("unhealthy",0), "#EF4444"),
                    ]
                ])}
            </div>
        </div>
        """, unsafe_allow_html=True)

    # ── Tabs ──
    tab1, tab2, tab3, tab4 = st.tabs(["📊 Nutrition Facts", "⚠️ Flags & Allergens", "🧪 Ingredients", "🤖 AI Analysis"])

    with tab1:
        c1, c2 = st.columns(2)
        with c1:
            _nutrition_table(p)
        with c2:
            _drv_chart(p)

    with tab2:
        flags = get_red_flags(p)
        positives = get_positives(p)
        ca, cb = st.columns(2)
        with ca:
            st.markdown("#### 🚨 Concerns")
            if flags:
                for f in flags:
                    cls = "danger-box" if f["level"]=="high" else "warn-box"
                    st.markdown(f'<div class="{cls}">{f["message"]}</div>', unsafe_allow_html=True)
            else:
                st.markdown('<div class="ok-box">No major concerns detected.</div>', unsafe_allow_html=True)
        with cb:
            st.markdown("#### ✅ Positives")
            if positives:
                for pos in positives:
                    st.markdown(f'<div class="ok-box">{pos["message"]}</div>', unsafe_allow_html=True)
            else:
                st.markdown('<div class="info-box">Limited positive nutritional factors noted.</div>', unsafe_allow_html=True)

        st.markdown("#### 🥜 Allergens")
        allergens = p.get("allergens", [])
        if allergens:
            chips = " ".join([f'<span class="badge badge-red">⚠ {a}</span>' for a in allergens])
            st.markdown(f'<div class="nl-card nl-card-red">{chips}</div>', unsafe_allow_html=True)
        else:
            st.markdown('<div class="ok-box">No major allergens detected in product data.</div>', unsafe_allow_html=True)

    with tab3:
        ing = p.get("ingredients_text","")
        if ing:
            st.markdown(f'<div class="nl-card"><div style="font-size:0.85rem; color:#6B7280; line-height:1.8;">{ing}</div></div>',
                        unsafe_allow_html=True)
        flags_ing = detect_controversial_ingredients(ing)
        if flags_ing:
            st.markdown("**⚠️ Flagged Ingredients**")
            for f in flags_ing:
                cls_map = {"danger":"danger-box","warn":"warn-box","info":"info-box"}
                st.markdown(f'<div class="{cls_map.get(f["severity"],"info-box")}"><b>{f["ingredient"]}</b> — {f["message"]}</div>',
                            unsafe_allow_html=True)
        elif ing:
            st.markdown('<div class="ok-box">No major concerning additives detected.</div>', unsafe_allow_html=True)

    with tab4:
        st.markdown("#### 🤖 AI Health Explanation")
        st.markdown('<div class="info-box">Powered by Google Gemini 2.0 Flash + RAG · Falls back to rule-based engine without an API key.</div>',
                    unsafe_allow_html=True)
        if "ai_explanation" not in st.session_state:
            with st.spinner("Generating AI explanation…"):
                st.session_state["ai_explanation"] = generate_explanation(p)
        st.markdown(f'<div class="nl-card nl-card-green"><div style="font-size:0.88rem; line-height:1.8; color:#374151;">{st.session_state["ai_explanation"]}</div></div>',
                    unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        with c1:
            if st.button("🔄 Regenerate"):
                st.session_state.pop("ai_explanation", None)
                st.rerun()
        with c2:
            if st.button("💬 Ask follow-up questions"):
                st.session_state["chat_product"] = p
                st.session_state["page"] = "Advisor Chat"
                st.rerun()

        # Find alternatives shortcut
        st.markdown("---")
        if st.button("↔️ Find Healthier Alternatives →", use_container_width=True):
            st.session_state["alt_product"] = p
            st.session_state["page"] = "Alternatives"
            st.rerun()


def _nutrition_table(p: dict):
    rows = [
        ("Energy", p.get("energy_kcal"), "kcal"),
        ("Total Fat", p.get("fat"), "g"),
        ("— Saturated Fat", p.get("saturated_fat"), "g"),
        ("Carbohydrates", p.get("carbohydrates"), "g"),
        ("— of which Sugars", p.get("sugars"), "g"),
        ("Dietary Fibre", p.get("fiber"), "g"),
        ("Protein", p.get("proteins"), "g"),
        ("Salt", p.get("salt"), "g"),
    ]
    HIGH = {"sugars":(22.5,"red"),"fat":(17.5,"amber"),"saturated_fat":(5,"red"),
            "salt":(1.5,"red"),"energy_kcal":(400,"amber")}
    KEY_MAP = {"Total Fat":"fat","— Saturated Fat":"saturated_fat",
               "— of which Sugars":"sugars","Salt":"salt","Energy":"energy_kcal"}

    rows_html = ""
    for label, val, unit in rows:
        if val is None: val_str, badge = "—", ""
        else:
            val_str = f"{val} {unit}"
            k = KEY_MAP.get(label)
            if k and k in HIGH:
                thresh, col = HIGH[k]
                if val > thresh:
                    badge = f'<span class="badge badge-{col}">HIGH</span>'
                elif label in ("Dietary Fibre","Protein") or (k not in HIGH):
                    badge = ""
                else:
                    badge = f'<span class="badge badge-gray">OK</span>'
            elif label in ("Dietary Fibre","Protein"):
                fv = val
                badge = f'<span class="badge badge-green">GOOD</span>' if fv >= (3 if label=="Dietary Fibre" else 5) else ""
            else:
                badge = ""

        is_sub = label.startswith("—")
        st.markdown(f"""
        <div style="display:flex; justify-content:space-between; align-items:center;
                    padding:8px 0; border-bottom:1px solid #F3F4F6;
                    {'padding-left:16px; color:#9CA3AF;' if is_sub else 'font-weight:500; color:#374151;'}
                    font-size:0.85rem;">
            <span>{label}</span>
            <span style="display:flex; align-items:center; gap:8px;">
                <span style="color:#111827;">{val_str}</span>
                {badge}
            </span>
        </div>
        """, unsafe_allow_html=True)

    st.markdown(f"""
    <div style="font-size:0.7rem; color:#9CA3AF; margin-top:8px; text-align:right;">per 100g</div>
    """, unsafe_allow_html=True)


def _drv_chart(p: dict):
    drv = get_drv_percentages(p)
    labels = {"energy_kcal":"Calories","fat":"Total Fat","saturated_fat":"Sat. Fat",
              "sugars":"Sugars","fiber":"Fibre","proteins":"Protein","salt":"Salt"}
    names, vals, colors = [], [], []
    for k, lbl in labels.items():
        if k in drv:
            pct = drv[k]
            names.append(lbl); vals.append(pct)
            if k in ["sugars","saturated_fat","salt"] and pct > 25:
                colors.append("#EF4444")
            elif k in ["sugars","saturated_fat","salt"] and pct > 12:
                colors.append("#F59E0B")
            elif k in ["fiber","proteins"]:
                colors.append("#1B6B3A")
            else:
                colors.append("#BBF7D0")

    fig = go.Figure(go.Bar(
        x=names, y=vals, marker_color=colors,
        text=[f"{v:.0f}%" for v in vals], textposition="outside",
        textfont=dict(size=10, color="#6B7280"),
    ))
    fig.update_layout(
        title=dict(text="% Daily Reference Value (per 100g)", font=dict(size=12, color="#6B7280")),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font_color="#9CA3AF",
        yaxis=dict(showgrid=True, gridcolor="#F3F4F6", showticklabels=False,
                   range=[0, max(vals)*1.3 if vals else 100]),
        xaxis=dict(showgrid=False, tickfont=dict(size=10)),
        margin=dict(t=40, b=5, l=0, r=0), height=280,
        showlegend=False,
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})
