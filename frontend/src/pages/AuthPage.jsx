import { useState } from 'react'
import axios from 'axios'
import { CloudLightning } from 'lucide-react'

// You would point this to your actual API server URL (FastAPI)
// Currently defaults to localhost:8000
const API_URL = "http://localhost:8000"

export default function AuthPage({ setToken }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        // FastAPI expects form data for OAuth2PasswordBearer
        // But we are passing JSON in our simple login model. Let's fix our FastAPI code to accept json simply, or we construct the form.
        // Wait, our backend endpoint /auth/login expects a JSON (UserCreate). 
        // Our backend code: `def login(user: UserCreate, ...)` which is JSON.
        const res = await axios.post(`${API_URL}/auth/login`, { email, password })
        setToken(res.data.access_token)
      } else {
        await axios.post(`${API_URL}/auth/signup`, { email, password })
        // Automatically login the user after successful sign up
        const res = await axios.post(`${API_URL}/auth/login`, { email, password })
        setToken(res.data.access_token)
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="CloudWise" style={{ height: '64px', width: '64px', borderRadius: '16px', marginBottom: '1rem', objectFit: 'cover' }} />
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--color-muted)' }}>CloudWise Architecture Orchestration</p>
        </div>
        
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--color-muted)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            className="btn-outline" 
            style={{ border: 'none', padding: 0 }}
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}
