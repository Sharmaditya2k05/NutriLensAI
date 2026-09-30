import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import { Button, Tabs, Accordion, Note, PageHead, ChartTip } from '../components/ui'

const PIPELINE = [
  ['You search, scan or ask', 'A product name, a barcode, a label photo or a chat question'],
  ['Open Food Facts', 'Nutrients, allergens, Nutri-Score, NOVA group and ingredients for the product'],
  ['Feature engineering', 'Every value normalised to per 100 g'],
  ['Classifier (scikit-learn)', 'Grades the product Healthy, Moderate or Unhealthy'],
  ['Rule engine', 'Flags high sugar, salt and fat, allergens and risky additives'],
  ['Knowledge retrieval', 'Pulls the relevant passages from 9 curated nutrition documents'],
  ['Gemini 2.0 Flash', 'Writes the plain-English explanation, swaps and chat answers'],
  ['This app', 'Vite and React front end talking to a FastAPI server'],
]

const STACK = [
  { cat: 'Interface', tool: 'Vite + React', desc: 'Single design system in index.css, Recharts for charts' },
  { cat: 'Server', tool: 'Python FastAPI', desc: 'REST API on port 8000 with CORS for local development' },
  { cat: 'Data', tool: 'Open Food Facts API', desc: 'Live product data: nutrients, allergens, Nutri-Score, NOVA, ingredients' },
  { cat: 'ML', tool: 'scikit-learn', desc: 'Random forest, logistic regression, decision tree and gradient boosting; trains on first use' },
  { cat: 'Retrieval', tool: 'Keyword search', desc: 'In-memory knowledge base of 9 documents; can move to FAISS or ChromaDB' },
  { cat: 'Language model', tool: 'Google Gemini 2.0 Flash', desc: 'Free-tier API, with a rule-based fallback when no key is set' },
]

const MODULES = [
  { title: 'Module 1: Data foundations', items: ['Live Open Food Facts integration', 'Cleaning and per-100 g normalisation', 'Feature engineering and exploratory charts', 'Ethics: educational only, no medical claims'] },
  { title: 'Module 2: Classical ML', items: ['Labels generated from WHO/EU thresholds', 'Four classifiers: logistic regression, decision tree, random forest, gradient boosting', 'Train/test split plus 5-fold cross-validation', 'Accuracy, F1, precision and recall'] },
  { title: 'Module 3: Generative AI and agents', items: ['Google Gemini 2.0 Flash on the free API', 'Retrieval over 9 nutrition knowledge documents', 'Product-aware explanations and chat', 'Rule-based fallback when there is no API key'] },
]

const MODEL_NAMES = {
  logistic_regression: 'Logistic regression',
  decision_tree: 'Decision tree',
  random_forest: 'Random forest',
  gradient_boosting: 'Gradient boosting',
}

export default function About() {
  const [tab, setTab] = useState(0)
  const [trainLoading, setTrainLoading] = useState(false)
  const [trainResults, setTrainResults] = useState(null)
  const [trainError, setTrainError] = useState(null)

  function handleTrain() {
    setTrainLoading(true)
    setTrainError(null)
    fetch('/api/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_type: 'random_forest' }),
    })
      .then(r => r.json())
      .then(d => setTrainResults(d))
      .catch(() => setTrainError("Training didn't start. Check that the NutriLens server is running on port 8000."))
      .finally(() => setTrainLoading(false))
  }

  const chartData = trainResults?.compare
    ? Object.entries(trainResults.compare).map(([k, v]) => ({
        name: MODEL_NAMES[k] || k,
        Accuracy: +(v.accuracy * 100).toFixed(1),
        F1: +(v.f1 * 100).toFixed(1),
        _key: k,
      }))
    : []
  const bestF1 = trainResults?.compare ? Math.max(...Object.values(trainResults.compare).map(v => v.f1)) : 0

  return (
    <>
      <PageHead title="How it works">
        What happens between scanning a pack and seeing its verdict, and the models behind it.
      </PageHead>

      <Tabs
        label="About sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { label: 'Pipeline', icon: 'insights' },
          { label: 'Train the models', icon: 'cpu' },
          { label: 'Project', icon: 'doc' },
        ]}
      />

      <div className="tab-panel" key={tab}>
        {tab === 0 && (
          <div className="grid g-2" style={{ alignItems: 'start', gap: 24 }}>
            <section className="panel">
              <h2 className="h3" style={{ marginBottom: 20 }}>From pack to verdict</h2>
              <ol className="pipeline">
                {PIPELINE.map(([t, d]) => <li key={t}><div><b>{t}</b><span>{d}</span></div></li>)}
              </ol>
            </section>
            <section className="panel">
              <h2 className="h3" style={{ marginBottom: 8 }}>Built with</h2>
              <dl className="deflist">
                {STACK.map(({ cat, tool, desc }) => (
                  <React.Fragment key={cat}>
                    <dt>{cat}</dt>
                    <dd><b>{tool}</b><span>{desc}</span></dd>
                  </React.Fragment>
                ))}
              </dl>
            </section>
          </div>
        )}

        {tab === 1 && (
          <div className="stack">
            <section className="panel panel-sage between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ maxWidth: '62ch' }}>
                <h2 className="h3" style={{ marginBottom: 6 }}>Compare four classifiers</h2>
                <p className="muted small">
                  WHO/EU thresholds label 3,000 synthetic products across 8 food categories. Each model learns from
                  energy, fat, saturated fat, carbs, sugars, fibre, protein and salt, then gets scored on held-out data.
                </p>
              </div>
              <Button variant="primary" size="lg" icon="cpu" loading={trainLoading} onClick={handleTrain}>
                {trainLoading ? 'Training…' : trainResults ? 'Train again' : 'Train and compare'}
              </Button>
            </section>

            {trainError && <Note tone="bad">{trainError}</Note>}
            {trainLoading && <section className="panel"><Loader text="Training 4 models. This takes about 15 seconds." /></section>}

            {trainResults && !trainLoading && (
              <div className="grid g-main tab-panel" style={{ alignItems: 'start' }}>
                <section className="panel">
                  <div className="panel-head">
                    <h2 className="h3">Accuracy and F1 on the test set</h2>
                    <div className="legend" style={{ margin: 0 }}>
                      <span><i style={{ background: 'var(--ink)' }} />Accuracy</span>
                      <span><i style={{ background: 'var(--ns-b)' }} />F1</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 24, right: 0, left: -18, bottom: 0 }} barGap={4}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4B5B50' }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: '#7B887E' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip content={<ChartTip unit="%" />} cursor={{ fill: 'rgba(22,41,30,.05)' }} />
                      <Bar dataKey="Accuracy" fill="#16291E" radius={[6, 6, 0, 0]} animationDuration={900} />
                      <Bar dataKey="F1" fill="#85BB2F" radius={[6, 6, 0, 0]} animationDuration={900} animationBegin={150} />
                    </BarChart>
                  </ResponsiveContainer>
                </section>
                <section className="panel" style={{ padding: 8 }}>
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Model</th><th className="r">Accuracy</th><th className="r">F1</th></tr></thead>
                      <tbody>
                        {chartData.map(m => {
                          const best = (trainResults.compare[m._key]?.f1 || 0) === bestF1
                          return (
                            <tr key={m._key} className={best ? 'best' : ''}>
                              <td>
                                <span className="row" style={{ gap: 6 }}>
                                  {m.name}{best && <span className="badge badge-green">Best</span>}
                                </span>
                              </td>
                              <td className="r num">{m.Accuracy}%</td>
                              <td className="r num">{m.F1}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
                {trainResults.metrics && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Note tone="good">
                      Random forest is now the active model. Accuracy {(trainResults.metrics.accuracy * 100).toFixed(1)}%,
                      weighted F1 {(trainResults.metrics.f1_weighted * 100).toFixed(1)}%,
                      5-fold cross-validation {(trainResults.metrics.cv_mean * 100).toFixed(1)}% ± {trainResults.metrics.cv_std.toFixed(3)}.
                    </Note>
                  </div>
                )}
              </div>
            )}

            {!trainResults && !trainLoading && (
              <Note tone="info">The model also trains itself the first time a product is graded. Run this to see how the four compare.</Note>
            )}
          </div>
        )}

        {tab === 2 && (
          <div className="grid g-main" style={{ alignItems: 'start' }}>
            <div>
              {MODULES.map(({ title, items }, i) => (
                <Accordion key={title} title={title} defaultOpen={i === 0}>
                  <ul style={{ listStyle: 'none' }} className="stack-sm">
                    {items.map(item => (
                      <li key={item} className="row small" style={{ alignItems: 'flex-start', gap: 8 }}>
                        <Icon name="check" size={16} stroke={2.4} style={{ color: 'var(--ns-a)', marginTop: 2, flexShrink: 0 }} />{item}
                      </li>
                    ))}
                  </ul>
                </Accordion>
              ))}
            </div>
            <div className="stack">
              <section className="panel">
                <h2 className="h3" style={{ marginBottom: 8 }}>NutriLens AI</h2>
                <dl className="deflist" style={{ gridTemplateColumns: '80px 1fr' }}>
                  <dt>Author</dt><dd>Aditya Sharma</dd>
                  <dt>Institute</dt><dd>JIIT, Noida</dd>
                  <dt>Type</dt><dd>AIML internship capstone</dd>
                </dl>
              </section>
              <Note tone="warn">
                <b>For learning only.</b> Grades and advice here are informational and are not medical or dietary advice.
                Talk to a qualified professional about your own diet.
              </Note>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
