import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import Loader from '../components/Loader'

const ALTERNATIVES_DB = {
  nutella: [
    { name: 'Artisana Almond', brand: 'Organic · 400g', tag: 'SMART CHOICE', tagCls: 'tag-smart', nutri_score: 'A', avg_price: '$12.99', sugars: 4.2, emoji: '🥜', reasons: ['92% less sugar', 'High in healthy fats', 'Single ingredient'] },
    { name: 'Rigoni di Asiago', brand: 'Nocciolata · 350g', tag: 'DIRECT REPLACEMENT', tagCls: 'tag-direct', nutri_score: 'C', avg_price: '$7.99', sugars: 21.0, emoji: '🍯', reasons: ['No palm oil', '60% less added sugar', 'Organic ingredients'] },
    { name: 'Natural PB', brand: 'Kirkland · 1kg', tag: 'BEST VALUE', tagCls: 'tag-value', nutri_score: 'A', avg_price: '$4.50', sugars: 2.0, emoji: '🥜', reasons: ['Highest protein (25g)', 'Most cost effective', 'Zero added sugar'] },
  ],
  lays: [
    { name: 'Baked Lentil Crisps', brand: 'Hippeas · 100g', tag: 'SMART CHOICE', tagCls: 'tag-smart', nutri_score: 'B', avg_price: '$3.99', sugars: 1.5, emoji: '🌿', reasons: ['60% less fat', 'High protein', 'Plant-based'] },
    { name: 'Rice Cakes Plain', brand: 'Quaker · 130g', tag: 'DIRECT REPLACEMENT', tagCls: 'tag-direct', nutri_score: 'B', avg_price: '$2.49', sugars: 0.5, emoji: '🍚', reasons: ['75% less sodium', 'Whole grain', 'Low calorie'] },
    { name: 'Roasted Almonds', brand: 'Blue Diamond · 200g', tag: 'BEST VALUE', tagCls: 'tag-value', nutri_score: 'A', avg_price: '$5.99', sugars: 4.0, emoji: '🥜', reasons: ['Heart healthy fats', 'High protein + fibre', 'Minimal processing'] },
  ],
  oats: [
    { name: "Bob's Red Mill", brand: 'Whole Grain Oats · 900g', tag: 'SMART CHOICE', tagCls: 'tag-smart', nutri_score: 'A', avg_price: '$7.99', sugars: 0.6, emoji: '🌾', reasons: ['Slightly higher fibre', 'Steel-cut for lower GI', 'No additives'] },
    { name: 'Purely Elizabeth', brand: 'Probiotic Oats · 312g', tag: 'DIRECT REPLACEMENT', tagCls: 'tag-direct', nutri_score: 'A', avg_price: '$8.99', sugars: 2.0, emoji: '🌱', reasons: ['Added probiotics', 'Prebiotic fibre', 'Organic certified'] },
    { name: 'Muesli Unsweetened', brand: "Bob's Red Mill · 680g", tag: 'BEST VALUE', tagCls: 'tag-value', nutri_score: 'A', avg_price: '$6.49', sugars: 1.5, emoji: '🥣', reasons: ['More variety of grains', 'Nuts and seeds included', 'Lower GI'] },
  ],
  maggi: [
    { name: 'Atta Noodles', brand: 'ITC Sunfeast · 240g', tag: 'SMART CHOICE', tagCls: 'tag-smart', nutri_score: 'B', avg_price: '₹40', sugars: 1.2, emoji: '🍜', reasons: ['Made with whole wheat', '40% more fibre', 'Lower sodium'] },
    { name: 'Vermicelli (Sevai)', brand: 'MTR · 440g', tag: 'DIRECT REPLACEMENT', tagCls: 'tag-direct', nutri_score: 'A', avg_price: '₹45', sugars: 0.5, emoji: '🍝', reasons: ['Traditional Indian staple', 'No artificial flavors', 'Low fat & low sodium'] },
    { name: 'Ragi Noodles', brand: 'Slurrp Farm · 192g', tag: 'BEST VALUE', tagCls: 'tag-value', nutri_score: 'A', avg_price: '₹99', sugars: 0.8, emoji: '🌾', reasons: ['Rich in calcium & iron', 'No maida (refined flour)', 'High protein millet base'] },
  ],
  parle_g: [
    { name: 'Digestive Biscuits', brand: 'McVities · 250g', tag: 'SMART CHOICE', tagCls: 'tag-smart', nutri_score: 'B', avg_price: '₹50', sugars: 16.5, emoji: '🍪', reasons: ['Whole wheat flour', '30% less sugar', 'Higher fibre content'] },
    { name: 'Ragi Biscuits', brand: 'Slurrp Farm · 150g', tag: 'DIRECT REPLACEMENT', tagCls: 'tag-direct', nutri_score: 'A', avg_price: '₹99', sugars: 8.0, emoji: '🌾', reasons: ['Zero maida', 'Rich in calcium', 'Natural sweetener (jaggery)'] },
    { name: 'Oats Cookies', brand: 'Unibic · 150g', tag: 'BEST VALUE', tagCls: 'tag-value', nutri_score: 'B', avg_price: '₹35', sugars: 14.0, emoji: '🥣', reasons: ['Oats-based fibre boost', 'No trans fat', 'Affordable healthy swap'] },
  ],
  parle: [
    { name: 'Digestive Biscuits', brand: 'McVities · 250g', tag: 'SMART CHOICE', tagCls: 'tag-smart', nutri_score: 'B', avg_price: '₹50', sugars: 16.5, emoji: '🍪', reasons: ['Whole wheat flour', '30% less sugar', 'Higher fibre content'] },
    { name: 'Ragi Biscuits', brand: 'Slurrp Farm · 150g', tag: 'DIRECT REPLACEMENT', tagCls: 'tag-direct', nutri_score: 'A', avg_price: '₹99', sugars: 8.0, emoji: '🌾', reasons: ['Zero maida', 'Rich in calcium', 'Natural sweetener (jaggery)'] },
    { name: 'Oats Cookies', brand: 'Unibic · 150g', tag: 'BEST VALUE', tagCls: 'tag-value', nutri_score: 'B', avg_price: '₹35', sugars: 14.0, emoji: '🥣', reasons: ['Oats-based fibre boost', 'No trans fat', 'Affordable healthy swap'] },
  ],
  haldirams: [
    { name: 'Roasted Makhana', brand: 'Farmley · 200g', tag: 'SMART CHOICE', tagCls: 'tag-smart', nutri_score: 'A', avg_price: '₹150', sugars: 0.4, emoji: '🫧', reasons: ['90% less fat than bhujia', 'Rich in antioxidants', 'Low calorie crunchy snack'] },
    { name: 'Roasted Chana', brand: 'Jabsons · 300g', tag: 'DIRECT REPLACEMENT', tagCls: 'tag-direct', nutri_score: 'A', avg_price: '₹60', sugars: 1.5, emoji: '🫘', reasons: ['High protein (22g/100g)', 'High fibre & iron', 'Traditional Indian snack'] },
    { name: 'Fox Nuts (Phool Makhana)', brand: 'True Elements · 200g', tag: 'BEST VALUE', tagCls: 'tag-value', nutri_score: 'A', avg_price: '₹199', sugars: 0.3, emoji: '🌰', reasons: ['Low GI superfood', 'Great for weight loss', 'Zero cholesterol'] },
  ],
}

const HEALTH_IMPACTS = {
  nutella: { sugar_change: '-92%', sugar_label: 'Sugar', protein_change: '+12g', protein_label: 'Protein', summary: "By switching from Nutella to Almond Butter daily, you could reduce your sugar intake by nearly 4kg per year. That's equivalent to 16,000 calories saved.", tip: 'Try adding a few drops of liquid stevia and a pinch of salt to pure almond butter to mimic the sweetness of Nutella without the insulin spike.' },
  lays: { sugar_change: '-75%', sugar_label: 'Sodium', protein_change: '+8g', protein_label: 'Protein', summary: "Switching from Lay's to lentil crisps daily could reduce your sodium intake by 0.9g per day — roughly 330g per year below the WHO recommended limit.", tip: 'Season air-popped popcorn with nutritional yeast and herbs for a similarly satisfying crunchy snack with a fraction of the sodium.' },
  oats: { sugar_change: '+2g', sugar_label: 'Fibre', protein_change: '+3g', protein_label: 'Protein', summary: 'Upgrading to steel-cut oats gives a lower glycemic index, meaning slower energy release and better satiety — keeping you fuller for longer.', tip: 'Soak oats overnight in the fridge to reduce cooking time and further lower the glycemic index.' },
  maggi: { sugar_change: '-60%', sugar_label: 'Sodium', protein_change: '+4g', protein_label: 'Fibre', summary: "Maggi instant noodles contain high sodium (1180mg/serving) and are made from refined maida. Switching to atta noodles or vermicelli reduces sodium by 60% and adds whole grain benefits.", tip: 'Try upma or poha as quick Indian alternatives — they cook just as fast but provide far better nutrition with less sodium and more fibre.' },
  parle_g: { sugar_change: '-50%', sugar_label: 'Sugar', protein_change: '+3g', protein_label: 'Fibre', summary: "Parle-G biscuits contain 26.9g sugar per 100g with refined flour (maida) as the base. Ragi biscuits cut sugar by 70% while adding calcium and iron from finger millet.", tip: "For a traditional swap, try homemade atta biscuits with jaggery — you control the sugar while keeping the familiar taste." },
  parle: { sugar_change: '-50%', sugar_label: 'Sugar', protein_change: '+3g', protein_label: 'Fibre', summary: "Parle-G biscuits contain 26.9g sugar per 100g with refined flour (maida) as the base. Ragi biscuits cut sugar by 70% while adding calcium and iron from finger millet.", tip: "For a traditional swap, try homemade atta biscuits with jaggery — you control the sugar while keeping the familiar taste." },
  haldirams: { sugar_change: '-90%', sugar_label: 'Fat', protein_change: '+8g', protein_label: 'Protein', summary: "Haldiram's Bhujia is deep-fried with 35g fat per 100g. Roasted makhana provides the same satisfying crunch with 90% less fat and significantly more nutrients per calorie.", tip: "Roast makhana at home with a tiny bit of ghee, turmeric, and black pepper for a protein-rich snack that rivals any packaged namkeen." },
}

const NS_COLORS = { A: '#1B6B3A', B: '#74b816', C: '#f59e0b', D: '#f97316', E: '#dc2626', 'N/A': '#9CA3AF' }
const TAG_EMOJI = { 'SMART CHOICE': '✨', 'DIRECT REPLACEMENT': '🔄', 'BEST VALUE': '💰' }

export default function Alternatives() {
  const navigate = useNavigate()
  const { altProduct, setAltProduct } = useApp()
  const [aiText, setAiText] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [successIdx, setSuccessIdx] = useState(null)

  // Determine which key to use
  let selectedKey = null
  if (altProduct) {
    const nameLower = (altProduct.name || '').toLowerCase()
    for (const k of Object.keys(ALTERNATIVES_DB)) {
      if (nameLower.includes(k)) { selectedKey = k; break }
    }
    if (!selectedKey) selectedKey = 'nutella'
  }

  const product = altProduct || null
  const alternatives = selectedKey ? ALTERNATIVES_DB[selectedKey] : []
  const impact = selectedKey ? HEALTH_IMPACTS[selectedKey] : null

  // Reset AI state when product changes
  useEffect(() => {
    setAiText(null)
    setShowAI(false)
    setSuccessIdx(null)
  }, [altProduct])

  // Load AI text when expander opened
  function handleShowAI() {
    setShowAI(s => !s)
    if (!aiText && product) {
      setLoadingAI(true)
      fetch('/api/alternatives-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, category: (product.categories || ['food'])[0] || 'food' }),
      })
        .then(r => r.json())
        .then(d => { setAiText(d.text); setLoadingAI(false) })
        .catch(() => setLoadingAI(false))
    }
  }

  function handleDemoClick(key) {
    fetch(`/api/demo/${key}`)
      .then(r => r.json())
      .then(p => setAltProduct(p))
      .catch(() => {})
  }

  if (!product) {
    return (
      <div>
        <div className="page-title">Alternative Recommender</div>
        <div className="page-sub">Compare your scanned product with healthier, expert-vetted alternatives to optimise your daily nutrition.</div>
        <p style={{ marginBottom: '1rem', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>Choose a product to find alternatives for:</p>

        {/* International Products */}
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.5rem' }}>🌍 International</div>
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          <button className="btn" onClick={() => handleDemoClick('nutella')}>🍫 Nutella</button>
          <button className="btn" onClick={() => handleDemoClick('lays')}>🥔 Lay's Chips</button>
          <button className="btn" onClick={() => handleDemoClick('oats')}>🌾 Quaker Oats</button>
        </div>

        {/* Indian Products */}
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#6B7280', marginBottom: '0.5rem' }}>🇮🇳 Indian</div>
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          <button className="btn" onClick={() => handleDemoClick('maggi')}>🍜 Maggi</button>
          <button className="btn" onClick={() => handleDemoClick('haldirams')}>🥨 Haldiram's</button>
          <button className="btn" onClick={() => handleDemoClick('parle_g')}>🍪 Parle-G</button>
        </div>

        <div className="info-box mt-md">→ Or analyze a product in <b>My Scans</b> and click "Find Healthier Alternatives".</div>
      </div>
    )
  }

  const nsColor = NS_COLORS[product.nutri_score] || '#9CA3AF'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Alternative Recommender</div>
          <div className="page-sub">Compare your scanned product with healthier, expert-vetted alternatives.</div>
        </div>
        <div className="nl-card" style={{ padding: '0.6rem 1rem', textAlign: 'center', minWidth: 160 }}>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>ℹ️ {alternatives.length} Alternatives found for</div>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>{product.name}</div>
        </div>
      </div>

      {/* Product cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        {/* Current */}
        <div className="alt-card alt-card-current">
          <div style={{ position: 'absolute', top: 12, left: 12 }}><span className="tag-current">CURRENT SCAN</span></div>
          <div style={{ textAlign: 'center', padding: '1.5rem 0 0.8rem 0', fontSize: '3.5rem' }}>🍫</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#111827', marginBottom: 2 }}>{(product.name || '').slice(0, 20)}</div>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 12 }}>{(product.brand || '').slice(0, 25)}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '0.82rem' }}>
            <span style={{ color: '#6B7280' }}>Nutri-Score</span>
            <span style={{ background: nsColor, color: '#fff', fontWeight: 700, padding: '1px 10px', borderRadius: 4 }}>{product.nutri_score || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.82rem' }}>
            <span style={{ color: '#6B7280' }}>Sugar (per 100g)</span>
            <span style={{ color: '#EF4444', fontWeight: 700 }}>{product.sugars ?? '?'}g</span>
          </div>
        </div>

        {/* Alternative cards */}
        {alternatives.map((alt, i) => {
          const nsC = NS_COLORS[alt.nutri_score] || '#9CA3AF'
          return (
            <div key={i} className="alt-card">
              <div style={{ position: 'absolute', top: 12, left: 12 }}>
                <span className={alt.tagCls}>{TAG_EMOJI[alt.tag] || ''} {alt.tag}</span>
              </div>
              <div style={{ textAlign: 'center', padding: '1.5rem 0 0.8rem 0', fontSize: '3.5rem' }}>{alt.emoji}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#111827', marginBottom: 2 }}>{alt.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: 12 }}>{alt.brand}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '0.82rem' }}>
                <span style={{ color: '#6B7280' }}>Nutri-Score</span>
                <span style={{ background: nsC, color: '#fff', fontWeight: 700, padding: '1px 10px', borderRadius: 4 }}>{alt.nutri_score}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '0.82rem' }}>
                <span style={{ color: '#6B7280' }}>Avg Price</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>{alt.avg_price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '0.82rem' }}>
                <span style={{ color: '#6B7280' }}>Sugar (per 100g)</span>
                <span style={{ color: '#15803D', fontWeight: 700 }}>{alt.sugars}g</span>
              </div>
              <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>Why it's better:</div>
              {alt.reasons.map((r, j) => <div key={j} style={{ fontSize: '0.78rem', color: '#15803D', marginBottom: 3 }}>✓ {r}</div>)}
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  className={`btn btn-full${successIdx === i ? ' btn-primary' : ''}`}
                  onClick={() => setSuccessIdx(i)}
                >
                  {successIdx === i ? '✓ Added to watchlist!' : 'Select Alternative'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Health Impact Banner */}
      {impact && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="impact-banner">
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Health Impact of Swapping</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '1.2rem' }}>{impact.summary}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="impact-stat">
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{impact.sugar_change}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>{impact.sugar_label}</div>
              </div>
              <div className="impact-stat">
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{impact.protein_change}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>{impact.protein_label}</div>
              </div>
            </div>
          </div>
          <div className="nl-card">
            <div style={{ fontSize: '1.5rem', marginBottom: 8, color: '#1B6B3A' }}>💡</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 10 }}>Advisor Tip</div>
            <div style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.7, fontStyle: 'italic' }}>"{impact.tip}"</div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1B6B3A', cursor: 'pointer' }} onClick={() => navigate('/chat')}>Read full guide →</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Expander */}
      <div className="expander">
        <div className="expander-header" onClick={handleShowAI}>
          <span>🤖 AI Alternative Analysis</span>
          <span>{showAI ? '▲' : '▼'}</span>
        </div>
        {showAI && (
          <div className="expander-body">
            {loadingAI ? <Loader text="Generating AI alternatives analysis…" /> :
              aiText ? <div className="nl-card nl-card-green" style={{ fontSize: '0.88rem', lineHeight: 1.8 }}>{aiText}</div>
              : null}
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <button className="btn-ghost" onClick={() => setAltProduct(null)}>← Analyse a different product</button>
      </div>
    </div>
  )
}
