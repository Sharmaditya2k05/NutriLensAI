import React, { useState, createContext, useContext, useEffect, useLayoutEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import './index.css'

import Icon from './components/Icon'
import Dashboard from './pages/Dashboard'
import Scans from './pages/Scans'
import Alternatives from './pages/Alternatives'
import Chat from './pages/Chat'
import Insights from './pages/Insights'
import About from './pages/About'
import DietPlan from './pages/DietPlan'

// ── Global App State ──────────────────────────────────────────────────────────
export const AppContext = createContext(null)
export function useApp() { return useContext(AppContext) }

const NAV_ITEMS = [
  { path: '/',             label: 'Dashboard',     short: 'Home',     icon: 'dashboard' },
  { path: '/scans',        label: 'Scan a product', short: 'Scan',    icon: 'scan' },
  { path: '/alternatives', label: 'Swaps',          short: 'Swaps',   icon: 'swap' },
  { path: '/chat',         label: 'Ask the advisor', short: 'Advisor', icon: 'chat' },
  { path: '/diet-plan',    label: 'Diet plan',      short: 'Plan',    icon: 'plan' },
  { path: '/insights',     label: 'Insights',       short: 'Insights', icon: 'insights' },
  { path: '/about',        label: 'How it works',   short: 'About',   icon: 'about' },
]

function Sidebar({ geminiConnected }) {
  const { pathname } = useLocation()
  const navRef = useRef(null)
  const [pill, setPill] = useState({ y: 0, h: 0, show: false })

  // Slide the highlight to whichever link is active
  useLayoutEffect(() => {
    const el = navRef.current?.querySelector('.nav-item.active')
    if (el) setPill({ y: el.offsetTop, h: el.offsetHeight, show: true })
    else setPill(p => ({ ...p, show: false }))
  }, [pathname])

  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand" aria-label="NutriLens home">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <span>
          <div className="brand-name">NutriLens</div>
          <div className="brand-sub">Read the label, not the ad</div>
        </span>
      </NavLink>

      <nav className="nav" ref={navRef} aria-label="Main">
        <span
          className="nav-pill"
          style={{ transform: `translateY(${pill.y}px)`, height: pill.h, opacity: pill.show ? 1 : 0 }}
        />
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="status">
        <span className={`status-dot ${geminiConnected ? 'on' : 'off'}`} aria-hidden="true" />
        {geminiConnected ? (
          <div><b>Gemini connected</b>AI explanations are on.</div>
        ) : (
          <div>
            <b>Gemini not connected</b>
            Add GEMINI_API_KEY to .env to turn on AI answers.{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a free key</a>
          </div>
        )}
      </div>
    </aside>
  )
}

function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {NAV_ITEMS.map(item => (
        <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name={item.icon} size={20} />
          {item.short}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell() {
  const [chatHistory, setChatHistory] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [altProduct, setAltProduct] = useState(null)
  const [geminiConnected, setGeminiConnected] = useState(false)
  const [scanHistory, setScanHistory] = useState([])
  const location = useLocation()
  const mainRef = useRef(null)

  // Check API health periodically
  useEffect(() => {
    const checkHealth = () => {
      fetch('/api/health')
        .then(r => r.json())
        .then(d => setGeminiConnected(!!d.gemini_key))
        .catch(() => {})
    }
    checkHealth()
    const timer = setInterval(checkHealth, 3000)
    return () => clearInterval(timer)
  }, [])

  // New page starts at the top
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }) }, [location.pathname])

  const ctx = {
    chatHistory, setChatHistory,
    selectedProduct, setSelectedProduct,
    altProduct, setAltProduct,
    scanHistory, setScanHistory,
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="shell">
        <Sidebar geminiConnected={geminiConnected} />
        <main className="main" ref={mainRef}>
          <div className="page">
            <div className="route" key={location.pathname}>
              <Routes location={location}>
                <Route path="/"             element={<Dashboard />} />
                <Route path="/scans"        element={<Scans />} />
                <Route path="/alternatives" element={<Alternatives />} />
                <Route path="/chat"         element={<Chat />} />
                <Route path="/diet-plan"    element={<DietPlan />} />
                <Route path="/insights"     element={<Insights />} />
                <Route path="/about"        element={<About />} />
              </Routes>
            </div>
          </div>
        </main>
        <TabBar />
      </div>
    </AppContext.Provider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
