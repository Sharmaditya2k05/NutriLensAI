import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'
import Loader from '../components/Loader'

const STACK = [
  { cat: 'Frontend', tool: 'Vite + React', desc: 'Light theme, card-based UI with full CSS design system' },
  { cat: 'ML', tool: 'scikit-learn', desc: 'RandomForest, LogReg, DecisionTree, GradientBoosting — auto-trains on first use' },
  { cat: 'Data', tool: 'Open Food Facts API', desc: 'Live product data: nutrients, allergens, Nutri-Score, NOVA, ingredients' },
  { cat: 'RAG', tool: 'Keyword retrieval', desc: 'In-memory knowledge base (9 nutrition docs); upgradeable to FAISS/ChromaDB' },
  { cat: 'GenAI', tool: 'Google Gemini 2.0 Flash', desc: 'Free tier API · Rule-based fallback when key not set' },
  { cat: 'Charts', tool: 'Recharts', desc: 'Bar charts, line trends, pie/donut charts' },
  { cat: 'Backend', tool: 'Python FastAPI', desc: 'REST API server on port 8000 with CORS for local dev' },
]

const MODULES = [
  { title: 'Module 1 — Data Foundations', items: ['Open Food Facts API live integration', 'Nutrition data cleaning and per-100g normalisation', 'Feature engineering and EDA charts', 'Ethics: educational only, no medical claims'] },
  { title: 'Module 2 — Classical ML', items: ['Rule-based label creation from WHO/EU thresholds', '4 classifiers: LogReg, DecisionTree, RandomForest, GradientBoosting', 'Train/test split + 5-fold cross-validation', 'Metrics: accuracy, F1, precision, recall'] },
  { title: 'Module 3 — GenAI & Agents', items: ['Google Gemini 2.0 Flash via free API', 'RAG: keyword retrieval over 9 nutrition knowledge docs', 'Context-aware product explanation and chat', 'Rule-based fallback engine (works without API key)'] },
]

const MODEL_NAMES = {
  logistic_regression: 'Logistic Regression',
  decision_tree: 'Decision Tree',
  random_forest: 'Random Forest ⭐',
  gradient_boosting: 'Gradient Boosting',
}

function Expander({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="expander">
      <div className="expander-header" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div className="expander-body">{children}</div>}
    </div>
  )
}

export default function About() {
  const [tab, setTab] = useState(0)
  const [trainLoading, setTrainLoading] = useState(false)
  const [trainResults, setTrainResults] = useState(null)

  function handleTrain() {
    setTrainLoading(true)
    fetch('/api/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_type: 'random_forest' }),
    })
      .then(r => r.json())
      .then(d => { setTrainResults(d); setTrainLoading(false) })
      .catch(() => setTrainLoading(false))
  }

  const chartData = trainResults?.compare
    ? Object.entries(trainResults.compare).map(([k, v]) => ({
        name: MODEL_NAMES[k] || k,
        Accuracy: +(v.accuracy * 100).toFixed(1),
        F1: +(v.f1 * 100).toFixed(1),
        _key: k,
        _f1: v.f1,
      }))
    : []

  const bestF1 = trainResults?.compare
    ? Math.max(...Object.values(trainResults.compare).map(v => v.f1))
    : 0

  return (
    <div>
      <div className="page-title">About &amp; ML Models</div>
      <div className="page-sub">Technical overview, model training, and project information.</div>

      <div className="tabs">
        {['🏗️ Architecture', '🤖 Train & Compare Models', '📋 Project Info'].map((t, i) => (
          <button key={i} className={`tab-btn${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Architecture */}
      {tab === 0 && (
        <div>
          <div className="nl-card">
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1rem' }}>System Pipeline</div>
            <div className="mono">
              <span style={{ color: '#374151', fontWeight: 600 }}>User Input</span> (name / barcode / chat)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              <span style={{ color: '#1B6B3A', fontWeight: 600 }}>Open Food Facts API</span> → Product data (nutrients, allergens, Nutri-Score, NOVA)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              <span style={{ color: '#1B6B3A', fontWeight: 600 }}>Feature Engineering</span> → Normalised per-100g nutrition values<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              <span style={{ color: '#D97706', fontWeight: 600 }}>ML Pipeline</span> (scikit-learn) → Health classification: Healthy / Moderate / Unhealthy<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              <span style={{ color: '#D97706', fontWeight: 600 }}>Rule Engine</span> → Red flags, allergen detection, additive flagging<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>RAG Retriever</span> → 9 curated nutrition knowledge documents<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Gemini 2.0 Flash</span> → Plain-English explanation, alternatives, chat<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              <span style={{ color: '#374151', fontWeight: 600 }}>Vite + React UI</span> → Dashboard, scans, alternatives, chat, insights
            </div>
          </div>
          <h4 style={{ margin: '1rem 0 0.75rem' }}>Tech Stack</h4>
          {STACK.map(({ cat, tool, desc }) => (
            <div key={cat} className="nl-card" style={{ padding: '0.7rem 1rem', marginBottom: '0.4rem', display: 'flex', gap: '1rem' }}>
              <div style={{ minWidth: 90, fontSize: '0.72rem', color: '#1B6B3A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: 1 }}>{cat}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{tool}</div>
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 1 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 1: ML Training */}
      {tab === 1 && (
        <div>
          <h4 style={{ marginBottom: '0.75rem' }}>Classification Pipeline</h4>
          <div className="nl-card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.8 }}>
              <b>Label creation:</b> WHO/EU thresholds generate ground truth labels.
              These train ML models which learn to generalise beyond simple thresholds.<br /><br />
              <b>Training data:</b> 3,000 synthetic product profiles across 8 food categories.<br />
              <b>Features:</b> energy_kcal · fat · saturated_fat · carbohydrates · sugars · fiber · proteins · salt
            </div>
          </div>

          <button className="btn-primary btn-full" onClick={handleTrain} disabled={trainLoading} style={{ marginBottom: '1rem' }}>
            🤖 Train &amp; Compare All Models
          </button>

          {trainLoading && <Loader text="Training 4 models… (~15 seconds)" />}

          {trainResults && !trainLoading && (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 30, right: 0, left: 0, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 115]} />
                  <Tooltip formatter={v => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#6B7280' }} />
                  <Bar dataKey="Accuracy" fill="#1B6B3A" radius={[4, 4, 0, 0]}
                    label={({ x, y, width, value }) => <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#1B6B3A">{value}%</text>}
                  />
                  <Bar dataKey="F1" fill="#BBF7D0" radius={[4, 4, 0, 0]}
                    label={({ x, y, width, value }) => <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#6B7280">{value}%</text>}
                  />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid-4" style={{ marginTop: '1rem' }}>
                {chartData.map((m, i) => {
                  const isBest = (trainResults.compare[m._key]?.f1 || 0) === bestF1
                  return (
                    <div key={i} className="nl-card" style={{ textAlign: 'center', ...(isBest ? { borderColor: '#1B6B3A', borderWidth: 2 } : {}) }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: isBest ? 700 : 500, color: isBest ? '#1B6B3A' : '#374151', marginBottom: 8 }}>{m.name}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1B6B3A' }}>{m.Accuracy}%</div>
                      <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>accuracy</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3B82F6', marginTop: 4 }}>{m.F1}%</div>
                      <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>F1 score</div>
                    </div>
                  )
                })}
              </div>

              {trainResults.metrics && (
                <div className="ok-box" style={{ marginTop: '1rem' }}>
                  ✅ Random Forest saved as active model · Accuracy: {(trainResults.metrics.accuracy * 100).toFixed(1)}% ·
                  F1: {(trainResults.metrics.f1_weighted * 100).toFixed(1)}% ·
                  5-fold CV: {(trainResults.metrics.cv_mean * 100).toFixed(1)}% ± {trainResults.metrics.cv_std.toFixed(3)}
                </div>
              )}
            </div>
          )}

          {!trainResults && !trainLoading && (
            <div className="info-box">ℹ️ Model auto-trains on first prediction. Click above to pre-train and compare all 4 models.</div>
          )}
        </div>
      )}

      {/* Tab 2: Project Info */}
      {tab === 2 && (
        <div>
          <div className="nl-card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 12 }}>
              NutriLens AI — Capstone Project
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 2 }}>
              <b style={{ color: '#374151' }}>Stack:</b> Vite + React · Python FastAPI · scikit-learn · Google Gemini 2.0 Flash · Open Food Facts · Recharts<br />
              <b style={{ color: '#374151' }}>Modules:</b> Data foundations · Classical ML · GenAI &amp; Agents · RAG<br />
              <b style={{ color: '#374151' }}>Author:</b> Aditya Sharma · JIIT, Noida · AIML Internship Project
            </div>
          </div>

          {MODULES.map(({ title, items }) => (
            <Expander key={title} title={title}>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#374151', lineHeight: 2 }}>
                {items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </Expander>
          ))}

          <div className="warn-box" style={{ marginTop: '1rem' }}>
            <b>Disclaimer:</b> NutriLens AI is an educational capstone project.
            All health assessments are for informational purposes only and do not constitute
            medical or dietary advice. Consult a qualified healthcare professional for personal guidance.
          </div>
        </div>
      )}
    </div>
  )
}
