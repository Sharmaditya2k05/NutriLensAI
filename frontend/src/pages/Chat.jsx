import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useApp } from '../App'
import Icon from '../components/Icon'
import Badge from '../components/Badge'
import { Button, Grade, Ring } from '../components/ui'

const SUGGESTIONS = [
  'Why is sodium bad for me?',
  'What does saturated fat mean?',
  'Is this OK for a daily breakfast?',
  'What is a Nutri-Score?',
  'How much sugar per day is OK?',
  'Suggest a healthier alternative',
]

export default function Chat() {
  const navigate = useNavigate()
  const { chatHistory, setChatHistory, selectedProduct, altProduct } = useApp()
  // Start with whatever product the user was last looking at as context
  const [chatProduct, setChatProduct] = useState(selectedProduct || altProduct || null)
  const [inputMsg, setInputMsg] = useState('')
  const [pending, setPending] = useState(null)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)
  const loading = pending !== null

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [chatHistory, pending])

  // Grow the composer with its content
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [inputMsg])

  async function sendMessage(query) {
    if (!query.trim() || loading) return
    setPending(query)
    setInputMsg('')

    const historyForApi = []
    for (const turn of chatHistory) {
      historyForApi.push({ role: 'user', content: turn.user })
      if (turn.assistant) historyForApi.push({ role: 'assistant', content: turn.assistant })
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history: historyForApi, product: chatProduct }),
      })
      const data = await res.json()
      setChatHistory(prev => [...prev, { user: query, assistant: data.response, sources: data.sources || [] }])
    } catch {
      setChatHistory(prev => [...prev, { user: query, assistant: "I couldn't reach the NutriLens server. Check that it's running on port 8000, then send again.", sources: [], error: true }])
    }
    setPending(null)
    inputRef.current?.focus()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMsg)
    }
  }

  return (
    <div className="grid g-chat">
        <section className="panel chat">
          <div className="chat-head">
            <div>
              <h1 className="display" style={{ fontSize: '1.8rem' }}>Ask the advisor</h1>
              <div className="tiny faint" style={{ marginTop: 3 }}>Answers draw on a nutrition knowledge base and Google Gemini</div>
            </div>
            {chatHistory.length > 0 && (
              <Button variant="ghost" size="sm" icon="trash" onClick={() => setChatHistory([])}>Clear</Button>
            )}
          </div>

          <div className="chat-body" ref={bodyRef} aria-live="polite">
            {chatHistory.length === 0 && !pending && (
              <div className="msg ai welcome">
                <span className="msg-avatar"><Icon name="leaf" size={17} /></span>
                <div className="bubble">
                  <h3 className="h3">Ask anything about what's in your food</h3>
                  <p className="muted">
                    I can explain a label line by line, compare two products, or tell you how something fits your diet.
                    {chatProduct ? ` I'll answer with ${chatProduct.name} in mind.` : ' Pick a product in Scan a product and I can answer about it specifically.'}
                  </p>
                </div>
              </div>
            )}

            {chatHistory.map((turn, i) => (
              <React.Fragment key={i}>
                <div className="msg me"><div className="bubble">{turn.user}</div></div>
                {turn.assistant && (
                  <div className="msg ai">
                    <span className="msg-avatar" style={turn.error ? { color: 'var(--ns-d)' } : undefined}>
                      <Icon name={turn.error ? 'alert' : 'leaf'} size={17} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="bubble"><ReactMarkdown>{turn.assistant}</ReactMarkdown></div>
                      {turn.sources?.length > 0 && (
                        <div className="sources">
                          {turn.sources.slice(0, 3).map((s, j) => (
                            <span key={j} className="source"><Icon name="doc" size={12} />{s.title}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {pending && (
              <>
                <div className="msg me"><div className="bubble">{pending}</div></div>
                <div className="msg ai">
                  <span className="msg-avatar"><Icon name="leaf" size={17} /></span>
                  <div className="bubble typing" aria-label="Advisor is typing"><i /><i /><i /></div>
                </div>
              </>
            )}
          </div>

          <div className="chat-suggest">
            {SUGGESTIONS.map(q => (
              <button key={q} className="chip chip-plain" onClick={() => sendMessage(q)} disabled={loading}>{q}</button>
            ))}
          </div>

          <form className="composer" onSubmit={e => { e.preventDefault(); sendMessage(inputMsg) }}>
            <textarea
              ref={inputRef}
              rows={1}
              placeholder={chatProduct ? `Ask about ${chatProduct.name}…` : 'Ask about any food or nutrient…'}
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              onKeyDown={handleKey}
              aria-label="Message"
            />
            <Button type="submit" variant="primary" icon="send" aria-label="Send" disabled={!inputMsg.trim() || loading} loading={loading} />
          </form>
          <div className="chat-foot">
            <span>General information, not medical advice. Enter to send, Shift + Enter for a new line.</span>
          </div>
        </section>

        <aside className="stack">
          {chatProduct ? (
            <ProductContext product={chatProduct} onRemove={() => setChatProduct(null)} />
          ) : (
            <section className="panel">
              <h2 className="h3" style={{ marginBottom: 6 }}>No product attached</h2>
              <p className="muted small" style={{ marginBottom: 16 }}>
                Open a product in Scan a product and come back. Answers will then be about that exact product.
              </p>
              <Button block icon="scan" onClick={() => navigate('/scans')}>Scan a product</Button>
            </section>
          )}
        </aside>
    </div>
  )
}

function ProductContext({ product, onRemove }) {
  const sugars = product.sugars || 0
  const kcal = product.energy_kcal || 0
  const fiber = product.fiber || 0
  const protein = product.proteins || 0
  const carbs = product.carbohydrates || 0
  const rings = [
    [Math.min(Math.round((fiber / 25) * 100), 99), 'Fibre', 'var(--ns-a)'],
    [Math.min(Math.round((protein / 50) * 100), 99), 'Protein', 'var(--ns-b)'],
    [Math.min(Math.round((carbs / 260) * 100), 99), 'Carbs', carbs > 55 ? 'var(--ns-e)' : 'var(--ns-d)'],
  ]

  return (
    <section className="panel">
      <div className="between" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div className="tiny faint">Answering about</div>
          <h2 className="h3" style={{ marginTop: 2 }}>{product.name}</h2>
          <div className="small faint">{product.brand}</div>
        </div>
        <Grade value={product.nutri_score} />
      </div>

      <div className="grid g-2" style={{ gap: 8, marginBottom: 18 }}>
        <div className="panel panel-sage" style={{ padding: 12 }}>
          <div className="num" style={{ fontSize: '1.4rem', color: sugars > 22.5 ? 'var(--bad)' : 'var(--ink)' }}>{sugars} g</div>
          <div className="tiny muted">sugar per 100 g</div>
        </div>
        <div className="panel panel-sage" style={{ padding: 12 }}>
          <div className="num" style={{ fontSize: '1.4rem' }}>{kcal}</div>
          <div className="tiny muted">kcal per 100 g</div>
        </div>
      </div>

      <div className="tiny faint" style={{ marginBottom: 10 }}>Share of daily needs in 100 g</div>
      <div className="between" style={{ marginBottom: 18 }}>
        {rings.map(([val, label, color]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <Ring value={val} color={color} size={66}>
              <span className="num" style={{ fontSize: '0.95rem' }}>{val}%</span>
            </Ring>
            <div className="tiny muted" style={{ marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {sugars > 22.5 && <div style={{ marginBottom: 12 }}><Badge label="High in sugar" color="red" /></div>}
      <Button block variant="ghost" size="sm" icon="x" onClick={onRemove}>Stop using this product</Button>
    </section>
  )
}
