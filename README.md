# 🥗 NutriLens AI v2 — Intelligent Nutrition & Food Analysis Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat&logo=react)](https://react.dev/)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini%20%2B%20RAG-8E75B2?style=flat&logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**NutriLens AI v2** is a next-generation, AI-powered food intelligence platform designed to empower users with comprehensive nutritional transparency. By combining modern ML models, Retrieval-Augmented Generation (RAG) with Google Gemini, and comprehensive food product data, NutriLens AI decodes complex ingredient labels into actionable health insights.

---

## ✨ Key Features

- **🔍 Smart Food Product & Barcode Lookup:** Search or scan food products instantly to retrieve structured nutritional breakdowns.
- **🚩 Ingredient & Health Analysis:** Automatically detect controversial additives, red-flag ingredients, and nutritional positives.
- **📊 Standardized Health Grading:** Instant evaluation using **Nutri-Score** color grading and **NOVA Group** processing level classification.
- **🤖 RAG + Google Gemini AI Insights:** Get contextual health explanations, interactive AI chat answers, and smart recommendations for healthier alternatives.
- **📈 Machine Learning Models:** Custom ML classification and model comparison for predictive nutritional assessment.
- **🥗 Personalized Diet Plans & Tracking:** Save product scan history, track dietary trends, and generate customized meal plans.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Modern CSS / Responsive UI |
| **Backend** | Python 3, FastAPI, Uvicorn, Pydantic |
| **AI / ML** | Google Gemini API (`google-genai`), Custom ML Models, RAG Knowledge Base |
| **Data & Storage** | Local Database Persistence (`db.py`), Food API Integration |

---

## 🚀 Quick Start

### Option 1: One-Click Launch (Windows)
Simply run the included batch launcher:
```cmd
start_nutrilens.bat
```
This automatically starts both the FastAPI backend (`http://localhost:8000`) and the React Vite frontend (`http://localhost:5173`) in separate windows.

### Option 2: Manual Setup

#### 1. Backend (FastAPI)
```bash
cd nutrilens2
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables
Create a `.env` file inside the `nutrilens2/` directory and configure your API keys:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
