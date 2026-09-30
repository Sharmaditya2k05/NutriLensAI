import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useApp } from '../App'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import Badge from '../components/Badge'
import {
  Button, Grade, Ladder, Nova, Tabs, Note, Meter, Ring, CountUp, SplitBar,
  ProductChip, DEMO_FOODS, HEALTH, NOVA_COLORS,
} from '../components/ui'

// Per-100g thresholds that earn a "High" flag
const HIGH_NUTRIENTS = {
  sugars: [22.5, 'red'],
  fat: [17.5, 'amber'],
  saturated_fat: [5, 'red'],
  salt: [1.5, 'red'],
  energy_kcal: [400, 'amber'],
}

const ROWS = [
  { key: 'energy_kcal', label: 'Energy', unit: 'kcal', thick: true },
  { key: 'fat', label: 'Total fat', unit: 'g' },
  { key: 'saturated_fat', label: 'Saturated fat', unit: 'g', sub: true },
  { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
  { key: 'sugars', label: 'of which sugars', unit: 'g', sub: true },
  { key: 'fiber', label: 'Dietary fibre', unit: 'g', good: 3 },
  { key: 'proteins', label: 'Protein', unit: 'g', good: 5 },
  { key: 'salt', label: 'Salt', unit: 'g', thick: true },
]

function NutritionFacts({ product }) {
  return (
    <div className="facts">
      <div className="facts-title">Nutrition facts</div>
      <div className="facts-sub"><span>Per 100 g</span><span>Amount</span></div>
      {ROWS.map(({ key, label, unit, sub, thick, good }) => {
        const val = product[key]
        let badge = null
        if (val != null && HIGH_NUTRIENTS[key]) {
          const [thresh, col] = HIGH_NUTRIENTS[key]
          badge = val > thresh ? <Badge label="High" color={col} /> : <Badge label="OK" color="gray" />
        }
        if (good && val != null) badge = val >= good ? <Badge label="Good" color="green" /> : null
        return (
          <div key={key} className={`facts-row ${sub ? 'sub' : ''} ${thick ? 'thick' : ''}`}>
            <span>{sub ? label : <b>{label}</b>}</span>
            <span className="v">{badge}<span className="num" style={{ fontWeight: sub ? 600 : 800 }}>{val != null ? `${val} ${unit}` : '—'}</span></span>
          </div>
        )
      })}
      <div className="facts-foot">Flags use WHO and UK FSA per-100g limits.</div>
    </div>
  )
}

const DRV_LABELS = {
  energy_kcal: 'Calories', fat: 'Total fat', saturated_fat: 'Sat. fat', carbohydrates: 'Carbs',
  sugars: 'Sugars', fiber: 'Fibre', proteins: 'Protein', salt: 'Salt', sodium: 'Sodium',
}
const LIMIT_KEYS_ALL = ['sugars', 'saturated_fat', 'salt', 'sodium']

// Server messages sometimes start with an emoji; the UI supplies its own icons
const clean = t => String(t || '').replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '')
const LIMIT_KEYS = LIMIT_KEYS_ALL

function DailyValues({ drv }) {
  const entries = Object.entries(drv || {})
  if (!entries.length) return <p className="faint small">Daily value data isn't available for this product.</p>
  return (
    <div>
      <h3 className="h3">Share of your daily needs</h3>
      <p className="faint small" style={{ margin: '4px 0 18px' }}>From 100 g, against a 2,000 kcal adult diet</p>
      {entries.map(([k, pct]) => {
        const color = LIMIT_KEYS.includes(k) && pct > 25 ? 'var(--ns-e)'
          : LIMIT_KEYS.includes(k) && pct > 12 ? 'var(--ns-d)'
          : ['fiber', 'proteins'].includes(k) ? 'var(--ns-a)'
          : 'var(--ink-3)'
        return (
          <div key={k} className="drv-row">
            <span>{DRV_LABELS[k] || k}</span>
            <Meter value={pct} color={color} label={`${DRV_LABELS[k] || k} ${Math.round(pct)}%`} />
            <span className="num" style={{ color: color.includes('ink') ? 'var(--ink)' : color }}>{Math.round(pct)}%</span>
          </div>
        )
      })}
    </div>
  )
}

function ProductDetail({ product, analysis, aiExplanation, loadingAI, onBack, onRegenerate, navigate }) {
  const { setAltProduct } = useApp()
  const [tab, setTab] = useState(0)
  const health = analysis?.health || {}
  const ml = analysis?.ml || {}
  const flags = analysis?.red_flags || []
  const positives = analysis?.positives || []
  const ingFlags = analysis?.ingredient_flags || []
  const h = HEALTH[health.label] || HEALTH.Moderate
  const mlOk = ml.label && ml.label !== 'unknown' && !ml.error
  const verdictColor = h.color
  const concernCount = flags.length + (product.allergens?.length || 0)

  return (
    <div className="route">
      <Button variant="ghost" icon="arrowLeft" iconMotion="back" onClick={onBack} style={{ marginLeft: -12, marginBottom: 12 }}>
        Back to results
      </Button>

      <div className="grid g-main" style={{ alignItems: 'stretch' }}>
        <section className="panel">
          <div className="faint small">{product.brand || 'Unknown brand'}</div>
          <h2 className="display" style={{ fontSize: '2.3rem', margin: '4px 0 22px' }}>{product.name}</h2>
          <div className="row" style={{ gap: 18, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Ladder value={product.nutri_score} />
            <Nova group={product.nova_group} />
          </div>
          <div className="grid g-2 mt-md small" style={{ gap: 12 }}>
            {analysis?.nutri_score_description && <p className="muted">{analysis.nutri_score_description}</p>}
            {analysis?.nova_description && <p style={{ color: NOVA_COLORS[product.nova_group] || 'var(--ink-2)' }}>{analysis.nova_description}</p>}
          </div>
        </section>

        <section className="panel verdict" style={{ borderColor: verdictColor, borderWidth: 2 }}>
          <Ring value={health.score} color={verdictColor}>
            <div>
              <div className="num"><CountUp value={health.score} /></div>
              <small>out of 100</small>
            </div>
          </Ring>
          <div style={{ minWidth: 0 }}>
            <div className="small faint">Overall verdict</div>
            <div className="display verdict-word" style={{ color: verdictColor }}>{health.label || 'Not graded'}</div>
            {mlOk ? (
              <div className="small muted" style={{ marginTop: 6 }}>
                ML model says <b style={{ textTransform: 'capitalize' }}>{ml.label}</b> with {ml.confidence}% confidence.
              </div>
            ) : (
              <div className="tiny faint" style={{ marginTop: 6 }}>
                The ML model didn't run. Retrain it under How it works.
              </div>
            )}
          </div>
          {mlOk && ml.probabilities && Object.keys(ml.probabilities).length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <SplitBar parts={[
                { label: 'Healthy', value: Math.round(ml.probabilities.healthy || 0), color: 'var(--ns-a)' },
                { label: 'Moderate', value: Math.round(ml.probabilities.moderate || 0), color: 'var(--ns-c)' },
                { label: 'Unhealthy', value: Math.round(ml.probabilities.unhealthy || 0), color: 'var(--ns-e)' },
              ]} />
            </div>
          )}
        </section>
      </div>

      <div className="mt-lg">
        <Tabs
          label="Product details"
          value={tab}
          onChange={setTab}
          tabs={[
            { label: 'Nutrition', icon: 'label' },
            { label: 'Concerns', icon: 'alert', count: concernCount },
            { label: 'Ingredients', icon: 'leaf' },
            { label: 'AI explanation', icon: 'chat' },
          ]}
        />

        <div className="tab-panel" key={tab}>
          {tab === 0 && (
            <div className="grid g-2" style={{ gap: 28, alignItems: 'start' }}>
              <NutritionFacts product={product} />
              <DailyValues drv={analysis?.drv} />
            </div>
          )}

          {tab === 1 && (
            <div className="stack">
              <div className="grid g-2" style={{ alignItems: 'start' }}>
                <div>
                  <h3 className="h3 mb-md">What to watch</h3>
                  <div className="enter-list">
                    {flags.length > 0
                      ? flags.map((f, i) => <Note key={i} tone={f.level === 'high' ? 'bad' : 'warn'}>{clean(f.message)}</Note>)
                      : <Note tone="good">No major concerns found.</Note>}
                  </div>
                </div>
                <div>
                  <h3 className="h3 mb-md">What's good</h3>
                  <div className="enter-list">
                    {positives.length > 0
                      ? positives.map((p, i) => <Note key={i} tone="good">{clean(p.message)}</Note>)
                      : <Note tone="info">Not much on the plus side nutritionally.</Note>}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="h3 mb-md">Allergens</h3>
                {product.allergens?.length > 0
                  ? <div className="row-wrap">{product.allergens.map(a => <Badge key={a} label={a} color="red"><Icon name="alert" size={13} stroke={2.2} /></Badge>)}</div>
                  : <Note tone="good">No major allergens listed in the product data.</Note>}
              </div>
            </div>
          )}

          {tab === 2 && (
            <div className="grid g-main" style={{ alignItems: 'start' }}>
              <section className="panel">
                <h3 className="h3" style={{ marginBottom: 10 }}>Ingredient list</h3>
                {product.ingredients_text
                  ? <p className="muted" style={{ lineHeight: 1.75 }}>{product.ingredients_text}</p>
                  : <p className="faint">This product has no ingredient text on record.</p>}
              </section>
              <div>
                <h3 className="h3 mb-md">Flagged additives</h3>
                <div className="enter-list">
                  {ingFlags.length > 0
                    ? ingFlags.map((f, i) => (
                        <Note key={i} tone={f.severity === 'danger' ? 'bad' : f.severity === 'warn' ? 'warn' : 'info'}>
                          <b>{f.ingredient}</b>: {clean(f.message)}
                        </Note>
                      ))
                    : <Note tone="good">No concerning additives detected.</Note>}
                </div>
              </div>
            </div>
          )}

          {tab === 3 && (
            <div className="grid g-main" style={{ alignItems: 'start' }}>
              <section className="panel">
                <div className="between" style={{ marginBottom: 14 }}>
                  <h3 className="h3">In plain English</h3>
                  <Badge label="Gemini + nutrition knowledge base" color="gray" />
                </div>
                {loadingAI
                  ? <Loader inline text="Reading the label…" />
                  : aiExplanation
                    ? <div className="bubble" style={{ padding: 0 }}><ReactMarkdown>{aiExplanation}</ReactMarkdown></div>
                    : <p className="faint">No explanation yet. Try generating one again.</p>}
                <div className="row-wrap mt-md">
                  <Button size="sm" icon="refresh" iconMotion="spin" onClick={onRegenerate} loading={loadingAI}>Regenerate</Button>
                  <Button size="sm" icon="chat" onClick={() => navigate('/chat')}>Ask a follow-up</Button>
                </div>
              </section>
              <section className="panel panel-sage">
                <h3 className="h3" style={{ marginBottom: 6 }}>Want something healthier?</h3>
                <p className="muted small" style={{ marginBottom: 16 }}>See three alternatives in the same category, compared side by side.</p>
                <Button variant="primary" block iconRight="arrowRight" onClick={() => { setAltProduct(product); navigate('/alternatives') }}>
                  Find healthier swaps
                </Button>
              </section>
            </div>
          )}
        </div>
      </div>
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
  const [demoLoading, setDemoLoading] = useState(null)

  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!query || selectedProduct) return
    setLoadingSearch(true)
    fetch(`/api/search?q=${encodeURIComponent(query)}&page_size=6`)
      .then(r => r.json())
      .then(d => setResults(d.products || []))
      .catch(() => setResults([]))
      .finally(() => setLoadingSearch(false))
  }, [query])

  function fetchExplanation(product) {
    setLoadingAI(true)
    fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    })
      .then(r => r.json())
      .then(d => setAiExplanation(d.explanation))
      .catch(() => {})
      .finally(() => setLoadingAI(false))
  }

  useEffect(() => {
    if (!selectedProduct) { setAnalysis(null); setAiExplanation(null); return }
    setLoadingAnalysis(true)
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: selectedProduct }),
    })
      .then(r => r.json())
      .then(d => setAnalysis(d))
      .catch(() => {})
      .finally(() => setLoadingAnalysis(false))
    fetchExplanation(selectedProduct)
  }, [selectedProduct])

  function handleSearch(e) {
    e.preventDefault()
    setSelectedProduct(null)
    setQuery(inputVal.trim())
  }

  function handleDemoClick(key) {
    setDemoLoading(key)
    fetch(`/api/demo/${key}`)
      .then(r => r.json())
      .then(p => { setSelectedProduct(p); setAnalysis(null); setAiExplanation(null) })
      .catch(() => {})
      .finally(() => setDemoLoading(null))
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

  // ── Image upload ────────────────────────────────────────────────────────────
  function handleFileDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) uploadImage(file)
  }

  function uploadImage(file) {
    if (!file.type.startsWith('image/')) { setUploadError('That file isn\'t an image. Upload a JPEG or PNG of the label.'); return }
    if (file.size > 10 * 1024 * 1024) { setUploadError('That image is over 10 MB. Crop it to the label and try again.'); return }

    setUploading(true)
    setUploadError(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('image', file)

    fetch('/api/upload-label', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(d => {
        if (d.error) setUploadError(d.error)
        else if (d.detail) setUploadError(typeof d.detail === 'string' ? d.detail : 'The server rejected the upload.')
        else if (d.product) { setSelectedProduct(d.product); setAnalysis(null); setAiExplanation(null) }
        else setUploadError('No nutrition table found in that photo. Try a sharper, straight-on shot of the label.')
      })
      .catch(() => setUploadError('Upload failed. Check that the NutriLens server is running on port 8000.'))
      .finally(() => setUploading(false))
  }

  return (
    <>
      {!selectedProduct && (
        <header className="page-head">
          <div>
            <h1 className="display h1">Scan a product</h1>
            <p>Search by name or barcode, or photograph the nutrition label on the pack.</p>
          </div>
        </header>
      )}

      {!selectedProduct && (
        <>
          <div className="grid g-2" style={{ alignItems: 'stretch' }}>
            <form onSubmit={handleSearch} className="search-xl" role="search">
              <div className="input-wrap">
                <Icon name="search" size={19} />
                <input
                  className="input"
                  placeholder="Product name or barcode"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  aria-label="Product name or barcode"
                />
              </div>
              <Button type="submit" variant="primary" loading={loadingSearch}>Search</Button>
            </form>

            <button
              type="button"
              className={`dropzone ${dragOver ? 'over' : ''} ${uploading ? 'busy' : ''}`}
              onDrop={handleFileDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              aria-label="Upload a photo of the nutrition label"
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} hidden />
              <span className="dropzone-icon"><Icon name={uploading ? 'lens' : 'camera'} size={20} /></span>
              <span className="small">
                {uploading
                  ? <><b>Reading the label…</b><br /><span className="faint">Extracting nutrients from your photo</span></>
                  : dragOver
                    ? <b>Drop to scan</b>
                    : <><b>Upload a label photo</b><br /><span className="faint">or drag it here, up to 10 MB</span></>}
              </span>
            </button>
          </div>

          {uploadError && <div className="mt-md"><Note tone="bad">{uploadError}</Note></div>}

          <div className="row-wrap mt-md">
            <span className="small faint" style={{ alignSelf: 'center', marginRight: 4 }}>Try one:</span>
            {DEMO_FOODS.map(d => (
              <ProductChip key={d.key} label={d.label} loading={demoLoading === d.key} onClick={() => handleDemoClick(d.key)} />
            ))}
          </div>
        </>
      )}

      {loadingSearch && <Loader text={`Searching for “${query}”…`} />}

      {!loadingSearch && !selectedProduct && query && results.length === 0 && (
        <div className="mt-lg"><Note tone="info">Nothing matched “{query}”. Try the brand name, or type the barcode printed under the stripes.</Note></div>
      )}

      {!loadingSearch && !selectedProduct && results.length > 0 && (
        <>
          <div className="section-title">
            <h2 className="h3">{results.length} matches for “{query}”</h2>
            <span className="small faint">Pick one to analyse</span>
          </div>
          <div className="grid g-3 enter-list">
            {results.map((p, i) => (
              <button key={i} className="pcard" onClick={() => handleSelectProduct(p)}>
                <div className="pcard-top">
                  <div style={{ minWidth: 0 }}>
                    <div className="pcard-name">{p.name || 'Unknown product'}</div>
                    <div className="pcard-meta">{p.brand || 'Unknown brand'}</div>
                  </div>
                  <Grade value={p.nutri_score} />
                </div>
                <div className="pcard-foot">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(p.categories || []).slice(0, 2).join(', ') || 'Food product'}
                  </span>
                  <span className="pcard-go">Analyse <Icon name="arrowRight" size={15} /></span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedProduct && (
        loadingAnalysis
          ? <Loader text={`Analysing ${selectedProduct.name || 'product'}…`} />
          : <ProductDetail
              product={selectedProduct}
              analysis={analysis}
              aiExplanation={aiExplanation}
              loadingAI={loadingAI}
              onBack={handleBack}
              onRegenerate={() => fetchExplanation(selectedProduct)}
              navigate={navigate}
            />
      )}
    </>
  )
}
