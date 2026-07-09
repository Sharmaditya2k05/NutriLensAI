import streamlit as st
import os
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="NutriLens AI",
    page_icon="🥗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── Global CSS matching reference design ────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ── Reset & Base ── */
html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
    background-color: #F7F8FC;
    color: #1A1D23;
}
.main .block-container {
    padding: 1.5rem 2rem 3rem 2rem;
    max-width: 1200px;
}
#MainMenu, footer, header { visibility: hidden; }

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: #FFFFFF !important;
    border-right: 1px solid #EAECF0 !important;
    width: 220px !important;
}
[data-testid="stSidebar"] > div { padding: 0 !important; }

/* ── Buttons ── */
.stButton > button {
    background: #FFFFFF;
    color: #1B6B3A;
    border: 1.5px solid #1B6B3A;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    padding: 0.45rem 1.1rem;
    transition: all 0.18s;
    font-family: 'Inter', sans-serif;
}
.stButton > button:hover {
    background: #1B6B3A;
    color: #FFFFFF;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(27,107,58,0.18);
}

/* Primary button variant */
.btn-primary button {
    background: #1B6B3A !important;
    color: #FFFFFF !important;
    border: none !important;
    box-shadow: 0 2px 8px rgba(27,107,58,0.2);
}
.btn-primary button:hover {
    background: #155c30 !important;
}

/* ── Inputs ── */
.stTextInput > div > div > input {
    background: #FFFFFF !important;
    border: 1.5px solid #EAECF0 !important;
    border-radius: 12px !important;
    color: #1A1D23 !important;
    font-size: 0.9rem !important;
    padding: 0.6rem 1rem !important;
}
.stTextInput > div > div > input:focus {
    border-color: #1B6B3A !important;
    box-shadow: 0 0 0 3px rgba(27,107,58,0.08) !important;
}
.stTextInput > label { color: #6B7280 !important; font-size: 0.8rem !important; font-weight: 500 !important; }

/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"] {
    background: transparent;
    border-bottom: 2px solid #EAECF0;
    gap: 0;
}
.stTabs [data-baseweb="tab"] {
    color: #6B7280;
    font-weight: 500;
    font-size: 0.88rem;
    padding: 0.6rem 1.2rem;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
}
.stTabs [aria-selected="true"] {
    color: #1B6B3A !important;
    border-bottom: 2px solid #1B6B3A !important;
    background: transparent !important;
}
.stTabs [data-baseweb="tab-panel"] { padding-top: 1.5rem; }

/* ── Cards ── */
.nl-card {
    background: #FFFFFF;
    border: 1px solid #EAECF0;
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.nl-card-green {
    background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%);
    border: 1px solid #BBF7D0;
}
.nl-card-amber {
    background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%);
    border: 1px solid #FDE68A;
}
.nl-card-red {
    background: linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%);
    border: 1px solid #FECACA;
}
.nl-card-dark {
    background: #0F2218;
    border: none;
    color: #FFFFFF;
}

/* ── Badges / chips ── */
.badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 600;
    margin: 2px 3px 2px 0;
    letter-spacing: 0.3px;
}
.badge-green  { background: #DCFCE7; color: #15803D; }
.badge-amber  { background: #FEF3C7; color: #92400E; }
.badge-red    { background: #FEE2E2; color: #B91C1C; }
.badge-gray   { background: #F3F4F6; color: #4B5563; }
.badge-blue   { background: #DBEAFE; color: #1D4ED8; }

/* ── Verdict banner ── */
.verdict-healthy { background: #DCFCE7; border: 1.5px solid #86EFAC; border-radius: 12px; }
.verdict-moderate { background: #FEF3C7; border: 1.5px solid #FCD34D; border-radius: 12px; }
.verdict-unhealthy { background: #FEE2E2; border: 1.5px solid #FCA5A5; border-radius: 12px; }

/* ── Nutri-Score circles ── */
.ns-A { background:#1B6B3A; color:#fff; }
.ns-B { background:#74b816; color:#fff; }
.ns-C { background:#f59e0b; color:#fff; }
.ns-D { background:#f97316; color:#fff; }
.ns-E { background:#dc2626; color:#fff; }
.ns-NA { background:#9CA3AF; color:#fff; }

/* ── Expander ── */
.streamlit-expanderHeader {
    background: #FFFFFF !important;
    border: 1px solid #EAECF0 !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    color: #374151 !important;
}

/* ── Alert boxes ── */
.info-box  { background:#EFF6FF; border-left:3px solid #3B82F6; padding:.7rem 1rem; border-radius:0 8px 8px 0; font-size:.83rem; color:#1D4ED8; margin:.5rem 0; }
.warn-box  { background:#FFFBEB; border-left:3px solid #F59E0B; padding:.7rem 1rem; border-radius:0 8px 8px 0; font-size:.83rem; color:#92400E; margin:.5rem 0; }
.ok-box    { background:#F0FDF4; border-left:3px solid #22C55E; padding:.7rem 1rem; border-radius:0 8px 8px 0; font-size:.83rem; color:#15803D; margin:.5rem 0; }
.danger-box{ background:#FFF5F5; border-left:3px solid #EF4444; padding:.7rem 1rem; border-radius:0 8px 8px 0; font-size:.83rem; color:#B91C1C; margin:.5rem 0; }

/* ── Progress bars ── */
.stProgress > div > div { background: #1B6B3A; }

/* ── Divider ── */
hr { border-color: #EAECF0; }

/* ── Metric ── */
[data-testid="metric-container"] {
    background: #FFFFFF;
    border: 1px solid #EAECF0;
    border-radius: 12px;
    padding: 1rem;
}
[data-testid="metric-container"] label { color: #6B7280 !important; font-size: 0.78rem !important; }
[data-testid="metric-container"] [data-testid="stMetricValue"] { color: #1B6B3A !important; font-size: 1.5rem !important; font-weight: 700 !important; }

/* ── Page heading ── */
.page-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 1.75rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.15rem;
}
.page-sub {
    font-size: 0.88rem;
    color: #6B7280;
    margin-bottom: 1.5rem;
}

/* ── Scan result card ── */
.scan-card {
    background: #FFFFFF;
    border: 1px solid #EAECF0;
    border-radius: 16px;
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
    cursor: pointer;
}
.scan-card:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.09);
    transform: translateY(-2px);
}

/* ── Chat bubbles ── */
.chat-user {
    background: #1B6B3A;
    color: #FFFFFF;
    border-radius: 18px 18px 4px 18px;
    padding: 10px 16px;
    font-size: 0.88rem;
    line-height: 1.55;
    display: inline-block;
    max-width: 72%;
    float: right;
    clear: both;
    margin: 6px 0;
}
.chat-ai {
    background: #FFFFFF;
    border: 1px solid #EAECF0;
    color: #1A1D23;
    border-radius: 4px 18px 18px 18px;
    padding: 12px 16px;
    font-size: 0.88rem;
    line-height: 1.6;
    display: inline-block;
    max-width: 80%;
    float: left;
    clear: both;
    margin: 6px 0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.chat-wrap { overflow: hidden; margin-bottom: 4px; }

/* ── Alternative product card ── */
.alt-card {
    background: #FFFFFF;
    border: 1.5px solid #EAECF0;
    border-radius: 16px;
    padding: 1.25rem;
    position: relative;
    transition: all 0.2s;
    height: 100%;
}
.alt-card:hover {
    border-color: #1B6B3A;
    box-shadow: 0 4px 16px rgba(27,107,58,0.1);
    transform: translateY(-2px);
}
.alt-card-current {
    border: 2px solid #EF4444 !important;
    background: #FFF5F5 !important;
}
.tag-current { background:#EF4444; color:#fff; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; }
.tag-smart   { background:#1B6B3A; color:#fff; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; }
.tag-direct  { background:#2563EB; color:#fff; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; }
.tag-value   { background:#D97706; color:#fff; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:0.5px; }

/* ── Health impact banner ── */
.impact-banner {
    background: linear-gradient(135deg, #1B6B3A 0%, #15803D 100%);
    border-radius: 16px;
    padding: 1.5rem 2rem;
    color: #FFFFFF;
}
.impact-stat {
    background: rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 0.8rem 1.2rem;
    text-align: center;
    display: inline-block;
    min-width: 90px;
}

/* ── Scrollable chat area ── */
.chat-scroll {
    max-height: 420px;
    overflow-y: auto;
    padding: 1rem 0.5rem;
    border: 1px solid #EAECF0;
    border-radius: 12px;
    background: #FAFAFA;
    margin-bottom: 1rem;
}

/* ── Suggestion pills ── */
.suggestion-pill {
    display: inline-block;
    background: #FFFFFF;
    border: 1px solid #D1D5DB;
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 0.8rem;
    color: #374151;
    cursor: pointer;
    margin: 3px;
    transition: all 0.15s;
}
.suggestion-pill:hover {
    border-color: #1B6B3A;
    color: #1B6B3A;
    background: #F0FDF4;
}

/* Stat circle */
.stat-circle {
    width: 64px; height: 64px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
    font-weight: 700;
    font-size: 0.95rem;
    border: 3px solid;
    margin: 0 auto;
}
</style>
""", unsafe_allow_html=True)

# ── Session state defaults ──────────────────────────────────────────────────
if "page" not in st.session_state:
    st.session_state["page"] = "Dashboard"
if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []

# ── Sidebar ─────────────────────────────────────────────────────────────────
with st.sidebar:
    # Logo
    st.markdown("""
    <div style="padding:1.5rem 1.25rem 0.5rem 1.25rem;">
        <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1.1rem; color:#1B6B3A; line-height:1.1;">
            NutriLens<br><span style="color:#1B6B3A;">AI</span>
        </div>
        <div style="font-size:0.7rem; color:#9CA3AF; margin-top:2px;">Expert Food Analysis</div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<div style='height:1rem'></div>", unsafe_allow_html=True)

    # Nav items
    nav_items = [
        ("Dashboard",    "📊"),
        ("My Scans",     "🔍"),
        ("Alternatives", "↔️"),
        ("Advisor Chat", "💬"),
        ("Health Insights","📈"),
        ("About & ML",   "⚙️"),
    ]

    for label, icon in nav_items:
        active = st.session_state["page"] == label
        bg    = "#F0FDF4" if active else "transparent"
        color = "#1B6B3A" if active else "#6B7280"
        fw    = "700" if active else "400"
        border= "border-left:3px solid #1B6B3A;" if active else "border-left:3px solid transparent;"

        st.markdown(f"""
        <div style="padding:0.55rem 1.25rem; margin:1px 0; background:{bg};
                    {border} cursor:pointer; border-radius:0 8px 8px 0;">
            <span style="color:{color}; font-weight:{fw}; font-size:0.88rem;">
                {icon}&nbsp;&nbsp;{label}
            </span>
        </div>
        """, unsafe_allow_html=True)
        if st.button(label, key=f"nav_{label}", use_container_width=True,
                     help=label):
            st.session_state["page"] = label
            st.rerun()

    # Gemini key status
    st.markdown("<div style='height:1rem'></div>", unsafe_allow_html=True)
    st.markdown("<hr style='margin:0 1.25rem; border-color:#EAECF0;'>", unsafe_allow_html=True)
    _key = os.getenv("GEMINI_API_KEY", "")
    if _key and _key != "your_gemini_api_key_here":
        st.markdown("""<div style="padding:.75rem 1.25rem; font-size:0.72rem; color:#15803D;">
            ✅ Gemini AI connected</div>""", unsafe_allow_html=True)
    else:
        st.markdown("""<div style="padding:.75rem 1.25rem; font-size:0.72rem; color:#D97706;">
            ⚠ Add Gemini key to .env<br>
            <a href="https://aistudio.google.com/apikey" target="_blank"
               style="color:#2563EB;">Get free key →</a></div>""", unsafe_allow_html=True)

    st.markdown("""
    <div style="padding:0 1.25rem 1.5rem; font-size:0.68rem; color:#9CA3AF; line-height:1.6;">
        ⚙️ Settings<br>❓ Help
    </div>
    """, unsafe_allow_html=True)

# ── Route ───────────────────────────────────────────────────────────────────
from pages import dashboard, scans, alternatives, advisor_chat, insights, about

page = st.session_state["page"]
if page == "Dashboard":      dashboard.render()
elif page == "My Scans":     scans.render()
elif page == "Alternatives": alternatives.render()
elif page == "Advisor Chat": advisor_chat.render()
elif page == "Health Insights": insights.render()
elif page == "About & ML":   about.render()
