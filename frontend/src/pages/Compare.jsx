import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts'
import { GitCompare, CheckCircle } from 'lucide-react'
import { marked } from 'marked'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function ComparePage() {
  const [providers, setProviders] = useState([])
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`${API_URL}/providers`).then(res => {
      setProviders(res.data.providers)
      if (res.data.providers.length >= 2) {
        setP1(res.data.providers[0])
        setP2(res.data.providers[1])
      }
    }).catch(err => console.error(err))
  }, [])

  const handleCompare = async () => {
    if (!p1 || !p2) return
    if (p1 === p2) {
      setError("Please select two different providers.")
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/compare-providers`, { provider_1: p1, provider_2: p2 })
      setResult(res.data)
    } catch (err) {
      console.error(err)
      setError("Failed to fetch comparison.")
    } finally {
      setLoading(false)
    }
  }

  // Format data for Recharts
  const formatRadarData = () => {
    if (!result) return []
    const m1 = result.provider_1.metrics
    const m2 = result.provider_2.metrics
    
    // Normalizing ranges roughly to 0-100 to make the shapes comparable
    return [
      { subject: 'Cost Efficiency', A: (0.1 - m1.Cost)*1000, B: (0.1 - m2.Cost)*1000 }, 
      { subject: 'Latency', A: 100 - m1.Latency, B: 100 - m2.Latency }, 
      { subject: 'Throughput', A: m1.Throughput*5, B: m2.Throughput*5 },
      { subject: 'Reliability', A: (m1.Reliability - 99)*100, B: (m2.Reliability - 99)*100 }, 
      { subject: 'Security', A: m1.SecurityScore*10, B: m2.SecurityScore*10 },
      { subject: 'Eco', A: m1.Sustainability, B: m2.Sustainability }
    ]
  }

  const formatBarData = () => {
    if (!result) return []
    const m1 = result.provider_1.metrics
    const m2 = result.provider_2.metrics
    return [
      { name: 'Cost', [p1]: m1.Cost * 10, [p2]: m2.Cost * 10 },
      { name: 'Latency', [p1]: m1.Latency, [p2]: m2.Latency },
      { name: 'Throughput', [p1]: m1.Throughput * 2, [p2]: m2.Throughput * 2 },
      { name: 'Security', [p1]: m1.SecurityScore * 4, [p2]: m2.SecurityScore * 4 },
    ]
  }

  const formatAreaData = () => {
      if (!result) return []
      const m1 = result.provider_1.metrics
      const m2 = result.provider_2.metrics
      return [
        { name: 'Start', [p1]: 0, [p2]: 0 },
        { name: 'Sustainability', [p1]: m1.Sustainability, [p2]: m2.Sustainability },
        { name: 'Reliability', [p1]: m1.Reliability, [p2]: m2.Reliability },
        { name: 'End', [p1]: 100, [p2]: 100 }
      ]
  }

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GitCompare size={28} /> Provider Comparison
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>
          Run statistical differential analysis directly against static base infrastructure metrics.
        </p>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Select Opponents</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select className="input-field" value={p1} onChange={(e) => setP1(e.target.value)} style={{ flex: 1, margin: 0 }}>
            <option value="" disabled>Select Provider 1</option>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span style={{ fontWeight: 'bold', color: 'var(--color-muted)' }}>VS</span>
          <select className="input-field" value={p2} onChange={(e) => setP2(e.target.value)} style={{ flex: 1, margin: 0 }}>
             <option value="" disabled>Select Provider 2</option>
             {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn-primary" onClick={handleCompare} disabled={loading} style={{ width: '150px' }}>
            {loading ? 'Analyzing...' : 'Compare'}
          </button>
        </div>
        {error && <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
      </div>

      {result && (
        <>
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
             {/* Numerical Raw Grid */}
             <div className="glass-card">
               <h3 style={{ marginBottom: '1rem' }}>Numerical Diff</h3>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                 <thead>
                   <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                     <th style={{ padding: '8px' }}>Metric</th>
                     <th style={{ padding: '8px', color: '#10b981' }}>{p1}</th>
                     <th style={{ padding: '8px', color: '#3b82f6' }}>{p2}</th>
                   </tr>
                 </thead>
                 <tbody>
                   {Object.keys(result.provider_1.metrics).map(metric => (
                     <tr key={metric} style={{ borderBottom: '1px dashed rgba(0,0,0,0.05)' }}>
                       <td style={{ padding: '8px', fontWeight: 500 }}>{metric}</td>
                       <td style={{ padding: '8px' }}>{result.provider_1.metrics[metric]}</td>
                       <td style={{ padding: '8px' }}>{result.provider_2.metrics[metric]}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             {/* AI Verdict */}
             <div className="glass-card" style={{ border: '1px solid #8b5cf6', background: 'var(--bg-primary)' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#8b5cf6' }}>
                  <CheckCircle size={20} /> AI Architect Opinion
               </h3>
               <div style={{ lineHeight: 1.8, fontSize: '0.95rem' }} className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(result.opinion) }} />
             </div>
          </div>
          
          <h3 style={{ marginBottom: '1.5rem', marginTop: '3rem' }}>Visual Analysis</h3>
          <div className="grid-2" style={{ gap: '2rem' }}>
             <div className="glass-card" style={{ height: '350px' }}>
                 <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-muted)' }}>Parameter Variance</h4>
                 <ResponsiveContainer width="100%" height="90%">
                   <BarChart data={formatBarData()} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                     <XAxis dataKey="name" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
                     <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
                     <Tooltip contentStyle={{ background: 'var(--bg-card)' }} />
                     <Bar dataKey={p1} fill="#10b981" />
                     <Bar dataKey={p2} fill="#3b82f6" />
                   </BarChart>
                 </ResponsiveContainer>
             </div>
             
             <div className="glass-card" style={{ height: '350px' }}>
                 <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-muted)' }}>Architecture Shape</h4>
                 <ResponsiveContainer width="100%" height="90%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formatRadarData()}>
                      <PolarGrid stroke="rgba(0,0,0,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={['auto', 'auto']} tick={false} />
                      <Radar name={p1} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                      <Radar name={p2} dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                 </ResponsiveContainer>
             </div>
          </div>
          
          <div className="glass-card" style={{ height: '300px', marginTop: '2rem' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-muted)' }}>Macro Overlay</h4>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={formatAreaData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" stroke="var(--color-muted)" />
                  <YAxis stroke="var(--color-muted)" domain={['dataMin - 10', 'auto']} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)' }} />
                  <Area type="monotone" dataKey={p1} stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Area type="monotone" dataKey={p2} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
