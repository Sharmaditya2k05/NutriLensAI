"""pages/advisor_chat.py — Advisor Chat matching reference design image 4."""
import streamlit as st
import re
from rag.ai_engine import chat
from rag.knowledge_base import retrieve

SUGGESTIONS = [
    "Why is sodium bad?",
    "What does saturated fat mean?",
    "Healthier alternatives?",
    "Is this good for daily breakfast?",
    "What is a Nutri-Score?",
    "How much sugar per day is OK?",
]

WELCOME_MSG = (
    "Hello! I'm your NutriLens AI Nutrition Advisor. "
    "I can help you understand food labels, interpret nutrition data, "
    "and answer questions about your diet. "
    "What would you like to know?"
)


def render():
    # Two-column layout: left = product panel, right = chat
    col_left, col_right = st.columns([2, 3])

    with col_left:
        st.markdown('<div class="page-title" style="font-size:1.3rem;">Advisor Chat</div>',
                    unsafe_allow_html=True)

        # Product context panel
        product = st.session_state.get("chat_product")
        if product:
            _product_panel(product)
        else:
            _no_product_panel()

        # Suggestion chips
        st.markdown("**Quick questions:**")
        for i, q in enumerate(SUGGESTIONS[:3]):
            if st.button(q, key=f"sugg_{i}", use_container_width=True):
                _add_message(q, product)
                st.rerun()

    with col_right:
        _chat_panel(product)


def _product_panel(p: dict):
    from utils.nutrition import classify_health, get_red_flags

    h = classify_health(p)
    flags = get_red_flags(p)
    sugars = p.get("sugars") or 0
    kcal   = p.get("energy_kcal") or 0
    fiber  = p.get("fiber") or 0
    protein= p.get("proteins") or 0
    carbs  = p.get("carbohydrates") or 0

    sugar_flag = ""
    if sugars > 22.5:
        sugar_flag = f'<div style="position:absolute; top:10px; right:10px; background:#FEE2E2; color:#B91C1C; font-size:0.72rem; font-weight:700; padding:3px 10px; border-radius:20px;">⚠ High Sugar</div>'

    st.markdown(f"""
    <div class="nl-card" style="padding:0; overflow:hidden; position:relative;">
        {sugar_flag}
        <div style="background:#F9FAF9; height:160px; display:flex; align-items:center;
                    justify-content:center; border-radius:16px 16px 0 0; font-size:5rem;">🥣</div>
        <div style="padding:1rem;">
            <div style="font-weight:700; font-size:1rem; color:#111827;">{p.get('name','')[:30]}</div>
            <div style="font-size:0.78rem; color:#9CA3AF; margin-bottom:12px;">{p.get('brand','')[:25]}</div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                <div style="background:#F0FDF4; border-radius:10px; padding:8px; text-align:center;">
                    <div style="font-weight:700; font-size:1.1rem; color:#1B6B3A;">{sugars}g</div>
                    <div style="font-size:0.7rem; color:#6B7280;">Sugar / 100g</div>
                </div>
                <div style="background:#FFF7ED; border-radius:10px; padding:8px; text-align:center;">
                    <div style="font-weight:700; font-size:1.1rem; color:#D97706;">{kcal}</div>
                    <div style="font-size:0.7rem; color:#6B7280;">Calories</div>
                </div>
            </div>

            <div style="display:flex; justify-content:space-around; margin-bottom:12px;">
                {"".join([
                    f'<div style="text-align:center;">'
                    f'<div class="stat-circle" style="border-color:{color}; color:{color}; font-size:0.82rem;">'
                    f'{val}%<br><span style="font-size:0.55rem; font-weight:400;">{label}</span></div>'
                    f'</div>'
                    for val, label, color in [
                        (min(int((fiber/25)*100),99), "Fiber", "#1B6B3A"),
                        (min(int((protein/50)*100),99), "Protein", "#9CA3AF"),
                        (min(int((carbs/260)*100),99), "Carbs", "#EF4444" if carbs > 55 else "#F59E0B"),
                    ]
                ])}
            </div>
        </div>

        <div style="margin:0 1rem 1rem 1rem; background:#F0FDF4; border-radius:10px; padding:0.8rem;">
            <div style="font-size:0.72rem; color:#15803D; font-weight:700; margin-bottom:4px;">✨ Expert Summary</div>
            <div style="font-size:0.78rem; color:#374151; line-height:1.6;">
                This product is classified as <b>{h['label'].lower()}</b>.
                {"Ultra-processed formula — designed for palatability over nutrition." if p.get('nova_group')==4
                 else "Minimal processing — closer to its natural state."}
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.button("✕ Remove product context", use_container_width=True):
        st.session_state.pop("chat_product", None)
        st.rerun()


def _no_product_panel():
    st.markdown("""
    <div class="nl-card" style="text-align:center; padding:2rem 1rem;">
        <div style="font-size:3rem; margin-bottom:12px;">🥗</div>
        <div style="font-weight:600; color:#374151; margin-bottom:6px;">No product selected</div>
        <div style="font-size:0.82rem; color:#9CA3AF; line-height:1.6;">
            Analyse a product in <b>My Scans</b> first to get context-aware nutrition advice.
        </div>
    </div>
    """, unsafe_allow_html=True)
    if st.button("→ Go to My Scans", use_container_width=True):
        st.session_state["page"] = "My Scans"
        st.rerun()


def _chat_panel(product):
    st.markdown("""
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:1.1rem; color:#111827;">
            Nutrition Chat
        </div>
        <div style="font-size:0.8rem; color:#9CA3AF;">
            <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#2563EB;">Powered by Gemini AI</a>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Chat history display
    history = st.session_state.get("chat_history", [])

    # Welcome message if empty
    if not history:
        st.markdown(f"""
        <div style="background:#F9FAFB; border:1px solid #EAECF0; border-radius:12px;
                    padding:1rem 1.25rem; margin-bottom:1rem;">
            <div style="display:flex; align-items:flex-start; gap:10px;">
                <div style="width:36px; height:36px; background:#1B6B3A; border-radius:50%;
                             display:flex; align-items:center; justify-content:center;
                             color:#fff; font-size:1rem; flex-shrink:0;">🤖</div>
                <div style="font-size:0.87rem; color:#374151; line-height:1.6; padding-top:6px;">
                    {WELCOME_MSG}
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
    else:
        # Show history
        for turn in history:
            # User bubble
            st.markdown(f"""
            <div style="display:flex; justify-content:flex-end; margin-bottom:8px;">
                <div style="background:#1B6B3A; color:#FFFFFF; border-radius:18px 18px 4px 18px;
                            padding:10px 16px; font-size:0.87rem; line-height:1.55; max-width:75%;">
                    {turn["user"]}
                </div>
            </div>
            """, unsafe_allow_html=True)

            # AI bubble
            if turn.get("assistant"):
                ai_html = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', turn["assistant"])
                ai_html = ai_html.replace("\n\n", "<br><br>").replace("\n", "<br>")

                sources = turn.get("sources", [])
                citations_html = ""
                if sources:
                    citations_html = '<div style="margin-top:10px; padding-top:8px; border-top:1px solid #EAECF0;">'
                    citations_html += '<div style="font-size:0.68rem; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">CITATIONS</div>'
                    for src in sources[:2]:
                        citations_html += f'<span style="background:#F3F4F6; border:1px solid #E5E7EB; border-radius:20px; padding:2px 10px; font-size:0.72rem; color:#374151; margin-right:6px;">📄 {src["title"]}</span>'
                    citations_html += '</div>'

                st.markdown(f"""
                <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:8px;">
                    <div style="width:36px; height:36px; background:#1B6B3A; border-radius:50%;
                                 display:flex; align-items:center; justify-content:center;
                                 color:#fff; font-size:1rem; flex-shrink:0;">🤖</div>
                    <div style="background:#FFFFFF; border:1px solid #EAECF0; border-radius:4px 18px 18px 18px;
                                padding:12px 16px; font-size:0.87rem; color:#374151; line-height:1.65;
                                max-width:85%; box-shadow:0 1px 4px rgba(0,0,0,0.05);">
                        {ai_html}
                        {citations_html}
                    </div>
                </div>
                """, unsafe_allow_html=True)

    # Suggestion pills row (always visible)
    pills_html = "".join([
        f'<span class="suggestion-pill">{q}</span>' for q in SUGGESTIONS
    ])
    st.markdown(f'<div style="margin-bottom:1rem; line-height:2.2;">{pills_html}</div>',
                unsafe_allow_html=True)

    # Pill click via buttons (hidden but functional)
    pill_cols = st.columns(len(SUGGESTIONS))
    for i, q in enumerate(SUGGESTIONS):
        with pill_cols[i]:
            if st.button(q, key=f"pill_{i}", help=q,
                         use_container_width=True):
                _add_message(q, product)
                st.rerun()

    # Input area
    st.markdown("---")
    col_input, col_send = st.columns([6, 1])
    with col_input:
        user_msg = st.text_input(
            "", placeholder="Ask your nutrition advisor…",
            label_visibility="collapsed", key="chat_msg"
        )
    with col_send:
        st.markdown('<div class="btn-primary">', unsafe_allow_html=True)
        send = st.button("Send →", use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    if send and user_msg:
        _add_message(user_msg, product)
        st.rerun()

    # Disclaimer + clear
    col_d, col_c = st.columns([3, 1])
    with col_d:
        st.markdown("""
        <div style="font-size:0.72rem; color:#9CA3AF; text-align:center; margin-top:4px;">
            NutriLens AI may provide general nutritional info. Consult a professional for specific dietary needs.
        </div>
        """, unsafe_allow_html=True)
    with col_c:
        if history and st.button("🗑 Clear chat", use_container_width=True):
            st.session_state["chat_history"] = []
            st.rerun()


def _add_message(query: str, product):
    history = st.session_state.get("chat_history", [])
    sources = retrieve(query, top_k=2)
    with st.spinner("Thinking…"):
        response = chat(query, history, product)
    history.append({"user": query, "assistant": response, "sources": sources})
    st.session_state["chat_history"] = history
