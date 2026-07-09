"""pages/dashboard.py — Dashboard matching reference design."""
import streamlit as st
import plotly.graph_objects as go
from utils.food_api import get_demo_product
from utils.nutrition import classify_health

RECENT_SCANS = [
    {
        "name": "Organic Greek Yogurt Bowl",
        "label": "Healthy", "label_color": "#15803D", "label_bg": "#DCFCE7",
        "time": "2h ago", "kcal": 240,
        "tags": [("HIGH PROTEIN","green"), ("LOW SUGAR","green")],
        "emoji": "🥣",
    },
    {
        "name": "Oat & Almond Energy Bar",
        "label": "Moderate", "label_color": "#92400E", "label_bg": "#FEF3C7",
        "time": "5h ago", "kcal": 180,
        "tags": [("SUGAR ALERT","amber"), ("FIBER+","green")],
        "emoji": "🍫",
    },
    {
        "name": "Fresh Garden Salad",
        "label": "Healthy", "label_color": "#15803D", "label_bg": "#DCFCE7",
        "time": "Yesterday", "kcal": 120,
        "tags": [("VITAMINS","blue"), ("LOW CARB","green")],
        "emoji": "🥗",
    },
    {
        "name": "Glazed Pastry",
        "label": "Unhealthy", "label_color": "#B91C1C", "label_bg": "#FEE2E2",
        "time": "Yesterday", "kcal": 450,
        "tags": [("HIGH SUGAR","red"), ("PROCESSED","red")],
        "emoji": "🍩",
    },
]

TAG_COLORS = {
    "green": ("DCFCE7", "15803D"),
    "amber": ("FEF3C7", "92400E"),
    "red":   ("FEE2E2", "B91C1C"),
    "blue":  ("DBEAFE", "1D4ED8"),
}


def render():
    # Top bar
    col_title, col_search, col_user = st.columns([2, 4, 2])
    with col_search:
        q = st.text_input("", placeholder="🔍  Quick Scan or Search Food Item...",
                          label_visibility="collapsed", key="dash_search")
        if q:
            st.session_state["scan_query"] = q
            st.session_state["page"] = "My Scans"
            st.rerun()
    with col_user:
        st.markdown("""
        <div style="display:flex; align-items:center; justify-content:flex-end; gap:10px; padding-top:4px;">
            <span style="font-size:1.2rem; cursor:pointer;">🔔</span>
            <span style="background:#1B6B3A; color:#fff; border-radius:50%; width:32px; height:32px;
                         display:inline-flex; align-items:center; justify-content:center;
                         font-size:0.8rem; font-weight:700;">AJ</span>
            <span style="font-size:0.85rem; font-weight:500; color:#374151;">Alex Johnson</span>
        </div>
        """, unsafe_allow_html=True)

    # Page title
    st.markdown('<div class="page-title">Dashboard</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-sub">Welcome back, Alex. Your nutritional health is <b style="color:#1B6B3A;">12% better</b> this week.</div>',
                unsafe_allow_html=True)

    # ── Row 1: Weekly chart + Scan Categories ──
    col_chart, col_cats = st.columns([3, 2])

    with col_chart:
        st.markdown('<div class="nl-card">', unsafe_allow_html=True)
        col_h, col_pct = st.columns([3, 1])
        with col_h:
            st.markdown("""
            <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:1.05rem; color:#111827;">
                Weekly Nutritional Health
            </div>
            <div style="font-size:0.8rem; color:#9CA3AF; margin-top:2px;">Consistency score based on your scanned meals</div>
            """, unsafe_allow_html=True)
        with col_pct:
            st.markdown('<div style="font-family:Plus Jakarta Sans,sans-serif; font-size:1.6rem; font-weight:800; color:#1B6B3A; text-align:right;">84%</div>',
                        unsafe_allow_html=True)

        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        vals = [62, 71, 88, 74, 69, 55, 60]
        colors = ["#BBF7D0" if d != "Wed" else "#1B6B3A" for d in days]

        fig = go.Figure(go.Bar(
            x=days, y=vals, marker_color=colors,
            text=["" if d != "Wed" else "84%" for d in days],
            textposition="outside", textfont=dict(color="#1B6B3A", size=11, family="Inter"),
        ))
        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font_color="#9CA3AF", showlegend=False,
            yaxis=dict(showgrid=False, showticklabels=False, range=[0, 110]),
            xaxis=dict(showgrid=False, tickfont=dict(size=11)),
            margin=dict(t=30, b=5, l=0, r=0), height=190,
        )
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})
        st.markdown('</div>', unsafe_allow_html=True)

    with col_cats:
        st.markdown("""
        <div class="nl-card" style="height:100%;">
            <div style="font-weight:700; font-size:1rem; color:#111827; margin-bottom:1.2rem;">Scan Categories</div>

            <div style="margin-bottom:1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-size:0.85rem; color:#374151;">Full Meals</span>
                    <span style="font-size:0.85rem; font-weight:600; color:#111827;">62%</span>
                </div>
                <div style="background:#F3F4F6; border-radius:4px; height:8px;">
                    <div style="background:#1B6B3A; width:62%; height:100%; border-radius:4px;"></div>
                </div>
            </div>

            <div style="margin-bottom:1rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-size:0.85rem; color:#374151;">Snacks & Bars</span>
                    <span style="font-size:0.85rem; font-weight:600; color:#111827;">28%</span>
                </div>
                <div style="background:#F3F4F6; border-radius:4px; height:8px;">
                    <div style="background:#F59E0B; width:28%; height:100%; border-radius:4px;"></div>
                </div>
            </div>

            <div style="margin-bottom:1.2rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-size:0.85rem; color:#374151;">Beverages</span>
                    <span style="font-size:0.85rem; font-weight:600; color:#111827;">10%</span>
                </div>
                <div style="background:#F3F4F6; border-radius:4px; height:8px;">
                    <div style="background:#6B7280; width:10%; height:100%; border-radius:4px;"></div>
                </div>
            </div>

            <button onclick="" style="width:100%; padding:8px; border:1.5px solid #1B6B3A; border-radius:10px;
                    background:transparent; color:#1B6B3A; font-weight:600; font-size:0.83rem; cursor:pointer;">
                View Detailed Trends
            </button>
        </div>
        """, unsafe_allow_html=True)

    # ── Row 2: Recent Scans ──
    st.markdown("""
    <div style="display:flex; justify-content:space-between; align-items:center; margin:1.5rem 0 1rem 0;">
        <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:1.1rem; color:#111827;">Recent Scans</div>
        <span style="font-size:0.85rem; color:#1B6B3A; font-weight:600; cursor:pointer;">View All Scans →</span>
    </div>
    """, unsafe_allow_html=True)

    scan_cols = st.columns(4)
    for i, scan in enumerate(RECENT_SCANS):
        with scan_cols[i]:
            tag_html = ""
            for tag, tcol in scan["tags"]:
                bg, fg = TAG_COLORS.get(tcol, ("F3F4F6", "374151"))
                tag_html += f'<span style="background:#{bg}; color:#{fg}; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:20px; margin-right:3px;">{tag}</span>'

            st.markdown(f"""
            <div class="scan-card" style="margin-bottom:0.5rem;">
                <div style="background:#F9FAF9; height:140px; display:flex; align-items:center;
                            justify-content:center; position:relative; border-radius:16px 16px 0 0;">
                    <span style="font-size:4rem;">{scan['emoji']}</span>
                    <span style="position:absolute; top:10px; right:10px; background:{scan['label_bg']};
                                 color:{scan['label_color']}; font-size:0.72rem; font-weight:700;
                                 padding:3px 10px; border-radius:20px;">{scan['label']}</span>
                </div>
                <div style="padding:0.9rem 1rem;">
                    <div style="font-weight:600; font-size:0.88rem; color:#111827; margin-bottom:4px;">{scan['name']}</div>
                    <div style="font-size:0.75rem; color:#9CA3AF; margin-bottom:8px;">
                        🕐 {scan['time']} &nbsp;·&nbsp; 🔥 {scan['kcal']} kcal
                    </div>
                    <div>{tag_html}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("View Details", key=f"dash_scan_{i}", use_container_width=True):
                st.session_state["page"] = "My Scans"
                st.session_state["scan_query"] = scan["name"].split()[0]
                st.rerun()

    # ── Row 3: Pro Insight + Total Stats ──
    col_insight, col_stat = st.columns([2, 1])

    with col_insight:
        st.markdown("""
        <div class="nl-card" style="display:flex; align-items:flex-start; gap:1rem;">
            <div style="width:44px; height:44px; background:#F0FDF4; border-radius:50%;
                        display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <span style="font-size:1.3rem;">💡</span>
            </div>
            <div>
                <div style="font-weight:700; font-size:0.92rem; color:#111827; margin-bottom:4px;">Pro Insight</div>
                <div style="font-size:0.83rem; color:#6B7280; line-height:1.6;">
                    Switching your mid-afternoon snack to nuts instead of granola bars could reduce
                    your sugar intake by 15g daily.
                </div>
                <div style="margin-top:8px;">
                    <span style="font-size:0.8rem; font-weight:600; color:#1B6B3A; cursor:pointer;">
                        Learn more about sugar alternatives →
                    </span>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col_stat:
        st.markdown("""
        <div style="background:#0F2218; border-radius:16px; padding:1.25rem 1.5rem; color:#FFFFFF;">
            <div style="font-size:0.75rem; color:#6EE7B7; font-weight:500; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">
                TOTAL SCANS THIS MONTH
            </div>
            <div style="font-family:'Plus Jakarta Sans',sans-serif; font-size:2rem; font-weight:800; margin-bottom:12px;">
                142 Items
            </div>
            <div style="display:flex; gap:8px;">
                <div style="background:#1B6B3A; border-radius:8px; padding:6px 12px; text-align:center; flex:1;">
                    <div style="font-size:1rem; font-weight:700;">92%</div>
                    <div style="font-size:0.65rem; color:#6EE7B7;">Healthy</div>
                </div>
                <div style="background:#D97706; border-radius:8px; padding:6px 12px; text-align:center; flex:1;">
                    <div style="font-size:1rem; font-weight:700;">8%</div>
                    <div style="font-size:0.65rem; color:#FEF3C7;">Moderate</div>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        col_a, col_b = st.columns(2)
        with col_a:
            if st.button("📷 Scan New", use_container_width=True):
                st.session_state["page"] = "My Scans"
                st.rerun()
        with col_b:
            if st.button("💬 Ask AI", use_container_width=True):
                st.session_state["page"] = "Advisor Chat"
                st.rerun()
