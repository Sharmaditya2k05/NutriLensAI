"""pages/about.py — About & ML training page."""
import streamlit as st
import plotly.graph_objects as go


def render():
    st.markdown('<div class="page-title">About & ML Models</div>', unsafe_allow_html=True)
    st.markdown('<div class="page-sub">Technical overview, model training, and project information.</div>',
                unsafe_allow_html=True)

    tab1, tab2, tab3 = st.tabs(["🏗️ Architecture", "🤖 Train & Compare Models", "📋 Project Info"])

    with tab1:
        _architecture()

    with tab2:
        _ml_tab()

    with tab3:
        _project_info()


def _architecture():
    st.markdown("""
    <div class="nl-card">
        <div style="font-weight:700; font-size:1rem; color:#111827; margin-bottom:1rem;">System Pipeline</div>
        <div style="font-family:monospace; font-size:0.82rem; color:#6B7280; line-height:2.2;">
            <span style="color:#374151; font-weight:600;">User Input</span> (name / barcode / chat)<br>
            &nbsp;&nbsp;&nbsp;&nbsp;↓<br>
            <span style="color:#1B6B3A; font-weight:600;">Open Food Facts API</span> → Product data (nutrients, allergens, Nutri-Score, NOVA)<br>
            &nbsp;&nbsp;&nbsp;&nbsp;↓<br>
            <span style="color:#1B6B3A; font-weight:600;">Feature Engineering</span> → Normalised per-100g nutrition values<br>
            &nbsp;&nbsp;&nbsp;&nbsp;↓<br>
            <span style="color:#D97706; font-weight:600;">ML Pipeline</span> (scikit-learn) → Health classification: Healthy / Moderate / Unhealthy<br>
            &nbsp;&nbsp;&nbsp;&nbsp;↓<br>
            <span style="color:#D97706; font-weight:600;">Rule Engine</span> → Red flags, allergen detection, additive flagging<br>
            &nbsp;&nbsp;&nbsp;&nbsp;↓<br>
            <span style="color:#2563EB; font-weight:600;">RAG Retriever</span> → 9 curated nutrition knowledge documents<br>
            &nbsp;&nbsp;&nbsp;&nbsp;↓<br>
            <span style="color:#2563EB; font-weight:600;">Gemini 2.0 Flash</span> → Plain-English explanation, alternatives, chat<br>
            &nbsp;&nbsp;&nbsp;&nbsp;↓<br>
            <span style="color:#374151; font-weight:600;">Streamlit UI</span> → Dashboard, scans, alternatives, chat, insights
        </div>
    </div>
    """, unsafe_allow_html=True)

    stack = [
        ("Frontend",  "Streamlit + Custom CSS", "Light theme, card-based UI matching professional design reference"),
        ("ML",        "scikit-learn",            "RandomForest, LogReg, DecisionTree, GradientBoosting — auto-trains on first use"),
        ("Data",      "Open Food Facts API",     "Live product data: nutrients, allergens, Nutri-Score, NOVA, ingredients"),
        ("RAG",       "Keyword retrieval",       "In-memory knowledge base (9 nutrition docs); upgradeable to FAISS/ChromaDB"),
        ("GenAI",     "Google Gemini 2.0 Flash", "Free tier API · Rule-based fallback when key not set"),
        ("Charts",    "Plotly",                  "Bar charts, line trends, pie/donut, radar overlays"),
    ]

    st.markdown("#### Tech Stack")
    for cat, tool, desc in stack:
        st.markdown(f"""
        <div class="nl-card" style="padding:0.7rem 1rem; margin-bottom:0.4rem; display:flex; gap:1rem;">
            <div style="min-width:90px; font-size:0.72rem; color:#1B6B3A; font-weight:700;
                        text-transform:uppercase; letter-spacing:0.4px; padding-top:1px;">{cat}</div>
            <div>
                <div style="font-weight:600; font-size:0.88rem; color:#111827;">{tool}</div>
                <div style="font-size:0.78rem; color:#9CA3AF; margin-top:1px;">{desc}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)


def _ml_tab():
    st.markdown("#### Classification Pipeline")
    st.markdown("""
    <div class="nl-card">
        <div style="font-size:0.85rem; color:#374151; line-height:1.8;">
            <b>Label creation:</b> WHO/EU thresholds generate ground truth labels.
            These train ML models which learn to generalise beyond simple thresholds.<br><br>
            <b>Training data:</b> 3,000 synthetic product profiles across 8 food categories.<br>
            <b>Features:</b> energy_kcal · fat · saturated_fat · carbohydrates · sugars · fiber · proteins · salt
        </div>
    </div>
    """, unsafe_allow_html=True)

    if st.button("🤖 Train & Compare All Models", use_container_width=True):
        with st.spinner("Training 4 models… (~15 seconds)"):
            from ml.model import compare_models, train_model
            results = compare_models()
            metrics = train_model("random_forest")

        model_names = {
            "logistic_regression": "Logistic Regression",
            "decision_tree": "Decision Tree",
            "random_forest": "Random Forest ⭐",
            "gradient_boosting": "Gradient Boosting",
        }

        models = list(results.keys())
        accs = [results[m]["accuracy"] for m in models]
        f1s  = [results[m]["f1"] for m in models]
        labels = [model_names.get(m, m) for m in models]

        fig = go.Figure()
        fig.add_trace(go.Bar(name="Accuracy", x=labels, y=accs, marker_color="#1B6B3A",
                             text=[f"{v:.1%}" for v in accs], textposition="outside",
                             textfont=dict(size=10)))
        fig.add_trace(go.Bar(name="F1 Score", x=labels, y=f1s, marker_color="#BBF7D0",
                             text=[f"{v:.1%}" for v in f1s], textposition="outside",
                             textfont=dict(size=10)))
        fig.update_layout(
            barmode="group",
            paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
            font_color="#9CA3AF",
            yaxis=dict(range=[0,1.15], gridcolor="#F3F4F6", tickformat=".0%"),
            xaxis=dict(showgrid=False),
            legend=dict(font=dict(size=10, color="#6B7280")),
            margin=dict(t=30,b=10,l=0,r=0), height=280,
        )
        st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

        cols = st.columns(4)
        for i, m in enumerate(models):
            with cols[i]:
                is_best = results[m]["f1"] == max(r["f1"] for r in results.values())
                border = "border-color:#1B6B3A;" if is_best else ""
                st.markdown(f"""
                <div class="nl-card" style="text-align:center; {border}">
                    <div style="font-size:0.78rem; font-weight:{'700' if is_best else '500'};
                                color:{'#1B6B3A' if is_best else '#374151'}; margin-bottom:8px;">
                        {model_names.get(m,m)}
                    </div>
                    <div style="font-size:1.3rem; font-weight:800; color:#1B6B3A;">{results[m]['accuracy']:.1%}</div>
                    <div style="font-size:0.68rem; color:#9CA3AF;">accuracy</div>
                    <div style="font-size:1.3rem; font-weight:800; color:#3B82F6; margin-top:4px;">{results[m]['f1']:.1%}</div>
                    <div style="font-size:0.68rem; color:#9CA3AF;">F1 score</div>
                </div>
                """, unsafe_allow_html=True)

        st.markdown(f"""
        <div class="ok-box">
            ✅ Random Forest saved as active model · Accuracy: {metrics['accuracy']:.1%} ·
            F1: {metrics['f1_weighted']:.1%} · 5-fold CV: {metrics['cv_mean']:.1%} ± {metrics['cv_std']:.3f}
        </div>
        """, unsafe_allow_html=True)
    else:
        from pathlib import Path
        if Path("ml/saved_model.joblib").exists():
            st.markdown('<div class="ok-box">✅ Trained model found on disk and ready for predictions.</div>',
                        unsafe_allow_html=True)
        else:
            st.markdown('<div class="info-box">ℹ️ Model auto-trains on first prediction. Click above to pre-train and compare all 4 models.</div>',
                        unsafe_allow_html=True)


def _project_info():
    st.markdown("""
    <div class="nl-card">
        <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:1rem; color:#111827; margin-bottom:12px;">
            NutriLens AI — Capstone Project
        </div>
        <div style="font-size:0.85rem; color:#6B7280; line-height:2;">
            <b style="color:#374151;">Stack:</b> Streamlit · scikit-learn · Google Gemini 2.0 Flash · Open Food Facts · Plotly<br>
            <b style="color:#374151;">Modules:</b> Data foundations · Classical ML · GenAI &amp; Agents · RAG<br>
            <b style="color:#374151;">Author:</b> Aditya Sharma · JIIT, Noida · AIML Internship Project
        </div>
    </div>
    """, unsafe_allow_html=True)

    modules = [
        ("Module 1 — Data Foundations", [
            "Open Food Facts API live integration",
            "Nutrition data cleaning and per-100g normalisation",
            "Feature engineering and EDA charts",
            "Ethics: educational only, no medical claims",
        ]),
        ("Module 2 — Classical ML", [
            "Rule-based label creation from WHO/EU thresholds",
            "4 classifiers: LogReg, DecisionTree, RandomForest, GradientBoosting",
            "Train/test split + 5-fold cross-validation",
            "Metrics: accuracy, F1, precision, recall",
        ]),
        ("Module 3 — GenAI & Agents", [
            "Google Gemini 2.0 Flash via free API",
            "RAG: keyword retrieval over 9 nutrition knowledge docs",
            "Context-aware product explanation and chat",
            "Rule-based fallback engine (works without API key)",
        ]),
    ]

    for title, items in modules:
        with st.expander(title):
            for item in items:
                st.markdown(f"- {item}")

    st.markdown("""
    <div class="warn-box">
        <b>Disclaimer:</b> NutriLens AI is an educational capstone project.
        All health assessments are for informational purposes only and do not constitute
        medical or dietary advice. Consult a qualified healthcare professional for personal guidance.
    </div>
    """, unsafe_allow_html=True)
