import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import './index.css'

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
  { path: '/',            label: 'Dashboard',       icon: '📊' },
  { path: '/scans',       label: 'My Scans',        icon: '🔍' },
  { path: '/alternatives',label: 'Alternatives',    icon: '↔️' },
  { path: '/chat',        label: 'Advisor Chat',    icon: '💬' },
  { path: '/diet-plan',   label: 'Diet Plan',       icon: '🥗' },
  { path: '/insights',    label: 'Health Insights', icon: '📈' },
  { path: '/about',       label: 'About & ML',      icon: '⚙️' },
]

function Sidebar({ geminiConnected }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">NutriLens<br />AI</div>
        <div className="sidebar-logo-sub">Expert Food Analysis</div>
      </div>
      <div className="sidebar-spacer" />
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span>{item.icon}</span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <hr className="sidebar-divider" />
      <div className="sidebar-key-status">
        {geminiConnected
          ? <span style={{ color: '#15803D' }}>✅ Gemini AI connected</span>
          : <span style={{ color: '#D97706' }}>
              ⚠ Add Gemini key to .env<br />
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>Get free key →</a>
            </span>
        }
      </div>
    </aside>
  )
}

function AppInner() {
  const [chatHistory, setChatHistory] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [altProduct, setAltProduct] = useState(null)
  const [geminiConnected, setGeminiConnected] = useState(false)
  const [scanHistory, setScanHistory] = useState([])

  // Check API health periodically
  React.useEffect(() => {
    const checkHealth = () => {
      fetch('/api/health')
        .then(r => r.json())
        .then(d => setGeminiConnected(d.gemini_key))
        .catch(() => {})
    }
    checkHealth()
    const timer = setInterval(checkHealth, 3000)
    return () => clearInterval(timer)
  }, [])

  const ctx = {
    chatHistory, setChatHistory,
    selectedProduct, setSelectedProduct,
    altProduct, setAltProduct,
    scanHistory, setScanHistory,
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="app-layout">
        <Sidebar geminiConnected={geminiConnected} />
        <div className="content-wrapper">
          <div className="main-content">
            <Routes>
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
      </div>
    </AppContext.Provider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
