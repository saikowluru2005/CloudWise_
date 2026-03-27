import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { LayoutDashboard, History, Settings, LogOut, GitCompare } from 'lucide-react'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import ComparePage from './pages/Compare'
import HistoryPage from './pages/HistoryPage'
import ContextBot from './components/ContextBot'

const Sidebar = ({ onLogout }) => (
  <nav className="sidebar">
    <div style={{ paddingBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <img src="/logo.png" alt="CloudWise Logo" style={{ height: '32px', width: '32px', borderRadius: '8px', objectFit: 'cover' }} />
      <h2 style={{ background: 'var(--gradient-neon)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
        CloudWise
      </h2>
    </div>
    <Link to="/" className="nav-link"><LayoutDashboard size={20} /> Dashboard</Link>
    <Link to="/compare" className="nav-link"><GitCompare size={20} /> Compare</Link>
    <Link to="/history" className="nav-link"><History size={20} /> History</Link>
    <div style={{ flex: 1 }}></div>
    <button onClick={onLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
      <LogOut size={20} /> Logout
    </button>
  </nav>
)

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  const handleLogout = () => setToken(null)

  if (!token) {
    return <AuthPage setToken={setToken} />
  }

  return (
    <Router>
      <ContextBot />
      <div className="layout">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
