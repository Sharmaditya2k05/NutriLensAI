import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon'

// ── Nutri-Score helpers ───────────────────────────────────────────────────────
export const NS_COLORS = { A: '#038141', B: '#85BB2F', C: '#FECB02', D: '#EE8100', E: '#E63E11' }
export const NOVA_COLORS = { 1: '#038141', 2: '#85BB2F', 3: '#EE8100', 4: '#E63E11' }
export const HEALTH = {
  Healthy:   { color: '#038141', badge: 'green' },
  Moderate:  { color: '#B77E00', badge: 'amber' },
  Unhealthy: { color: '#C2330C', badge: 'red',   grade: 'E' },
}

export function normGrade(g) {
  const v = String(g || '').trim().toUpperCase()
  return NS_COLORS[v] ? v : null
}
export const gradeColor = g => NS_COLORS[normGrade(g)] || '#A7B2A9'
export const gradeBadge = g => ({ A: 'green', B: 'green', C: 'amber', D: 'red', E: 'red' }[normGrade(g)] || 'gray')

// Is motion allowed?
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Flip to true one frame after mount, so CSS transitions animate from zero.
export function useMounted(delay = 30) {
  const [m, setM] = useState(false)
  useEffect(() => { const t = setTimeout(() => setM(true), delay); return () => clearTimeout(t) }, [delay])
  return m
}

// ── Buttons ───────────────────────────────────────────────────────────────────
export function Button({
  variant = 'secondary', size, icon, iconRight, iconMotion, loading, done, block,
  className = '', children, ...rest
}) {
  const cls = [
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'ghost' && 'btn-ghost',
    variant === 'on-ink' && 'btn-on-ink',
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    block && 'btn-block',
    !children && 'btn-icon',
    done && 'is-done',
    className,
  ].filter(Boolean).join(' ')
  const motion = iconMotion ? `ico-${iconMotion}` : ''
  return (
    <button type="button" className={cls} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="btn-spin" aria-hidden="true" />
        : done ? <Icon name="check" size={17} stroke={2.4} />
        : icon ? <Icon name={icon} size={17} className={iconRight ? '' : motion} /> : null}
      {children}
      {iconRight && !loading && !done && <Icon name={iconRight} size={17} className={motion || 'ico-slide'} />}
    </button>
  )
}

// ── Grade tile, ladder, NOVA ──────────────────────────────────────────────────
export function Grade({ value, size = 'md' }) {
  const g = normGrade(value)
  return (
    <span
      className={`grade ${size === 'sm' ? 'sm' : ''} ${g === 'C' ? 'dark' : ''}`}
      style={{ background: gradeColor(g) }}
      aria-label={`Nutri-Score ${g || 'not available'}`}
    >
      {g || '–'}
    </span>
  )
}

// The signature element: the A–E ladder settling on this product's grade.
export function Ladder({ value, size = 'md' }) {
  const g = normGrade(value)
  return (
    <div className={`ladder ${size === 'sm' ? 'ladder-sm' : ''}`} role="img" aria-label={`Nutri-Score ${g || 'not available'}`}>
      {Object.keys(NS_COLORS).map((k, i) => (
        <span
          key={k}
          className={`ladder-cell ${k === g ? 'on' : ''} ${k === 'C' ? 'dark' : ''}`}
          style={{ '--cell': NS_COLORS[k], animationDelay: `${i * 55}ms${k === g ? `, ${450 + i * 55}ms` : ''}` }}
        >
          {k}
        </span>
      ))}
    </div>
  )
}

export function Nova({ group }) {
  const n = Number(group)
  return (
    <span className="nova" aria-label={`NOVA group ${n || 'unknown'}`}>
      <span className="nova-k">NOVA</span>
      <span className="nova-v" style={{ background: NOVA_COLORS[n] || '#A7B2A9' }}>{n || '?'}</span>
    </span>
  )
}

// ── Sliding indicators ────────────────────────────────────────────────────────
function useIndicator(active, selector) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0, h: 0, ready: false })
  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current?.querySelector(selector)
      if (!el) return
      setPos({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, ready: true })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [active, selector])
  return [ref, pos]
}

export function Segmented({ options, value, onChange, block, tall, label }) {
  const [ref, pos] = useIndicator(value, '[aria-pressed="true"]')
  return (
    <div ref={ref} className={`seg ${block ? 'seg-block' : ''} ${tall ? 'seg-tall' : ''}`} role="group" aria-label={label}>
      <span
        className="seg-thumb"
        style={{ width: pos.w, height: pos.h, transform: `translate(${pos.x}px, ${pos.y}px)`, opacity: pos.ready ? 1 : 0 }}
      />
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.hint && <small>{o.hint}</small>}
        </button>
      ))}
    </div>
  )
}

export function Tabs({ tabs, value, onChange, label }) {
  const [ref, pos] = useIndicator(value, '[aria-selected="true"]')
  return (
    <div ref={ref} className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button key={i} role="tab" type="button" className="tab" aria-selected={value === i} onClick={() => onChange(i)}>
          {t.icon && <Icon name={t.icon} size={17} />}
          {t.label}
          {t.count > 0 && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
      <span className="tab-bar" style={{ width: pos.w, transform: `translateX(${pos.x}px)`, opacity: pos.ready ? 1 : 0 }} />
    </div>
  )
}

// ── Accordion ─────────────────────────────────────────────────────────────────
export function Accordion({ title, icon, children, defaultOpen = false, onToggle }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`acc ${open ? 'open' : ''}`}>
      <button
        type="button" className="acc-head" aria-expanded={open}
        onClick={() => { setOpen(o => !o); onToggle?.(!open) }}
      >
        <span className="row">{icon && <Icon name={icon} size={18} />}{title}</span>
        <Icon name="chevronDown" size={18} />
      </button>
      <div className="acc-body"><div><div className="acc-inner">{children}</div></div></div>
    </div>
  )
}

// ── Numbers & meters ──────────────────────────────────────────────────────────
export function CountUp({ value, decimals = 0, duration = 900, suffix = '' }) {
  const target = Number(value) || 0
  const [n, setN] = useState(reduced() ? target : 0)
  useEffect(() => {
    if (reduced()) { setN(target); return }
    let raf, start
    const from = 0
    const tick = t => {
      if (!start) start = t
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return <>{n.toFixed(decimals)}{suffix}</>
}

export function Meter({ value = 0, color = 'var(--ns-a)', lg, label }) {
  const m = useMounted()
  const w = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={`meter ${lg ? 'meter-lg' : ''}`} role="meter" aria-valuenow={w} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="meter-fill" style={{ width: m ? `${w}%` : 0, background: color }} />
    </div>
  )
}

export function SplitBar({ parts }) {
  const m = useMounted()
  const total = parts.reduce((s, p) => s + (Number(p.value) || 0), 0) || 1
  return (
    <>
      <div className="split" role="img" aria-label={parts.map(p => `${p.label} ${p.value}%`).join(', ')}>
        {parts.map(p => (
          <span key={p.label} style={{ width: m ? `${(p.value / total) * 100}%` : 0, background: p.color }} />
        ))}
      </div>
      <div className="legend">
        {parts.map(p => (
          <span key={p.label}><i style={{ background: p.color }} />{p.label} <b>{p.display ?? `${p.value}%`}</b></span>
        ))}
      </div>
    </>
  )
}

export function Ring({ value = 0, color = 'var(--ns-a)', size = 108, children }) {
  const m = useMounted()
  const r = (size - 12) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="arc" cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeDasharray={c} strokeDashoffset={m ? c * (1 - v / 100) : c}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  )
}

// ── Layout helpers ────────────────────────────────────────────────────────────
export function PageHead({ title, children, actions }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="display h1">{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  )
}

const NOTE_ICON = { good: 'check', warn: 'alert', bad: 'alert', info: 'info' }
export function Note({ tone = 'info', icon, children }) {
  return (
    <div className={`note note-${tone}`} role={tone === 'bad' ? 'alert' : undefined}>
      <Icon name={icon || NOTE_ICON[tone]} size={18} />
      <div>{children}</div>
    </div>
  )
}

export function Empty({ icon, title, children, actions }) {
  return (
    <section className="panel empty">
      <div className="empty-art"><Icon name={icon} size={44} stroke={1.5} /></div>
      <div>
        <h2 className="h2">{title}</h2>
        <p>{children}</p>
        {actions && <div className="row-wrap">{actions}</div>}
      </div>
    </section>
  )
}

// Recharts tooltip in the house style
export function ChartTip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rc-tip">
      {label != null && <div><b>{label}</b></div>}
      {payload.map(p => (
        <div key={p.dataKey}>{p.name}: {typeof p.value === 'number' ? Math.round(p.value * 10) / 10 : p.value}{unit}</div>
      ))}
    </div>
  )
}

// Demo product chips shared across pages
export const DEMO_FOODS = [
  { key: 'maggi', label: 'Maggi noodles' },
  { key: 'amul_butter', label: 'Amul butter' },
  { key: 'haldirams', label: "Haldiram's bhujia" },
  { key: 'parle_g', label: 'Parle-G' },
  { key: 'atta', label: 'Aashirvaad atta' },
  { key: 'dahi', label: 'Mother Dairy dahi' },
]

export function ProductChip({ label, onClick, loading, icon = 'lens' }) {
  return (
    <button type="button" className={`chip ${loading ? 'is-loading' : ''}`} onClick={onClick}>
      <span className="chip-grade"><Icon name={icon} size={14} stroke={2} /></span>
      {label}
    </button>
  )
}
