"""pages/insights.py — Health Insights dashboard with charts."""
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px


def render():
    st.markdown('<div class="page-title">Health Insights</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-sub">Visual breakdown of your nutritional patterns over time.</div>',
                unsafe_allow_html=True)

    # ── Row 1: KPI cards ──
    k1, k2, k3, k4 = st.columns(4)
    kpis = [
        ("🥗", "Avg Daily Fibre", "18g", "+3g this week", "#1B6B3A"),
        ("🍬", "Avg Daily Sugar", "42g", "-8g vs last week", "#F59E0B"),
        ("🧂", "Avg Daily Salt", "3.2g", "Above WHO limit", "#EF4444"),
        ("💪", "Avg Protein", "68g", "On target", "#3B82F6"),
    ]
    for col, (icon, label, val, delta, color) in zip([k1,k2,k3,k4], kpis):
        with col:
            st.markdown(f"""
            <div class="nl-card" style="text-align:center;">
                <div style="font-size:1.5rem; margin-bottom:6px;">{icon}</div>
                <div style="font-size:0.75rem; color:#9CA3AF; font-weight:500;">{label}</div>
                <div style="font-family:'Plus Jakarta Sans',sans-serif; font-size:1.6rem;
                            font-weight:800; color:{color}; margin:4px 0;">{val}</div>
                <div style="font-size:0.72rem; color:#6B7280;">{delta}</div>
            </div>
            """, unsafe_allow_html=True)

    # ── Row 2: Trend chart + Category donut ──
    col_trend, col_donut = st.columns([3, 2])

    with col_trend:
        st.markdown('<div class="nl-card">', unsafe_allow_html=True)
        st.markdown("**Weekly Nutrition Trend**")
        days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
        sugar = [38,45,30,52,41,68,42]
        fibre = [22,18,25,16,20,12,19]
        protein = [65,70,72,60,68,55,63]

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=days, y=sugar, name="Sugar (g)", line=dict(color="#EF4444", width=2.5), mode="lines+markers", marker=dict(size=6)))
        fig.add_trace(go.Scatter(x=days, y=fibre, name="Fibre (g)", line=dict(color="#1B6B3A", width=2.5), mode="lines+markers", marker=dict(size=6)))
        fig.add_trace(go.Scatter(x=days, y=protein, name="Protein (g)", line=dict(color="#3B82F6", width=2.5), mode="lines+markers", marker=dict(size=6)))

        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font_color="#9CA3AF", height=240,
            yaxis=dict(gridcolor="#F3F4F6", tickfont=dict(size=10)),
            xaxis=dict(showgrid=False),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1,
                        font=dict(size=10)),
            margin=dict(t=30,b=10,l=0,r=0),
        )
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})
        st.markdown('</div>', unsafe_allow_html=True)

    with col_donut:
        st.markdown('<div class="nl-card">', unsafe_allow_html=True)
        st.markdown("**Scan Health Distribution**")

        fig2 = go.Figure(go.Pie(
            labels=["Healthy","Moderate","Unhealthy"],
            values=[78, 14, 8],
            hole=0.6,
            marker=dict(colors=["#1B6B3A","#F59E0B","#EF4444"]),
            textinfo="label+percent",
            textfont=dict(size=11),
        ))
        fig2.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            font_color="#374151", height=200,
            margin=dict(t=10,b=10,l=10,r=10),
            showlegend=False,
        )
        fig2.add_annotation(text="142<br><span style='font-size:0.7em'>Scans</span>",
                            x=0.5, y=0.5, showarrow=False, font=dict(size=18, color="#111827"))
        st.plotly_chart(fig2, use_container_width=True, config={"displayModeBar": False})
        st.markdown('</div>', unsafe_allow_html=True)

    # ── Row 3: Top red flags + NOVA breakdown ──
    col_flags, col_nova = st.columns([3, 2])

    with col_flags:
        st.markdown('<div class="nl-card">', unsafe_allow_html=True)
        st.markdown("**Most Common Red Flags This Month**")

        flags_data = [
            ("High Sugar", 38, "#EF4444"),
            ("High Sodium", 24, "#F59E0B"),
            ("Ultra-Processed (NOVA 4)", 19, "#F97316"),
            ("High Saturated Fat", 12, "#DC2626"),
            ("Low Fibre", 8, "#6B7280"),
        ]
        for label, count, color in flags_data:
            pct = int((count / 50) * 100)
            st.markdown(f"""
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <div style="width:160px; font-size:0.82rem; color:#374151;">{label}</div>
                <div style="flex:1; background:#F3F4F6; border-radius:4px; height:8px;">
                    <div style="background:{color}; width:{pct}%; height:100%; border-radius:4px;"></div>
                </div>
                <div style="width:30px; font-size:0.8rem; color:{color}; font-weight:600; text-align:right;">{count}</div>
            </div>
            """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col_nova:
        st.markdown('<div class="nl-card">', unsafe_allow_html=True)
        st.markdown("**NOVA Processing Breakdown**")

        nova_data = [
            (1, "Unprocessed", 35, "#1B6B3A"),
            (2, "Culinary", 18, "#74B816"),
            (3, "Processed", 28, "#F59E0B"),
            (4, "Ultra-Processed", 19, "#EF4444"),
        ]
        for nova_n, label, pct, color in nova_data:
            st.markdown(f"""
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <div style="width:28px; height:28px; border-radius:6px; background:{color};
                             color:#fff; font-weight:700; font-size:0.85rem;
                             display:flex; align-items:center; justify-content:center; flex-shrink:0;">{nova_n}</div>
                <div style="flex:1;">
                    <div style="font-size:0.78rem; color:#374151; font-weight:500;">{label}</div>
                    <div style="background:#F3F4F6; border-radius:3px; height:6px; margin-top:3px;">
                        <div style="background:{color}; width:{pct}%; height:100%; border-radius:3px;"></div>
                    </div>
                </div>
                <div style="font-size:0.8rem; font-weight:600; color:{color};">{pct}%</div>
            </div>
            """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # ── Insight callout ──
    st.markdown("""
    <div class="nl-card nl-card-green" style="margin-top:0.5rem;">
        <div style="display:flex; align-items:flex-start; gap:1rem;">
            <div style="font-size:1.5rem;">📈</div>
            <div>
                <div style="font-weight:700; color:#111827; margin-bottom:4px;">Your Progress This Month</div>
                <div style="font-size:0.85rem; color:#374151; line-height:1.7;">
                    You've reduced your average daily sugar intake by <b style="color:#1B6B3A;">8g</b> compared to last month —
                    that's the equivalent of removing <b>2 teaspoons of sugar</b> from your daily diet.
                    Your fibre intake is improving but still below the WHO-recommended 25g/day.
                    Focus area: swap one processed snack per day for nuts or fresh fruit.
                </div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
