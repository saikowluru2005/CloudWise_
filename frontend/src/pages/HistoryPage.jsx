import { useState, useEffect } from 'react'
import axios from 'axios'
import { Database, FileText, Download } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function HistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`${API_URL}/reports`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        setHistory(res.data.reports || [])
      } catch(err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
        <Database size={32} color="var(--accent-color)" />
        <h1 className="header-title">Historical Ledgers</h1>
      </div>
      <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>
        Track your previous real-time AHP decisions, generated templates, and saved ML configurations directly from the SQLite database.
      </p>

      <div className="glass-card" style={{ minHeight: '300px' }}>
        {loading ? (
           <div className="loader"></div>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--color-muted)' }}>No history available. Save a report from your Live Dashboard!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--color-muted)' }}>Date & Time</th>
                <th style={{ padding: '1rem 0', color: 'var(--color-muted)' }}>Action Taken</th>
                <th style={{ padding: '1rem 0', color: 'var(--color-muted)' }}>Top Choice Locked</th>
                <th style={{ padding: '1rem 0', color: 'var(--color-muted)' }}>AHP Raw Config JSON</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '1rem 0', fontSize: '0.9rem' }}>{new Date(item.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '1rem 0', fontWeight: '500', color: 'var(--color-text)' }}>{item.action_taken}</td>
                  <td style={{ padding: '1rem 0', color: '#10b981', fontWeight: 'bold' }}>#{item.id} : {item.top_provider_chosen || '-'}</td>
                  <td style={{ padding: '1rem 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                    <code style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px' }}>
                       {item.input_weights ? item.input_weights.substring(0, 40) + '...' : '-'}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
