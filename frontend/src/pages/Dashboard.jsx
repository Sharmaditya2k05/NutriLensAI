import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import Badge from '../components/Badge'
import Loader from '../components/Loader'

const HEALTH_EMOJI = { Healthy: '🥗', Moderate: '⚠️', Unhealthy: '🚨' }
const HEALTH_LABEL_STYLE = {
  Healthy:   { color: '#15803D', bg: '#DCFCE7' },
  Moderate:  { color: '#92400E', bg: '#FEF3C7' },
  Unhealthy: { color: '#B91C1C', bg: '#FEE2E2' },
}

const DEMO_FOODS = [
  ['🍜 Maggi',            'maggi'],
  ['🧈 Amul Butter',      'amul_butter'],
  ['🥨 Haldiram\'s Bhujia','haldirams'],
  ['🍪 Parle-G',          'parle_g'],
  ['🫙 Aashirvaad Atta',  'atta'],
  ['🥛 Mother Dairy Dahi','dahi'],
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now - d
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { setSelectedProduct } = useApp()
  const [searchQ, setSearchQ] = useState('')
  const [stats, setStats] = useState(null)
  const [recentScans, setRecentScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      fetch('/api/scans/stats').then(r => r.json()).catch(() => null),
      fetch('/api/scans/history?limit=8').then(r => r.json()).catch(() => null),
    ]).then(([statsData, historyData]) => {
      if (!mounted) return
      setStats(statsData)
      setRecentScans(historyData?.scans || historyData || [])
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate('/scans?q=' + encodeURIComponent(searchQ.trim()))
    }
  }

  function handleDemoClick(key) {
    fetch(`/api/demo/${key}`)
      .then(r => r.json())
      .then(p => { setSelectedProduct(p); navigate('/scans') })
      .catch(() => {})
  }

  const totalScans = stats?.total_scans || 0
  const healthyPct = stats?.healthy_percent || 0
  const moderatePct = stats?.moderate_percent || 0
  const unhealthyPct = stats?.unhealthy_percent || 0
  const weeklyData = (stats?.weekly || []).map(w => ({
    day: w.day || w.label || '',
    val: w.score || w.count || 0,
  }))
  const avgScore = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, w) => s + w.val, 0) / weeklyData.length)
    : 0
  const maxVal = weeklyData.length > 0 ? Math.max(...weeklyData.map(w => w.val)) : 0
  const maxIdx = weeklyData.findIndex(w => w.val === maxVal)

  const isEmpty = totalScans === 0 && recentScans.length === 0

  if (loading) {
    return (
      <div>
        <div className="page-title">Dashboard</div>
        <Loader text="Loading your dashboard…" />
      </div>
    )
  }

  return (
    <div>
      {/* Top Bar */}
      <div className="top-bar">
        <form onSubmit={handleSearch} className="search-bar-wrap" style={{ flex: 1, maxWidth: 520 }}>
          <input
            className="input-field"
            placeholder="🔍  Quick Scan or Search Food Item..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </form>
      </div>

      <div className="page-title">Dashboard</div>
      {isEmpty ? (
        <div className="page-sub">Welcome to NutriLens AI! Get started by scanning your first product.</div>
      ) : (
        <div className="page-sub">
          You've scanned <b style={{ color: '#1B6B3A' }}>{totalScans} products</b> — {healthyPct}% are healthy.
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="nl-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔬</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#111827', marginBottom: '0.5rem' }}>
              No scans yet!
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem', maxWidth: 440, margin: '0 auto 1.5rem auto' }}>
              Start by searching a product or uploading a food label. Try one of the demo products below!
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/scans')}>📷 Scan New Product</button>
              <button className="btn" onClick={() => navigate('/chat')}>💬 Ask AI Advisor</button>
              <button className="btn" onClick={() => navigate('/diet-plan')}>🥗 Diet Plan</button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#374151', marginBottom: '0.75rem' }}>🇮🇳 Try popular Indian products:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {DEMO_FOODS.map(([label, key]) => (
                <button key={key} className="btn" onClick={() => handleDemoClick(key)}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data View */}
      {!isEmpty && (
        <>
          {/* Row 1: Chart + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Weekly Chart */}
            <div className="nl-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>
                    Weekly Nutritional Health
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '2px' }}>
                    Consistency score based on your scanned meals
                  </div>
                </div>
                {avgScore > 0 && (
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: '#1B6B3A' }}>
                    {avgScore}%
                  </div>
                )}
              </div>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={weeklyData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                    <YAxis hide domain={[0, 110]} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]} label={({ index, x, y, width, value }) =>
                      index === maxIdx ? (
                        <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fill="#1B6B3A" fontWeight={600}>{value}%</text>
                      ) : null
                    }>
                      {weeklyData.map((entry, i) => (
                        <Cell key={i} fill={i === maxIdx ? '#1B6B3A' : '#BBF7D0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
                  No weekly data yet
                </div>
              )}
            </div>

            {/* Scan Categories */}
            <div className="nl-card" style={{ height: '100%' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '1.2rem' }}>Scan Categories</div>
              {[
                ['🥗 Healthy', healthyPct, '#1B6B3A'],
                ['⚠️ Moderate', moderatePct, '#F59E0B'],
                ['🚨 Unhealthy', unhealthyPct, '#EF4444'],
              ].map(([label, pct, color]) => (
                <div key={label} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#374151' }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
              <button className="btn btn-full" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/insights')}>View Detailed Trends</button>
            </div>
          </div>

          {/* Demo buttons */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#374151', marginBottom: '0.5rem' }}>🇮🇳 Quick scan Indian products:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
              {DEMO_FOODS.map(([label, key]) => (
                <button key={key} className="btn" style={{ fontSize: '0.78rem', padding: '0.4rem 0.5rem' }} onClick={() => handleDemoClick(key)}>{label}</button>
              ))}
            </div>
          </div>

          {/* Row 2: Recent Scans */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0 1rem 0' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>Recent Scans</div>
            <span
              onClick={() => navigate('/scans')}
              style={{ fontSize: '0.85rem', color: '#1B6B3A', fontWeight: 600, cursor: 'pointer' }}
            >View All Scans →</span>
          </div>

          {recentScans.length > 0 ? (
            <div className="grid-4">
              {recentScans.slice(0, 8).map((scan, i) => {
                const label = scan.health_label || scan.label || 'Moderate'
                const style = HEALTH_LABEL_STYLE[label] || HEALTH_LABEL_STYLE.Moderate
                const emoji = HEALTH_EMOJI[label] || '⚠️'
                const kcal = scan.energy_kcal || scan.kcal || 0
                const name = scan.product_name || scan.name || 'Unknown Product'
                return (
                  <div key={i} className="scan-card">
                    <div style={{ background: '#F9FAF9', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: '16px 16px 0 0' }}>
                      <span style={{ fontSize: '3.5rem' }}>{emoji}</span>
                      <span style={{ position: 'absolute', top: 10, right: 10, background: style.bg, color: style.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                        {label}
                      </span>
                    </div>
                    <div style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name.length > 30 ? name.slice(0, 30) + '…' : name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 6 }}>
                        🕐 {timeAgo(scan.scanned_at || scan.timestamp)} {kcal > 0 && <>&nbsp;·&nbsp; 🔥 {kcal} kcal</>}
                      </div>
                      {scan.nutri_score && (
                        <Badge label={`NS: ${scan.nutri_score}`} color={['A','B'].includes(scan.nutri_score) ? 'green' : ['C'].includes(scan.nutri_score) ? 'amber' : 'red'} />
                      )}
                    </div>
                    <div style={{ padding: '0 1rem 0.75rem' }}>
                      <button className="btn btn-full" onClick={() => navigate('/scans?q=' + encodeURIComponent(name.split(' ')[0]))}>
                        View Details
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="nl-card" style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
              No recent scans to show
            </div>
          )}

          {/* Row 3: Pro Insight + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="nl-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.3rem' }}>💡</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>Pro Insight</div>
                <div style={{ fontSize: '0.83rem', color: '#6B7280', lineHeight: 1.6 }}>
                  {unhealthyPct > 20
                    ? 'Consider reducing processed food consumption. Your unhealthy scan rate is above 20%.'
                    : 'Great job! Keep scanning your food to maintain your healthy eating habits.'}
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1B6B3A', cursor: 'pointer' }} onClick={() => navigate('/alternatives')}>Learn more about healthier alternatives →</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ background: '#0F2218', borderRadius: 16, padding: '1.25rem 1.5rem', color: '#FFFFFF', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#6EE7B7', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  TOTAL SCANS
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
                  {totalScans} Items
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: '#1B6B3A', borderRadius: 8, padding: '6px 12px', textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{healthyPct}%</div>
                    <div style={{ fontSize: '0.65rem', color: '#6EE7B7' }}>Healthy</div>
                  </div>
                  <div style={{ background: '#D97706', borderRadius: 8, padding: '6px 12px', textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{moderatePct}%</div>
                    <div style={{ fontSize: '0.65rem', color: '#FEF3C7' }}>Moderate</div>
                  </div>
                  <div style={{ background: '#B91C1C', borderRadius: 8, padding: '6px 12px', textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{unhealthyPct}%</div>
                    <div style={{ fontSize: '0.65rem', color: '#FEE2E2' }}>Unhealthy</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn" onClick={() => navigate('/scans')}>📷 Scan New</button>
                <button className="btn" onClick={() => navigate('/chat')}>💬 Ask AI</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <button className="btn" onClick={() => navigate('/insights')}>📈 Trends</button>
                <button className="btn" onClick={() => navigate('/diet-plan')}>🥗 Diet Plan</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
