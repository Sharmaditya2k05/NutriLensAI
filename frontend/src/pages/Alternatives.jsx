import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useApp } from '../App'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import { Button, Grade, Accordion, CountUp, PageHead, Note } from '../components/ui'

// Curated swaps per product. `emoji` / `tagCls` are kept for data compatibility but no longer rendered.
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

const TAGS = {
  'SMART CHOICE': { label: 'Healthiest pick', icon: 'leaf' },
  'DIRECT REPLACEMENT': { label: 'Closest taste', icon: 'swap' },
  'BEST VALUE': { label: 'Best value', icon: 'target' },
}

const PICKER = [
  { group: 'Indian', items: [['maggi', 'Maggi noodles'], ['haldirams', "Haldiram's bhujia"], ['parle_g', 'Parle-G']] },
  { group: 'International', items: [['nutella', 'Nutella'], ['lays', "Lay's chips"], ['oats', 'Quaker oats']] },
]

function CompareRow({ k, v, tone }) {
  return (
    <div className="between small" style={{ padding: '9px 0', borderTop: '1px solid var(--line)' }}>
      <span className="muted">{k}</span>
      <span className="num" style={{ fontSize: '0.95rem', color: tone }}>{v}</span>
    </div>
  )
}

export default function Alternatives() {
  const navigate = useNavigate()
  const { altProduct, setAltProduct } = useApp()
  const [aiText, setAiText] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [successIdx, setSuccessIdx] = useState(null)
  const [demoLoading, setDemoLoading] = useState(null)

  // Match on letters only, so "Haldiram's Aloo Bhujia" finds `haldirams` and "Parle-G" finds `parle_g`
  let selectedKey = null
  if (altProduct) {
    const flat = (altProduct.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    selectedKey = Object.keys(ALTERNATIVES_DB).find(k => flat.includes(k.replace(/_/g, ''))) || null
  }

  const product = altProduct || null
  const alternatives = selectedKey ? ALTERNATIVES_DB[selectedKey] : []
  const impact = selectedKey ? HEALTH_IMPACTS[selectedKey] : null

  useEffect(() => {
    setAiText(null); setSuccessIdx(null)
    // No curated list for this product: go straight to the AI suggestions
    if (altProduct && !selectedKey) loadAI(true, true)
  }, [altProduct])

  function loadAI(open, force) {
    if (!open || (aiText && !force) || !product) return
    setLoadingAI(true)
    fetch('/api/alternatives-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, category: (product.categories || ['food'])[0] || 'food' }),
    })
      .then(r => r.json())
      .then(d => setAiText(d.text))
      .catch(() => {})
      .finally(() => setLoadingAI(false))
  }

  function handleDemoClick(key) {
    setDemoLoading(key)
    fetch(`/api/demo/${key}`)
      .then(r => r.json())
      .then(p => setAltProduct(p))
      .catch(() => {})
      .finally(() => setDemoLoading(null))
  }

  if (!product) {
    return (
      <>
        <PageHead title="Healthier swaps">
          Pick something you buy often. We'll put it next to three better options from the same shelf.
        </PageHead>
        <div className="grid g-2">
          {PICKER.map(({ group, items }) => (
            <section key={group} className="panel">
              <h2 className="h3" style={{ marginBottom: 14 }}>{group}</h2>
              <div className="stack-sm">
                {items.map(([key, label]) => (
                  <button key={key} className="pcard" style={{ flexDirection: 'row', alignItems: 'center', padding: '14px 16px' }} onClick={() => handleDemoClick(key)}>
                    <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
                    {demoLoading === key
                      ? <Loader inline text="" />
                      : <span className="pcard-go">Compare <Icon name="arrowRight" size={15} /></span>}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-md">
          <Note tone="info">You can also open any product in <b>Scan a product</b> and choose “Find healthier swaps”.</Note>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHead
        title="Healthier swaps"
        actions={<Button variant="ghost" icon="arrowLeft" iconMotion="back" onClick={() => setAltProduct(null)}>Choose another product</Button>}
      >
        {selectedKey
          ? <>{alternatives.length} better options for <b>{product.name}</b>, compared on grade, sugar and price.</>
          : <>Better options for <b>{product.name}</b>.</>}
      </PageHead>

      {!selectedKey && (
        <div className="mb-md"><Note tone="info">There's no hand-picked list for {product.name} yet, so these suggestions come from the AI.</Note></div>
      )}

      {selectedKey && <div className="grid g-4 enter-list" style={{ alignItems: 'stretch' }}>
        <section className="panel" style={{ background: 'var(--bad-bg)', borderColor: 'transparent', display: 'flex', flexDirection: 'column' }}>
          <span className="badge badge-red" style={{ alignSelf: 'flex-start' }}>You're buying</span>
          <div className="between" style={{ alignItems: 'flex-start', margin: '16px 0 18px' }}>
            <div style={{ minWidth: 0 }}>
              <h3 className="h3">{product.name}</h3>
              <div className="small faint">{product.brand}</div>
            </div>
            <Grade value={product.nutri_score} />
          </div>
          <CompareRow k="Sugar per 100 g" v={`${product.sugars ?? '?'} g`} tone="var(--bad)" />
          {product.salt != null && <CompareRow k="Salt per 100 g" v={`${product.salt} g`} tone={product.salt > 1.5 ? 'var(--bad)' : undefined} />}
          {product.saturated_fat != null && <CompareRow k="Saturated fat" v={`${product.saturated_fat} g`} tone={product.saturated_fat > 5 ? 'var(--bad)' : undefined} />}
          {product.energy_kcal != null && <CompareRow k="Energy" v={`${product.energy_kcal} kcal`} />}
          {product.nova_group && <CompareRow k="Processing" v={`NOVA ${product.nova_group}`} tone={product.nova_group >= 4 ? 'var(--bad)' : undefined} />}
        </section>

        {alternatives.map((alt, i) => {
          const tag = TAGS[alt.tag] || { label: alt.tag, icon: 'leaf' }
          const picked = successIdx === i
          return (
            <section key={i} className="panel" style={{ display: 'flex', flexDirection: 'column', borderColor: picked ? 'var(--ns-a)' : undefined, transition: 'border-color .25s' }}>
              <span className="badge badge-green" style={{ alignSelf: 'flex-start' }}><Icon name={tag.icon} size={13} stroke={2.2} />{tag.label}</span>
              <div className="between" style={{ alignItems: 'flex-start', margin: '16px 0 18px' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 className="h3">{alt.name}</h3>
                  <div className="small faint">{alt.brand}</div>
                </div>
                <Grade value={alt.nutri_score} />
              </div>
              <CompareRow k="Sugar per 100 g" v={`${alt.sugars} g`} tone="var(--good)" />
              <CompareRow k="Typical price" v={alt.avg_price} />
              <ul style={{ listStyle: 'none', margin: '12px 0 18px' }} className="stack-sm small">
                {alt.reasons.map((r, j) => (
                  <li key={j} className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                    <Icon name="check" size={16} stroke={2.4} style={{ color: 'var(--ns-a)', marginTop: 2, flexShrink: 0 }} />{r}
                  </li>
                ))}
              </ul>
              <Button block done={picked} variant={picked ? 'secondary' : 'primary'} onClick={() => setSuccessIdx(picked ? null : i)} style={{ marginTop: 'auto' }}>
                {picked ? 'On your list' : 'Add to my list'}
              </Button>
            </section>
          )
        })}
      </div>}

      {impact && (
        <div className="grid g-main mt-md">
          <section className="panel panel-ink">
            <h2 className="h2" style={{ color: '#fff', marginBottom: 10 }}>What the swap changes</h2>
            <p className="muted" style={{ marginBottom: 22, maxWidth: '60ch' }}>{impact.summary}</p>
            <div className="row" style={{ gap: 36 }}>
              {[[impact.sugar_change, impact.sugar_label], [impact.protein_change, impact.protein_label]].map(([v, l]) => {
                const n = parseFloat(v)
                const sign = v.trim().startsWith('+') ? '+' : v.trim().startsWith('-') ? '−' : ''
                const unit = v.replace(/[-+\d.]/g, '')
                return (
                  <div key={l}>
                    <div className="num" style={{ fontSize: '2.6rem', lineHeight: 1, color: 'var(--ns-b)' }}>
                      {sign}<CountUp value={Math.abs(n)} />{unit}
                    </div>
                    <div className="small muted" style={{ marginTop: 4 }}>{l}</div>
                  </div>
                )
              })}
            </div>
          </section>
          <section className="panel panel-sage">
            <div className="row" style={{ marginBottom: 10 }}>
              <Icon name="leaf" size={20} style={{ color: 'var(--ns-a)' }} />
              <h2 className="h3">Advisor tip</h2>
            </div>
            <p className="muted" style={{ lineHeight: 1.7 }}>{impact.tip}</p>
            <button className="link-btn mt-md" onClick={() => navigate('/chat')}>Ask the advisor about this <Icon name="arrowRight" size={16} /></button>
          </section>
        </div>
      )}

      <div className="mt-md">
        <Accordion key={product.name} title="What the AI suggests" icon="chat" onToggle={loadAI} defaultOpen={!selectedKey}>
          {loadingAI
            ? <Loader inline text="Looking for more options…" />
            : aiText
              ? <div className="bubble" style={{ padding: 0, maxWidth: '75ch' }}><ReactMarkdown>{aiText}</ReactMarkdown></div>
              : <p className="faint small">No suggestions came back. Close and reopen to try again.</p>}
        </Accordion>
      </div>
    </>
  )
}
