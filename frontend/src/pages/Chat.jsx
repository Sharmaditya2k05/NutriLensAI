import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import Loader from '../components/Loader'

const SUGGESTIONS = [
  'Why is sodium bad?',
  'What does saturated fat mean?',
  'Healthier alternatives?',
  'Is this good for daily breakfast?',
  'What is a Nutri-Score?',
  'How much sugar per day is OK?',
]

const WELCOME_MSG = "Hello! I'm your NutriLens AI Nutrition Advisor. I can help you understand food labels, interpret nutrition data, and answer questions about your diet. What would you like to know?"

export default function Chat() {
  const navigate = useNavigate()
  const { chatHistory, setChatHistory } = useApp()
  // We read altProduct / selectedProduct as chat_product context
  const [chatProduct, setChatProduct] = useState(null)
  const [inputMsg, setInputMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  async function sendMessage(query) {
    if (!query.trim()) return
    setLoading(true)

    // Build history in flat [user, assistant, user, assistant...] format
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
      setChatHistory(prev => [...prev, { user: query, assistant: 'Sorry, I encountered an error. Please check that the Python server is running.', sources: [] }])
    }
    setLoading(false)
    setInputMsg('')
  }

  function handleSend(e) {
    e.preventDefault()
    sendMessage(inputMsg)
  }

  function handleSuggestion(q) {
    sendMessage(q)
  }

  // Format AI text with basic markdown bold
  function formatAI(text) {
    if (!text) return ''
    return text
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '1.5rem' }}>
      {/* Left: product panel + suggestions */}
      <div>
        <div className="page-title" style={{ fontSize: '1.3rem' }}>Advisor Chat</div>

        {chatProduct ? (
          <ProductPanel product={chatProduct} onRemove={() => setChatProduct(null)} />
        ) : (
          <div className="nl-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🥗</div>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>No product selected</div>
            <div style={{ fontSize: '0.82rem', color: '#9CA3AF', lineHeight: 1.6, marginBottom: '1rem' }}>
              Analyse a product in <b>My Scans</b> first to get context-aware nutrition advice.
            </div>
            <button className="btn btn-full" onClick={() => navigate('/scans')}>→ Go to My Scans</button>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151', marginBottom: '0.5rem' }}>Quick questions:</div>
          {SUGGESTIONS.slice(0, 3).map((q, i) => (
            <button key={i} className="btn btn-full" style={{ marginBottom: 6, textAlign: 'left', fontSize: '0.82rem' }} onClick={() => handleSuggestion(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Right: chat panel */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>Nutrition Chat</div>
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>Powered by Gemini AI</a>
          </div>
        </div>

        {/* Chat history */}
        <div className="chat-scroll" style={{ minHeight: 320 }}>
          {chatHistory.length === 0 && (
            <div style={{ background: '#F9FAFB', border: '1px solid #EAECF0', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
                <div style={{ fontSize: '0.87rem', color: '#374151', lineHeight: 1.6, paddingTop: 6 }}>{WELCOME_MSG}</div>
              </div>
            </div>
          )}
          {chatHistory.map((turn, i) => (
            <div key={i}>
              {/* User bubble */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <span className="chat-user">{turn.user}</span>
              </div>
              {/* AI bubble */}
              {turn.assistant && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, background: '#1B6B3A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
                  <div>
                    <div className="chat-ai" dangerouslySetInnerHTML={{ __html: formatAI(turn.assistant) }} />
                    {turn.sources?.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {turn.sources.slice(0, 2).map((s, j) => (
                          <span key={j} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', color: '#374151' }}>
                            📄 {s.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && <Loader text="Thinking…" />}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion pills */}
        <div style={{ marginBottom: '1rem', lineHeight: 2.2 }}>
          {SUGGESTIONS.map((q, i) => (
            <button key={i} className="suggestion-pill" onClick={() => handleSuggestion(q)}>{q}</button>
          ))}
        </div>

        <hr />

        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'grid', gridTemplateColumns: '6fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <input
            className="input-field"
            placeholder="Ask your nutrition advisor…"
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={loading}>Send →</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textAlign: 'center' }}>
            NutriLens AI may provide general nutritional info. Consult a professional for specific dietary needs.
          </div>
          {chatHistory.length > 0 && (
            <button className="btn-ghost" style={{ fontSize: '0.78rem' }} onClick={() => setChatHistory([])}>🗑 Clear chat</button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductPanel({ product, onRemove }) {
  const sugars = product.sugars || 0
  const kcal = product.energy_kcal || 0
  const fiber = product.fiber || 0
  const protein = product.proteins || 0
  const carbs = product.carbohydrates || 0

  return (
    <div className="nl-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      {sugars > 22.5 && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: '#FEE2E2', color: '#B91C1C', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>⚠ High Sugar</div>
      )}
      <div style={{ background: '#F9FAF9', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px 16px 0 0', fontSize: '5rem' }}>🥣</div>
      <div style={{ padding: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{(product.name || '').slice(0, 30)}</div>
        <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: 12 }}>{(product.brand || '').slice(0, 25)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ background: '#F0FDF4', borderRadius: 10, padding: 8, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1B6B3A' }}>{sugars}g</div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>Sugar / 100g</div>
          </div>
          <div style={{ background: '#FFF7ED', borderRadius: 10, padding: 8, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#D97706' }}>{kcal}</div>
            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>Calories</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
          {[
            [Math.min(Math.round((fiber / 25) * 100), 99), 'Fiber', '#1B6B3A'],
            [Math.min(Math.round((protein / 50) * 100), 99), 'Protein', '#9CA3AF'],
            [Math.min(Math.round((carbs / 260) * 100), 99), 'Carbs', carbs > 55 ? '#EF4444' : '#F59E0B'],
          ].map(([val, label, color]) => (
            <div key={label} className="stat-circle" style={{ borderColor: color, color }}>
              {val}%<br /><span style={{ fontSize: '0.55rem', fontWeight: 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ margin: '0 1rem 1rem', background: '#F0FDF4', borderRadius: 10, padding: '0.8rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700, marginBottom: 4 }}>✨ Expert Summary</div>
        <div style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.6 }}>
          Product data loaded. Ask me anything about its nutrition!
        </div>
      </div>
      <div style={{ padding: '0 1rem 1rem' }}>
        <button className="btn btn-full" onClick={onRemove}>✕ Remove product context</button>
      </div>
    </div>
  )
}
