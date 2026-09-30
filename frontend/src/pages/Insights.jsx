import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import { normalizeStats } from '../lib/normalize'
import { Button, PageHead, Empty, Meter, CountUp, ChartTip, NOVA_COLORS } from '../components/ui'

const fmt = v => (typeof v === 'number' ? v.toFixed(1) : null)

export default function Insights() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hidden, setHidden] = useState({})

  useEffect(() => {
    setLoading(true)
    fetch('/api/scans/stats')
      .then(r => r.json())
      .then(d => setStats(normalizeStats(d)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (<><PageHead title="Insights" /><Loader text="Crunching your scan history…" /></>)
  }

  const totalScans = stats?.total_scans || 0
  const healthyPct = stats?.healthy_percent || 0
  const moderatePct = stats?.moderate_percent || 0
  const unhealthyPct = stats?.unhealthy_percent || 0

  if (totalScans === 0) {
    return (
      <>
        <PageHead title="Insights" />
        <Empty
          icon="insights"
          title="Nothing to chart yet"
          actions={<Button variant="primary" icon="camera" onClick={() => navigate('/scans')}>Scan your first product</Button>}
        >
          Scan a few products and this page fills in with your sugar, fibre and protein trends, how processed your food is, and the red flags that come up most.
        </Empty>
      </>
    )
  }

  const weeklyTrend = (stats?.weekly || []).map(w => ({
    day: w.day || w.label || '',
    sugar: w.sugar || w.avg_sugar || 0,
    fibre: w.fibre || w.fiber || w.avg_fiber || 0,
    protein: w.protein || w.avg_protein || 0,
  }))

  const donutData = [
    { name: 'Healthy', value: healthyPct, color: '#038141' },
    { name: 'Moderate', value: moderatePct, color: '#FECB02' },
    { name: 'Unhealthy', value: unhealthyPct, color: '#E63E11' },
  ].filter(d => d.value > 0)

  const novaData = stats?.nova_breakdown || stats?.nova || [
    { n: 1, label: 'Unprocessed', pct: 0 },
    { n: 2, label: 'Culinary ingredients', pct: 0 },
    { n: 3, label: 'Processed', pct: 0 },
    { n: 4, label: 'Ultra-processed', pct: 0 },
  ]

  const rawFlags = stats?.red_flags || stats?.top_flags
  const flagsData = (rawFlags || []).filter(f => f.count > 0)
  const maxFlagCount = Math.max(...flagsData.map(f => f.count || 0), 1)

  const avg = k => stats?.[`avg_${k}`] ?? stats?.averages?.[k]
  const KPIS = [
    { label: 'Fibre', val: avg('fiber'), icon: 'grain', color: 'var(--ns-a)', good: true },
    { label: 'Protein', val: avg('protein'), icon: 'bolt', color: 'var(--ink)', good: true },
    { label: 'Sugar', val: avg('sugar'), icon: 'droplet', color: 'var(--ns-d)' },
    { label: 'Salt', val: avg('salt'), icon: 'alert', color: 'var(--ns-e)' },
  ]

  const LINES = [
    { key: 'sugar', name: 'Sugar', color: '#EE8100' },
    { key: 'fibre', name: 'Fibre', color: '#038141' },
    { key: 'protein', name: 'Protein', color: '#16291E' },
  ]

  const verdict = healthyPct >= 70
    ? 'Most of what you buy is a good choice. Keep checking new products before they become habits.'
    : healthyPct < 50
      ? 'Fewer than half your products came out healthy. Replacing packaged snacks with whole foods would move this fastest.'
      : "You're on the right track. A couple of swaps in your regular snacks would push you past 70% healthy."

  const summary = (
    <section className="panel panel-ink row" style={{ gap: 18, alignItems: 'flex-start' }}>
      <Icon name="leaf" size={26} style={{ color: 'var(--ns-b)', flexShrink: 0 }} />
      <div>
        <h2 className="h3" style={{ color: '#fff', marginBottom: 6 }}>
          {healthyPct}% healthy, {moderatePct}% moderate, {unhealthyPct}% unhealthy
        </h2>
        <p className="muted" style={{ maxWidth: '68ch' }}>{verdict}</p>
        <div className="row-wrap mt-md">
          <Button variant="on-ink" size="sm" icon="swap" onClick={() => navigate('/alternatives')}>Find swaps</Button>
          <Button variant="on-ink" size="sm" icon="plan" onClick={() => navigate('/diet-plan')}>Build a diet plan</Button>
        </div>
      </div>
    </section>
  )

  return (
    <>
      <PageHead title="Insights">
        Patterns across all {totalScans} products you've scanned, averaged per 100 g.
      </PageHead>

      <section className="panel">
        <div className="stats">
          {KPIS.map(k => (
            <div key={k.label}>
              <div className="stat-k"><Icon name={k.icon} size={16} style={{ color: k.color }} />Average {k.label.toLowerCase()}</div>
              <div className="stat-v num">
                {fmt(k.val) != null ? <CountUp value={k.val} decimals={1} /> : '—'}<small>g</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid g-main mt-md">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="h3">Weekly nutrient trend</h2>
              <p>Grams per 100 g, averaged by day</p>
            </div>
            <div className="row-wrap" role="group" aria-label="Show lines">
              {LINES.map(l => (
                <button key={l.key} type="button" aria-pressed={!hidden[l.key]}
                  className={`chip chip-plain ${hidden[l.key] ? '' : 'selected'}`}
                  style={{ height: 30, fontSize: '0.8rem', ...(hidden[l.key] ? {} : { background: l.color, borderColor: l.color }) }}
                  onClick={() => setHidden(h => ({ ...h, [l.key]: !h[l.key] }))}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#E7EDE4" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#7B887E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7B887E' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip unit=" g" />} cursor={{ stroke: '#C5D0C1' }} />
                {LINES.filter(l => !hidden[l.key]).map(l => (
                  <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5}
                    dot={{ r: 3.5, strokeWidth: 0, fill: l.color }} activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }} animationDuration={900} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="faint small" style={{ height: 250, display: 'grid', placeItems: 'center' }}>Scan on a few more days to see a trend.</p>
          )}
        </section>

        <section className="panel">
          <h2 className="h3" style={{ marginBottom: 8 }}>How healthy your scans are</h2>
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={64} outerRadius={92} paddingAngle={2} cornerRadius={4}
                  dataKey="value" stroke="none" animationDuration={900}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTip unit="%" />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}>
              <div>
                <div className="num" style={{ fontSize: '2rem', lineHeight: 1 }}><CountUp value={totalScans} /></div>
                <div className="tiny faint">products</div>
              </div>
            </div>
          </div>
          <div className="legend" style={{ justifyContent: 'center' }}>
            {donutData.map(d => <span key={d.name}><i style={{ background: d.color }} />{d.name} <b>{d.value}%</b></span>)}
          </div>
        </section>
      </div>

      <div className="grid g-main mt-md">
        {rawFlags && <section className="panel">
          <h2 className="h3" style={{ marginBottom: 18 }}>Red flags that come up most</h2>
          {flagsData.length > 0 ? (
            <div className="stack">
              {flagsData.map(({ label, count }) => (
                <div key={label} className="drv-row" style={{ gridTemplateColumns: '130px 1fr 36px' }}>
                  <span className="small">{label}</span>
                  <Meter value={(count / maxFlagCount) * 100} color="var(--ns-e)" label={`${label}: ${count}`} />
                  <span className="num" style={{ textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="note note-good"><Icon name="check" size={18} /><div>No red flags in anything you've scanned.</div></div>
          )}
        </section>}

        <section className="panel">
          <h2 className="h3" style={{ marginBottom: 18 }}>How processed your food is</h2>
          <div className="stack">
            {novaData.map(item => {
              const n = item.n || item.nova_group
              const label = item.label || item.name || `NOVA ${n}`
              const pct = item.pct || item.percent || 0
              const color = NOVA_COLORS[n] || '#7B887E'
              return (
                <div key={n} className="row" style={{ gap: 12 }}>
                  <span className="grade sm" style={{ background: color, fontSize: '0.9rem' }}>{n}</span>
                  <div style={{ flex: 1 }}>
                    <div className="between small" style={{ marginBottom: 5 }}>
                      <span>{label}</span><span className="num">{pct}%</span>
                    </div>
                    <Meter value={pct} color={color} label={`${label} ${pct}%`} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
        {!rawFlags && summary}
      </div>

      {rawFlags && <div className="mt-md">{summary}</div>}
    </>
  )
}
