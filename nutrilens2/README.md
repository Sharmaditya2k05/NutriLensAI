# 🥗 NutriLens AI

AI-powered food label analyzer with a clean, professional UI.

## Quick Start

```bash
pip install -r requirements.txt
cp .env.example .env
# Add GEMINI_API_KEY (free at https://aistudio.google.com/apikey)
streamlit run app.py
```

## Pages
- **Dashboard** — Weekly health score, recent scans, insights
- **My Scans** — Search product by name/barcode, full nutrition analysis
- **Alternatives** — Healthier product recommendations with impact calculator
- **Advisor Chat** — RAG-powered nutrition Q&A with Gemini AI
- **Health Insights** — Trends, red flags, NOVA breakdown
- **About & ML** — Model training, comparison, project info

## Stack
Streamlit · scikit-learn · Google Gemini 2.0 Flash (free) · Open Food Facts API · Plotly
