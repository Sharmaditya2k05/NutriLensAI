import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../App'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import Loader from '../components/Loader'
import Badge from '../components/Badge'

const HIGH_NUTRIENTS = {
  sugars: [22.5, 'red'],
  fat: [17.5, 'amber'],
  saturated_fat: [5, 'red'],
  salt: [1.5, 'red'],
  energy_kcal: [400, 'amber'],
}

const KEY_LABELS = {
  energy_kcal: 'Energy', fat: 'Total Fat', saturated_fat: '— Saturated Fat',
  carbohydrates: 'Carbohydrates', sugars: '— of which Sugars',
  fiber: 'Dietary Fibre', proteins: 'Protein', salt: 'Salt',
}

const KEY_UNITS = {
  energy_kcal: 'kcal', fat: 'g', saturated_fat: 'g', carbohydrates: 'g',
  sugars: 'g', fiber: 'g', proteins: 'g', salt: 'g',
}

const KEY_MAP = {
  'Total Fat': 'fat', '— Saturated Fat': 'saturated_fat',
  '— of which Sugars': 'sugars', 'Salt': 'salt', 'Energy': 'energy_kcal',
}

const NS_COLORS = { A: '#1B6B3A', B: '#74b816', C: '#f59e0b', D: '#f97316', E: '#dc2626', 'N/A': '#9CA3AF' }

const DEMO_BUTTONS = [
  ['🍜 Maggi', 'maggi'],
  ['🧈 Amul Butter', 'amul_butter'],
  ['🥨 Haldiram\'s', 'haldirams'],
  ['🍪 Parle-G', 'parle_g'],
  ['🫙 Atta', 'atta'],
  ['🥛 Dahi', 'dahi'],
]

function NutritionTable({ product }) {
  const rows = [
    ['energy_kcal', 'Energy'], ['fat', 'Total Fat'], ['saturated_fat', '— Saturated Fat'],
    ['carbohydrates', 'Carbohydrates'], ['sugars', '— of which Sugars'],
    ['fiber', 'Dietary Fibre'], ['proteins', 'Protein'], ['salt', 'Salt'],
  ]

  return (
    <div>
      {rows.map(([key, label]) => {
        const val = product[key]
        const unit = KEY_UNITS[key] || 'g'
        const isSub = label.startsWith('—')
        let badge = null
        const mapKey = KEY_MAP[label]
        if (val != null && mapKey && HIGH_NUTRIENTS[mapKey]) {
          const [thresh, col] = HIGH_NUTRIENTS[mapKey]
          badge = val > thresh ? <Badge label="HIGH" color={col} /> : <Badge label="OK" color="gray" />
        }
        if (label === 'Dietary Fibre' || label === 'Protein') {
          badge = val >= (label === 'Dietary Fibre' ? 3 : 5) ? <Badge label="GOOD" color="green" /> : null
        }

        return (
          <div key={key} className={`nut-row${isSub ? ' sub' : ''}`}>
            <span>{label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#111827' }}>{val != null ? `${val} ${unit}` : '—'}</span>
              {badge}
            </span>
          </div>
        )
      })}
      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 8, textAlign: 'right' }}>per 100g</div>
    </div>
  )
}

function DRVChart({ drv }) {
  const DRV_LABELS = {
    energy_kcal: 'Calories', fat: 'Total Fat', saturated_fat: 'Sat. Fat',
    sugars: 'Sugars', fiber: 'Fibre', proteins: 'Protein', salt: 'Salt',
  }
  const data = Object.entries(drv || {}).map(([k, pct]) => ({
    name: DRV_LABELS[k] || k,
    pct,
    color: ['sugars', 'saturated_fat', 'salt'].includes(k) && pct > 25 ? '#EF4444'
      : ['sugars', 'saturated_fat', 'salt'].includes(k) && pct > 12 ? '#F59E0B'
      : ['fiber', 'proteins'].includes(k) ? '#1B6B3A'
      : '#BBF7D0',
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 40, right: 0, left: 0, bottom: 10 }}>
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis hide domain={[0, 120]} />
        <Tooltip formatter={(v) => `${v.toFixed(0)}%`} />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}
          label={({ x, y, width, value }) => (
            <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#6B7280">{value?.toFixed(0)}%</text>
          )}
        >
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ProductDetail({ product, analysis, aiExplanation, loadingAI, onBack, navigate }) {
  const { setAltProduct } = useApp()
  const [tab, setTab] = useState(0)
  const health = analysis?.health || {}
  const ml = analysis?.ml || {}
  const flags = analysis?.red_flags || []
  const positives = analysis?.positives || []
  const ingFlags = analysis?.ingredient_flags || []
  const drv = analysis?.drv || {}
  const ns = product.nutri_score || 'N/A'
  const nova = product.nova_group
  const nsColor = NS_COLORS[ns] || '#9CA3AF'
  const novaColors = { 1: '#22c55e', 2: '#84cc16', 3: '#f59e0b', 4: '#ef4444' }
  const novaColor = novaColors[nova] || '#6b7280'
  const verdictCls = { Healthy: 'nl-card-green', Moderate: 'nl-card-amber', Unhealthy: 'nl-card-red' }[health.label] || 'nl-card'

  return (
    <div>
      <hr />
      <button className="btn-ghost" style={{ marginBottom: '1rem' }} onClick={onBack}>← Back to results</button>

      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: 2 }}>
            {product.name}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#9CA3AF', marginBottom: '1rem' }}>{product.brand}</div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* NS badge */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: nsColor, color: '#fff', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', marginBottom: 3 }}>
                {ns}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 500 }}>Nutri-Score</div>
            </div>
            {/* NOVA badge */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: novaColor, color: '#fff', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', marginBottom: 3 }}>
                {nova || '?'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 500 }}>NOVA</div>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6B7280', maxWidth: 220, lineHeight: 1.5 }}>
              {analysis?.nutri_score_description}<br />
              <span style={{ color: novaColor }}>{analysis?.nova_description}</span>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className={`${verdictCls}`} style={{ borderRadius: 16, padding: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{health.emoji}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: health.color }}>
            {health.label}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 4 }}>Score: {health.score}/100</div>
          {ml.label && (
            <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#374151' }}>
              ML: <b style={{ color: ml.color }}>{ml.label?.charAt(0).toUpperCase() + ml.label?.slice(1)}</b> &nbsp;·&nbsp; {ml.confidence}% confidence
            </div>
          )}
          {/* ML probability bars */}
          {ml.probabilities && (
            <div style={{ marginTop: 8 }}>
              {[['healthy', '#22C55E'], ['moderate', '#F59E0B'], ['unhealthy', '#EF4444']].map(([cat, c]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                  <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 3, height: 6 }}>
                    <div style={{ background: c, width: `${ml.probabilities[cat] || 0}%`, height: '100%', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: c, width: 60 }}>{cat.charAt(0).toUpperCase() + cat.slice(1)} {(ml.probabilities[cat] || 0).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['📊 Nutrition Facts', '⚠️ Flags & Allergens', '🧪 Ingredients', '🤖 AI Analysis'].map((t, i) => (
          <button key={i} className={`tab-btn${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Nutrition */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div><NutritionTable product={product} /></div>
          <div><DRVChart drv={drv} /></div>
        </div>
      )}

      {/* Tab 1: Flags */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ marginBottom: '0.75rem' }}>🚨 Concerns</h4>
              {flags.length > 0
                ? flags.map((f, i) => (
                    <div key={i} className={f.level === 'high' ? 'danger-box' : 'warn-box'}>{f.message}</div>
                  ))
                : <div className="ok-box">No major concerns detected.</div>
              }
            </div>
            <div>
              <h4 style={{ marginBottom: '0.75rem' }}>✅ Positives</h4>
              {positives.length > 0
                ? positives.map((p, i) => <div key={i} className="ok-box">{p.message}</div>)
                : <div className="info-box">Limited positive nutritional factors noted.</div>
              }
            </div>
          </div>
          <h4 style={{ marginBottom: '0.75rem' }}>🥜 Allergens</h4>
          {product.allergens?.length > 0
            ? <div className="nl-card nl-card-red">{product.allergens.map(a => <span key={a} className="badge badge-red">⚠ {a}</span>)}</div>
            : <div className="ok-box">No major allergens detected in product data.</div>
          }
        </div>
      )}

      {/* Tab 2: Ingredients */}
      {tab === 2 && (
        <div>
          {product.ingredients_text
            ? <div className="nl-card" style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.8 }}>{product.ingredients_text}</div>
            : <div className="info-box">No ingredient text available.</div>
          }
          {ingFlags.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '0.75rem' }}>⚠️ Flagged Ingredients</h4>
              {ingFlags.map((f, i) => (
                <div key={i} className={f.severity === 'danger' ? 'danger-box' : f.severity === 'warn' ? 'warn-box' : 'info-box'}>
                  <b>{f.ingredient}</b> — {f.message}
                </div>
              ))}
            </div>
          )}
          {ingFlags.length === 0 && product.ingredients_text && (
            <div className="ok-box">No major concerning additives detected.</div>
          )}
        </div>
      )}

      {/* Tab 3: AI Analysis */}
      {tab === 3 && (
        <div>
          <h4 style={{ marginBottom: '0.75rem' }}>🤖 AI Health Explanation</h4>
          <div className="info-box">Powered by Google Gemini 2.0 Flash + RAG · Falls back to rule-based engine without an API key.</div>
          {loadingAI
            ? <Loader text="Generating AI explanation…" />
            : aiExplanation && (
                <div className="nl-card nl-card-green" style={{ fontSize: '0.88rem', lineHeight: 1.8, color: '#374151', marginTop: '0.75rem' }}>
                  {aiExplanation}
                </div>
              )
          }
          <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
            <button className="btn" onClick={() => window.location.reload()}>🔄 Regenerate</button>
            <button className="btn" onClick={() => navigate('/chat')}>💬 Ask follow-up questions</button>
          </div>
          <hr />
          <button
            className="btn-primary btn-full"
            onClick={() => { setAltProduct(product); navigate('/alternatives') }}
          >
            ↔️ Find Healthier Alternatives →
          </button>
        </div>
      )}
    </div>
  )
}

export default function Scans() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { selectedProduct, setSelectedProduct } = useApp()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [aiExplanation, setAiExplanation] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  // Image upload state
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  // Run search when query changes
  useEffect(() => {
    if (!query) return
    if (selectedProduct) return
    setLoadingSearch(true)
    fetch(`/api/search?q=${encodeURIComponent(query)}&page_size=6`)
      .then(r => r.json())
      .then(d => setResults(d.products || []))
      .catch(() => setResults([]))
      .finally(() => setLoadingSearch(false))
  }, [query])

  // Analyze selected product
  useEffect(() => {
    if (!selectedProduct) { setAnalysis(null); setAiExplanation(null); return }
    setLoadingAnalysis(true)
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: selectedProduct }),
    })
      .then(r => r.json())
      .then(d => { setAnalysis(d); setLoadingAnalysis(false) })
      .catch(() => setLoadingAnalysis(false))

    // Fetch AI explanation
    setLoadingAI(true)
    fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: selectedProduct }),
    })
      .then(r => r.json())
      .then(d => { setAiExplanation(d.explanation); setLoadingAI(false) })
      .catch(() => setLoadingAI(false))
  }, [selectedProduct])

  function handleSearch(e) {
    e.preventDefault()
    setSelectedProduct(null)
    setQuery(inputVal.trim())
  }

  function handleDemoClick(key) {
    fetch(`/api/demo/${key}`)
      .then(r => r.json())
      .then(p => { setSelectedProduct(p); setAnalysis(null); setAiExplanation(null) })
      .catch(() => {})
  }

  function handleSelectProduct(p) {
    setSelectedProduct(p)
    setAnalysis(null)
    setAiExplanation(null)
  }

  function handleBack() {
    setSelectedProduct(null)
    setAnalysis(null)
    setAiExplanation(null)
  }

  // ── Image Upload Handlers ─────────────────────────────────────────────────
  function handleFileDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) uploadImage(file)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) uploadImage(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragOver(false)
  }

  function uploadImage(file) {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (JPEG, PNG, etc.)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image too large. Maximum size is 10MB.')
      return
    }

    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('image', file)

    fetch('/api/upload-label', {
      method: 'POST',
      body: formData,
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setUploadError(d.error)
        } else if (d.detail) {
          setUploadError(typeof d.detail === 'string' ? d.detail : 'Upload error: invalid field.')
        } else if (d.product) {
          setSelectedProduct(d.product)
          setAnalysis(null)
          setAiExplanation(null)
        } else {
          setUploadError('Could not extract product info from this image.')
        }
        setUploading(false)
      })
      .catch(() => {
        setUploadError('Upload failed. Please check your connection.')
        setUploading(false)
      })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">My Scans</div>
          <div className="page-sub">Search a food product by name, barcode, or upload a nutrition label image.</div>
        </div>
      </div>

      {/* Search + Upload Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Text Search */}
        <div>
          <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', gap: '0.5rem' }}>
            <input
              className="input-field"
              placeholder="Search product name or barcode…"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
            />
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>

        {/* Image Upload Zone */}
        <div
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#1B6B3A' : '#D1D5DB'}`,
            borderRadius: 12,
            padding: '0.6rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#F0FDF4' : '#FAFAFA',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: 46,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="spinner" style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>Analyzing label…</span>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '1.2rem' }}>📷</span>
              <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                Drop label image or <span style={{ color: '#1B6B3A', fontWeight: 600 }}>click to upload</span>
              </span>
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="danger-box" style={{ marginBottom: '0.75rem' }}>{uploadError}</div>
      )}

      {/* Demo buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {DEMO_BUTTONS.map(([label, key], i) => (
          <button key={i} className="btn" style={{ fontSize: '0.78rem', padding: '0.4rem 0.5rem' }} onClick={() => handleDemoClick(key)}>{label}</button>
        ))}
      </div>

      {/* Loading */}
      {loadingSearch && <Loader text={`Searching for '${query}'…`} />}

      {/* Results */}
      {!loadingSearch && !selectedProduct && results.length > 0 && (
        <div>
          <p style={{ fontSize: '0.88rem', color: '#6B7280', marginBottom: '0.75rem' }}>
            <b>{results.length} results</b> — click a product to analyze
          </p>
          <div className="grid-3">
            {results.map((p, i) => {
              const nsColor = NS_COLORS[p.nutri_score] || '#9CA3AF'
              return (
                <div key={i}>
                  <div className="nl-card" style={{ marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(p.name || 'Unknown').slice(0, 40)}
                        </div>
                        <div style={{ fontSize: '0.77rem', color: '#9CA3AF', marginTop: 1 }}>{(p.brand || '').slice(0, 30)}</div>
                      </div>
                      <span style={{ background: nsColor, color: '#fff', fontWeight: 700, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', flexShrink: 0, marginLeft: 8 }}>
                        {p.nutri_score || 'N/A'}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#6B7280' }}>
                      {(p.categories || []).slice(0, 2).join(', ') || 'Food product'}
                    </div>
                  </div>
                  <button className="btn btn-full" onClick={() => handleSelectProduct(p)}>Analyze →</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Product Detail */}
      {selectedProduct && (
        loadingAnalysis
          ? <Loader text="Analyzing product…" />
          : <ProductDetail
              product={selectedProduct}
              analysis={analysis}
              aiExplanation={aiExplanation}
              loadingAI={loadingAI}
              onBack={handleBack}
              navigate={navigate}
            />
      )}
    </div>
  )
}
