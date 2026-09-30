import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Icon from '../components/Icon'
import Badge from '../components/Badge'
import Loader from '../components/Loader'
import { normalizeStats } from '../lib/normalize'
import {
  Button, Grade, CountUp, SplitBar, Empty, ProductChip, ChartTip, DEMO_FOODS, HEALTH,
} from '../components/ui'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const mins = Math.floor((new Date() - new Date(dateStr)) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function SearchBar({ value, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="search-xl" role="search">
      <div className="input-wrap">
        <Icon name="search" size={19} />
        <input
          className="input"
          placeholder="Search a product or type a barcode"
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label="Search food products"
        />
      </div>
      <Button type="submit" variant="primary" iconRight="arrowRight">Search</Button>
    </form>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { setSelectedProduct } = useApp()
  const [searchQ, setSearchQ] = useState('')
  const [stats, setStats] = useState(null)
  const [recentScans, setRecentScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [demoLoading, setDemoLoading] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([
      fetch('/api/scans/stats').then(r => r.json()).catch(() => null),
      fetch('/api/scans/history?limit=8').then(r => r.json()).catch(() => null),
    ]).then(([statsData, historyData]) => {
      if (!mounted) return
      setStats(normalizeStats(statsData))
      setRecentScans(historyData?.scans || historyData || [])
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (searchQ.trim()) navigate('/scans?q=' + encodeURIComponent(searchQ.trim()))
  }

  function handleDemoClick(key) {
    setDemoLoading(key)
    fetch(`/api/demo/${key}`)
      .then(r => r.json())
      .then(p => { setSelectedProduct(p); navigate('/scans') })
      .catch(() => {})
      .finally(() => setDemoLoading(null))
  }

  const totalScans = stats?.total_scans || 0
  const healthyPct = stats?.healthy_percent || 0
  const moderatePct = stats?.moderate_percent || 0
  const unhealthyPct = stats?.unhealthy_percent || 0
  const weeklyData = (stats?.weekly || []).map(w => ({ day: w.day || w.label || '', val: w.score || w.count || 0 }))
  const activeDays = weeklyData.filter(w => w.val > 0)
  const avgScore = activeDays.length ? Math.round(activeDays.reduce((s, w) => s + w.val, 0) / activeDays.length) : 0
  const maxVal = weeklyData.length ? Math.max(...weeklyData.map(w => w.val)) : 0
  const maxIdx = weeklyData.findIndex(w => w.val === maxVal)
  const isEmpty = totalScans === 0 && recentScans.length === 0

  const demoRow = (
    <div className="row-wrap">
      {DEMO_FOODS.map(d => (
        <ProductChip key={d.key} label={d.label} loading={demoLoading === d.key} onClick={() => handleDemoClick(d.key)} />
      ))}
    </div>
  )

  if (loading) {
    return (
      <>
        <header className="page-head"><h1 className="display h1">Dashboard</h1></header>
        <Loader text="Loading your scans…" />
      </>
    )
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="display h1">
            {isEmpty ? 'What are you eating today?' : 'Dashboard'}
          </h1>
          <p>
            {isEmpty
              ? 'Search a packaged food or scan its label. NutriLens grades it, flags the additives and suggests better swaps.'
              : <>You've checked <b>{totalScans} products</b> so far. {healthyPct}% of them came out healthy.</>}
          </p>
        </div>
      </header>

      <SearchBar value={searchQ} onChange={setSearchQ} onSubmit={handleSearch} />

      {isEmpty ? (
        <>
          <div className="section-title">
            <h2 className="h3">Try a popular Indian product</h2>
          </div>
          {demoRow}
          <div className="mt-lg">
            <Empty
              icon="label"
              title="No scans yet"
              actions={<>
                <Button variant="primary" icon="camera" onClick={() => navigate('/scans')}>Scan a label</Button>
                <Button icon="chat" onClick={() => navigate('/chat')}>Ask the advisor</Button>
                <Button variant="ghost" icon="plan" onClick={() => navigate('/diet-plan')}>Build a diet plan</Button>
              </>}
            >
              Every product you check shows up here with its grade, calories and a weekly health trend.
            </Empty>
          </div>
        </>
      ) : (
        <>
          <div className="grid g-main mt-lg">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2 className="h3">This week's health score</h2>
                  <p>How healthy the products you scanned each day were</p>
                </div>
                {avgScore > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontSize: '2.2rem', lineHeight: 1, color: 'var(--ns-a)' }}>
                      <CountUp value={avgScore} suffix="%" />
                    </div>
                    <div className="tiny faint">average on days you scanned</div>
                  </div>
                )}
              </div>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7B887E' }} />
                    <YAxis hide domain={[0, 110]} />
                    <Tooltip cursor={{ fill: 'rgba(22,41,30,.05)', radius: 8 }} content={<ChartTip unit="%" />} />
                    <Bar dataKey="val" name="Score" radius={[7, 7, 7, 7]} animationDuration={900} animationEasing="ease-out"
                      label={({ index, x, y, width, value }) => index === maxIdx
                        ? <text x={x + width / 2} y={y - 7} textAnchor="middle" fontSize={12} fill="#16291E" fontWeight={700}>{value}%</text>
                        : null}
                    >
                      {weeklyData.map((_, i) => <Cell key={i} fill={i === maxIdx ? '#038141' : '#CFE0C9'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="faint small" style={{ height: 200, display: 'grid', placeItems: 'center' }}>Scan on a few different days to see a trend.</p>
              )}
            </section>

            <section className="panel panel-ink" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="muted small">Products checked</div>
              <div className="num" style={{ fontSize: '3.4rem', lineHeight: 1.05, color: '#fff', margin: '4px 0 22px' }}>
                <CountUp value={totalScans} />
              </div>
              <SplitBar parts={[
                { label: 'Healthy', value: healthyPct, color: 'var(--ns-a)' },
                { label: 'Moderate', value: moderatePct, color: 'var(--ns-c)' },
                { label: 'Unhealthy', value: unhealthyPct, color: 'var(--ns-e)' },
              ]} />
              <div style={{ marginTop: 'auto', paddingTop: 22 }} className="row-wrap">
                <Button variant="on-ink" size="sm" icon="insights" onClick={() => navigate('/insights')}>See trends</Button>
                <Button variant="on-ink" size="sm" icon="camera" onClick={() => navigate('/scans')}>Scan another</Button>
              </div>
            </section>
          </div>

          <div className="section-title">
            <h2 className="h3">Recent scans</h2>
            <button className="link-btn" onClick={() => navigate('/scans')}>All scans <Icon name="arrowRight" size={16} /></button>
          </div>

          {recentScans.length > 0 ? (
            <div className="grid g-4 enter-list">
              {recentScans.slice(0, 8).map((scan, i) => {
                const label = scan.health_label || scan.label || 'Moderate'
                const h = HEALTH[label] || HEALTH.Moderate
                const kcal = scan.energy_kcal || scan.kcal || 0
                const name = scan.product_name || scan.name || 'Unknown product'
                return (
                  <button
                    key={i}
                    className="pcard"
                    onClick={() => navigate('/scans?q=' + encodeURIComponent(name.split(' ')[0]))}
                  >
                    <div className="pcard-top">
                      <div style={{ minWidth: 0 }}>
                        <div className="pcard-name">{name}</div>
                        <div className="pcard-meta">{timeAgo(scan.scanned_at || scan.timestamp)}</div>
                      </div>
                      <Grade value={scan.nutri_score} size="sm" />
                    </div>
                    <div className="pcard-foot">
                      <span className="row" style={{ gap: 8 }}>
                        <Badge label={label} color={h.badge} />
                        {kcal > 0 && <span>{kcal} kcal</span>}
                      </span>
                      <span className="pcard-go">Open <Icon name="arrowRight" size={15} /></span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="panel faint">Nothing scanned recently.</p>
          )}

          <div className="grid g-side mt-lg">
            <section className="panel panel-sage row" style={{ alignItems: 'flex-start', gap: 16 }}>
              <Icon name={unhealthyPct > 20 ? 'alert' : 'leaf'} size={26} style={{ color: unhealthyPct > 20 ? 'var(--bad)' : 'var(--ns-a)', flexShrink: 0 }} />
              <div>
                <h2 className="h3" style={{ marginBottom: 4 }}>
                  {unhealthyPct > 20 ? 'More than a fifth of your scans are unhealthy' : 'Your picks are mostly on track'}
                </h2>
                <p className="muted small" style={{ marginBottom: 12 }}>
                  {unhealthyPct > 20
                    ? 'Ultra-processed snacks are usually the culprit. Swapping two or three regulars makes the biggest difference.'
                    : 'Keep scanning new products before they become regulars in your cart.'}
                </p>
                <button className="link-btn" onClick={() => navigate('/alternatives')}>Find healthier swaps <Icon name="arrowRight" size={16} /></button>
              </div>
            </section>
            <section className="panel">
              <h2 className="h3" style={{ marginBottom: 12 }}>Quick check</h2>
              {demoRow}
            </section>
          </div>
        </>
      )}
    </>
  )
}
