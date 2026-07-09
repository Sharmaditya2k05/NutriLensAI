import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import Loader from '../components/Loader'

export default function Insights() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/scans/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-title">Health Insights</div>
        <Loader text="Loading your health insights…" />
      </div>
    )
  }

  const totalScans = stats?.total_scans || 0
  const healthyPct = stats?.healthy_percent || 0
  const moderatePct = stats?.moderate_percent || 0
  const unhealthyPct = stats?.unhealthy_percent || 0

  // Empty state
  if (totalScans === 0) {
    return (
      <div>
        <div className="page-title">Health Insights</div>
        <div className="page-sub">Visual breakdown of your nutritional patterns over time.</div>
        <div className="nl-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#111827', marginBottom: '0.5rem' }}>
            No insights yet!
          </div>
          <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem', maxWidth: 440, margin: '0 auto 1.5rem auto' }}>
            Start scanning products to see your nutritional trends, patterns, and health breakdown here.
          </div>
          <button className="btn-primary" onClick={() => navigate('/scans')}>📷 Scan Your First Product</button>
        </div>
      </div>
    )
  }

  // Build data from stats
  const weeklyTrend = (stats?.weekly || []).map(w => ({
    day: w.day || w.label || '',
    sugar: w.sugar || w.avg_sugar || 0,
    fibre: w.fibre || w.fiber || w.avg_fiber || 0,
    protein: w.protein || w.avg_protein || 0,
    score: w.score || w.count || 0,
  }))

  const donutData = [
    { name: 'Healthy', value: healthyPct, color: '#1B6B3A' },
    { name: 'Moderate', value: moderatePct, color: '#F59E0B' },
    { name: 'Unhealthy', value: unhealthyPct, color: '#EF4444' },
  ].filter(d => d.value > 0)

  const novaData = stats?.nova_breakdown || stats?.nova || [
    { n: 1, label: 'Unprocessed', pct: 0, color: '#1B6B3A' },
    { n: 2, label: 'Culinary', pct: 0, color: '#74B816' },
    { n: 3, label: 'Processed', pct: 0, color: '#F59E0B' },
    { n: 4, label: 'Ultra-Processed', pct: 0, color: '#EF4444' },
  ]

  const flagsData = stats?.red_flags || stats?.top_flags || [
    { label: 'High Sugar', count: 0, color: '#EF4444' },
    { label: 'High Sodium', count: 0, color: '#F59E0B' },
    { label: 'Ultra-Processed', count: 0, color: '#F97316' },
    { label: 'High Sat. Fat', count: 0, color: '#DC2626' },
    { label: 'Low Fibre', count: 0, color: '#6B7280' },
  ]
  const maxFlagCount = Math.max(...flagsData.map(f => f.count || 0), 1)

  // KPI cards from stats
  const avgSugar = stats?.avg_sugar || stats?.averages?.sugar || '—'
  const avgFiber = stats?.avg_fiber || stats?.averages?.fiber || '—'
  const avgSalt = stats?.avg_salt || stats?.averages?.salt || '—'
  const avgProtein = stats?.avg_protein || stats?.averages?.protein || '—'

  const KPIS = [
    { icon: '🥗', label: 'Avg Fibre', val: typeof avgFiber === 'number' ? `${avgFiber.toFixed(1)}g` : avgFiber, color: '#1B6B3A' },
    { icon: '🍬', label: 'Avg Sugar', val: typeof avgSugar === 'number' ? `${avgSugar.toFixed(1)}g` : avgSugar, color: '#F59E0B' },
    { icon: '🧂', label: 'Avg Salt', val: typeof avgSalt === 'number' ? `${avgSalt.toFixed(1)}g` : avgSalt, color: '#EF4444' },
    { icon: '💪', label: 'Avg Protein', val: typeof avgProtein === 'number' ? `${avgProtein.toFixed(1)}g` : avgProtein, color: '#3B82F6' },
  ]

  return (
    <div>
      <div className="page-title">Health Insights</div>
      <div className="page-sub">Visual breakdown of your nutritional patterns over time — based on {totalScans} scans.</div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {KPIS.map(({ icon, label, val, color }) => (
          <div key={label} className="nl-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 500 }}>{label}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.6rem', fontWeight: 800, color, margin: '4px 0' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Trend + Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="nl-card">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827', marginBottom: '0.5rem' }}>Weekly Nutrition Trend</div>
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10, color: '#6B7280' }} />
                <Line type="monotone" dataKey="sugar" name="Sugar (g)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="fibre" name="Fibre (g)" stroke="#1B6B3A" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="protein" name="Protein (g)" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
              Weekly trend data will appear after more scans
            </div>
          )}
        </div>

        <div className="nl-card">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827', marginBottom: '0.5rem' }}>Scan Health Distribution</div>
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
              No distribution data
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 4, fontSize: '0.82rem', color: '#6B7280' }}>
            {totalScans} total scans
          </div>
        </div>
      </div>

      {/* Row 3: Red flags + NOVA */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="nl-card">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827', marginBottom: '0.75rem' }}>Most Common Red Flags</div>
          {flagsData.filter(f => f.count > 0).length > 0 ? (
            flagsData.filter(f => f.count > 0).map(({ label, count, color }) => {
              const pct = Math.round((count / maxFlagCount) * 100)
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 160, fontSize: '0.82rem', color: '#374151' }}>{label}</div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                  <div style={{ width: 30, fontSize: '0.8rem', color, fontWeight: 600, textAlign: 'right' }}>{count}</div>
                </div>
              )
            })
          ) : (
            <div className="ok-box">No red flags detected yet — great job! 🎉</div>
          )}
        </div>

        <div className="nl-card">
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827', marginBottom: '0.75rem' }}>NOVA Processing Breakdown</div>
          {novaData.map((item) => {
            const n = item.n || item.nova_group
            const label = item.label || item.name || `NOVA ${n}`
            const pct = item.pct || item.percent || 0
            const novaColors = { 1: '#1B6B3A', 2: '#74B816', 3: '#F59E0B', 4: '#EF4444' }
            const color = item.color || novaColors[n] || '#6B7280'
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: color, color: '#fff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500 }}>{label}</div>
                  <div className="progress-bar" style={{ marginTop: 3 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress callout */}
      <div className="nl-card nl-card-green">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ fontSize: '1.5rem' }}>📈</div>
          <div>
            <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>Your Health Summary</div>
            <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.7 }}>
              Based on {totalScans} scanned products: <b style={{ color: '#1B6B3A' }}>{healthyPct}%</b> of your food choices are healthy,
              <b style={{ color: '#F59E0B' }}> {moderatePct}%</b> are moderate, and
              <b style={{ color: '#EF4444' }}> {unhealthyPct}%</b> need improvement.
              {healthyPct >= 70 && ' Great job maintaining a healthy diet! Keep it up.'}
              {healthyPct < 50 && ' Consider replacing processed snacks with whole foods and fresh produce.'}
              {healthyPct >= 50 && healthyPct < 70 && ' You\'re on the right track. Small changes can make a big difference.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
