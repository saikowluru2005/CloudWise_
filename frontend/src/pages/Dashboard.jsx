import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { Server, Zap, Shield, Activity, DollarSign, Leaf, Sparkles, TrendingUp, FileText, Download, Save, Link, Database } from 'lucide-react'


import DeploymentGuide from '../components/DeploymentGuide'
import { marked } from 'marked'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const WS_URL = import.meta.env.VITE_WS_URL === "PROD" 
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/stream` 
  : (import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/stream")

export default function Dashboard() {
  const [weights, setWeights] = useState({ Cost: 8, Latency: 7, Throughput: 5, Reliability: 9, SecurityScore: 10, Sustainability: 6 })
  const [results, setResults] = useState(null)
  const [ws, setWs] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  
  // Advanced Features State
  const [chartMode, setChartMode] = useState('bar')
  const [selectedMetric, setSelectedMetric] = useState('Cost')
  const [aiWorkload, setAiWorkload] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [growthPercent, setGrowthPercent] = useState(10)
  const [forecastData, setForecastData] = useState([])
  const [mlLoading, setMlLoading] = useState(false)
  
  // Phase 3 Features State
  const [execSummary, setExecSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  // Phase 4 Integrations
  const [targetProvider, setTargetProvider] = useState('Azure')
  const [maxCost, setMaxCost] = useState(10)
  const [inverseLoading, setInverseLoading] = useState(false)
  const [inverseResult, setInverseResult] = useState(null)
  
  const [hybridData, setHybridData] = useState(null)
  const [hybridLoading, setHybridLoading] = useState(false)
  
  const [hybridGithubUrl, setHybridGithubUrl] = useState('')
  const [hybridTerraform, setHybridTerraform] = useState('')
  const [hybridIaCLoading, setHybridIaCLoading] = useState(false)

  // 1. WebSocket Streaming Connection
  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.rankings) setResults(data.rankings)
    }
    
    setWs(socket)
    return () => socket.close()
  }, [])
  
  // Send weights whenever they change
  useEffect(() => {
     if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(weights))
     }
  }, [weights, ws])

  // UI Handlers
  const handleSlider = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: Number(val) }))
  }
  
  const handleAutoPredict = async () => {
    if(!aiWorkload) return;
    setAiLoading(true)
    try {
      const res = await axios.post(`${API_URL}/predict-weights`, { workload: aiWorkload })
      if(res.data && res.data.Cost) setWeights(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }
  
  const generateExecSummary = async () => {
    if (!results || results.length < 3) return
    setSummaryLoading(true)
    try {
      const res = await axios.post(`${API_URL}/executive-summary`, {
         p1: { name: results[0].provider, score: results[0].score.toFixed(3) },
         p2: { name: results[1].provider, score: results[1].score.toFixed(3) },
         p3: { name: results[2].provider, score: results[2].score.toFixed(3) }
      })
      setExecSummary(res.data.summary)
    } catch (err) {
      console.error(err)
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleInverseSolver = async () => {
    setInverseLoading(true)
    setInverseResult(null)
    try {
      const res = await axios.post(`${API_URL}/reverse-solver`, { provider_name: targetProvider, max_cost: Number(maxCost) })
      setInverseResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setInverseLoading(false)
    }
  }

  const handleHybrid = async () => {
    setHybridLoading(true)
    try {
      const res = await axios.post(`${API_URL}/hybrid-composition`, weights)
      setHybridData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setHybridLoading(false)
    }
  }
  
  const handleGenerateHybridIaC = async () => {
    if (!hybridData) return;
    setHybridIaCLoading(true);
    setHybridTerraform('');
    try {
      const res = await axios.post(`${API_URL}/generate-hybrid-deployment`, {
         frontend_provider: hybridData.frontend.provider,
         database_provider: hybridData.database.provider,
         github_url: hybridGithubUrl || null
      });
      setHybridTerraform(res.data.markdown);
    } catch (err) {
       console.error(err);
       setHybridTerraform("# Error\nAI Generation failed.");
    } finally {
       setHybridIaCLoading(false);
    }
  }
  
  const saveToLedger = async () => {
    if (!results) return
    try {
      await axios.post(`${API_URL}/reports/save`, {
         input_weights: weights,
         top_provider_chosen: results[0].provider
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }})
      setSaveSuccess('Saved successfully to your Ledger.')
      setTimeout(() => setSaveSuccess(''), 3000)
    } catch (err) {
      console.error(err)
    }
  }
  
  const exportPDF = async () => {
    const input = document.getElementById('dashboard-content')
    if (!input) return
    
    try {
      setPdfLoading(true)
      const canvas = await html2canvas(input, { 
        backgroundColor: '#f8fafc',
        useCORS: true,
        scale: window.devicePixelRatio || 1.5,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('Cloud_Architecture_Strategy.pdf')
    } catch (err) {
      console.error("PDF generation failed: ", err)
      alert("Failed to render PDF document. Please wait for charts to stabilize.")
    } finally {
      setPdfLoading(false)
    }
  }
  
  // Forecast Effect
  useEffect(() => {
    const fetchForecast = async () => {
      setMlLoading(true)
      try {
        const res = await axios.post(`${API_URL}/forecast-cost`, { growth_percent: Number(growthPercent) })
        const chartData = res.data.multipliers.map((mult, idx) => ({ month: `Month ${idx + 1}`, multiplier: mult.toFixed(2) }))
        setForecastData(chartData)
      } catch(err) { console.error(err) } finally { setMlLoading(false) }
    }
    const timeoutId = setTimeout(() => fetchForecast(), 500)
    return () => clearTimeout(timeoutId)
  }, [growthPercent])

  const criteriaConfig = [
    { key: 'Cost', label: 'Cost Efficiency', icon: <DollarSign size={18}/> },
    { key: 'Latency', label: 'Low Latency', icon: <Zap size={18}/> },
    { key: 'Throughput', label: 'Network Throughput', icon: <Activity size={18}/> },
    { key: 'Reliability', label: 'Uptime & Reliability', icon: <Server size={18}/> },
    { key: 'SecurityScore', label: 'Security & Compliance', icon: <Shield size={18}/> },
    { key: 'Sustainability', label: 'Carbon Efficiency', icon: <Leaf size={18} color="#10b981" /> }
  ]

  // Formats data for Area Chart Comparison
  const getAreaChartData = () => {
    if(!results || results.length < 2) return []
    const p1 = results[0]
    const p2 = results[1]
    return [
      { metric: 'Cost', [p1.provider]: p1.metrics.Cost * 10, [p2.provider]: p2.metrics.Cost * 10 },
      { metric: 'Latency', [p1.provider]: p1.metrics.Latency, [p2.provider]: p2.metrics.Latency }, 
      { metric: 'Bandwidth', [p1.provider]: p1.metrics.Throughput * 2, [p2.provider]: p2.metrics.Throughput * 2 },
      { metric: 'Uptime', [p1.provider]: p1.metrics.Reliability / 2, [p2.provider]: p2.metrics.Reliability / 2 },
      { metric: 'Security', [p1.provider]: p1.metrics.SecurityScore * 5, [p2.provider]: p2.metrics.SecurityScore * 5 },
      { metric: 'Eco', [p1.provider]: p1.metrics.Sustainability / 2, [p2.provider]: p2.metrics.Sustainability / 2 }
    ]
  }

  return (
    <div id="dashboard-content" style={{ padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="header-title">Live Composition Dashboard</h1>
          <p style={{ color: 'var(--color-muted)' }}>
            Real-time WebSocket streaming • AHP-SAW AI Architecture
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-outline" onClick={saveToLedger} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> {saveSuccess || 'Save to Ledger'}
          </button>
          <button className="btn-primary" onClick={exportPDF} disabled={pdfLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> {pdfLoading ? 'Rendering PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Parameters Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--accent-color)' }}>
             <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><Sparkles size={18} color="var(--accent-color)" /> Generative AI Auto-Configuration</h4>
             <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ flex: 1, margin: 0 }}
                  placeholder="e.g., Global E-Commerce site with heavy image traffic"
                  value={aiWorkload}
                  onChange={(e) => setAiWorkload(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAutoPredict()}
                />
                <button className="btn-primary" style={{ width: 'auto' }} onClick={handleAutoPredict} disabled={aiLoading}>
                  {aiLoading ? 'Thinking...' : 'Predict'}
                </button>
             </div>
          </div>

          {/* Reverse Goal Solver UI */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid #10b981' }}>
             <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}><Database size={18} color="#10b981" /> Mathematical Reverse Solver</h4>
             <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>Force a specific provider and budget constraints. We mathematically reverse-calculate the required latency/reliability sacrifices.</p>
             <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input type="text" className="input-field" placeholder="Target e.g. Azure" value={targetProvider} onChange={(e) => setTargetProvider(e.target.value)} style={{ flex: 1, margin: 0 }} />
                <input type="number" className="input-field" placeholder="Max $ Budget" value={maxCost} onChange={(e) => setMaxCost(e.target.value)} style={{ width: '120px', margin: 0 }} />
                <button className="btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={handleInverseSolver} disabled={inverseLoading}>
                  {inverseLoading ? 'Simulating...' : 'Solve'}
                </button>
             </div>
             {inverseResult && inverseResult.status === 'success' && (
                <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', color: '#065f46', fontSize: '0.9rem' }}>
                   <strong>Stochastic Convergence Successful!</strong><br/>
                   To safely prioritize <b>{inverseResult.winner.provider}</b>, set AHP weights to:<br/>
                   C: {inverseResult.required_weights.Cost}, L: {inverseResult.required_weights.Latency}, T: {inverseResult.required_weights.Throughput}, R: {inverseResult.required_weights.Reliability}, Sec: {inverseResult.required_weights.SecurityScore}, Sus: {inverseResult.required_weights.Sustainability}
                </div>
             )}
             {inverseResult && inverseResult.status === 'impossible' && (
                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', color: '#991b1b', fontSize: '0.9rem' }}>
                   {inverseResult.message}
                </div>
             )}
          </div>
          
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
               <h3>Live Priority Parameters</h3>
               <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
                 WebSocket Connected
               </div>
            </div>
            
            {criteriaConfig.map(crit => (
              <div key={crit.key} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: crit.key === 'Sustainability' ? '#10b981' : 'inherit' }}>
                    {crit.icon} {crit.label}
                  </span>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{weights[crit.key]}</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="10" 
                  value={weights[crit.key]} 
                  onChange={e => handleSlider(crit.key, e.target.value)} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Results Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3>Live Recommendations</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button className={`btn-outline ${chartMode === 'bar' ? 'active' : ''}`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: chartMode==='bar' ? 'rgba(59,130,246,0.2)' : 'transparent', borderColor: chartMode==='bar' ? 'var(--accent-color)' : '' }} onClick={() => setChartMode('bar')}>Bar Rank</button>
                 <button className={`btn-outline ${chartMode === 'area' ? 'active' : ''}`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: chartMode==='area' ? 'rgba(59,130,246,0.2)' : 'transparent', borderColor: chartMode==='area' ? 'var(--accent-color)' : '' }} onClick={() => setChartMode('area')}>Area Overlay</button>
                 <button className={`btn-outline ${chartMode === 'line' ? 'active' : ''}`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: chartMode==='line' ? 'rgba(59,130,246,0.2)' : 'transparent', borderColor: chartMode==='line' ? 'var(--accent-color)' : '' }} onClick={() => setChartMode('line')}>Line Trend</button>
              </div>
            </div>
            
            <div style={{ flex: 1, minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
              {results ? (
                chartMode === 'bar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }} animationDuration={400}>
                      <XAxis type="number" stroke="var(--color-muted)" domain={['auto', 'auto']} />
                      <YAxis dataKey="provider" type="category" stroke="var(--color-muted)" width={100} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)' }} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {results.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : chartMode === 'area' ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                     <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>
                       Top Provider Overlay: <strong style={{color: '#10b981'}}>{results[0].provider}</strong> vs <strong style={{color: '#3b82f6'}}>{results[1].provider}</strong>
                     </p>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getAreaChartData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                          <XAxis dataKey="metric" stroke="var(--color-muted)" />
                          <YAxis stroke="var(--color-muted)" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)' }} />
                          <Area type="monotone" dataKey={results[0].provider} stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                          <Area type="monotone" dataKey={results[1].provider} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                ) : chartMode === 'line' ? (
                   <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                         <select className="input-field" value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)} style={{ width: '250px', margin: 0, padding: '6px 12px' }}>
                            <option value="Cost">Cost ($/hr)</option>
                            <option value="Latency">Latency (ms)</option>
                            <option value="Throughput">Throughput (Gbps)</option>
                            <option value="Reliability">Reliability (%)</option>
                            <option value="SecurityScore">Security Score (1-10)</option>
                            <option value="Sustainability">Sustainability (1-100)</option>
                         </select>
                      </div>
                      <div style={{ flex: 1 }}>
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results.map(r => ({ provider: r.provider, value: r.metrics[selectedMetric] }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                               <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                               <XAxis dataKey="provider" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
                               <YAxis stroke="var(--color-muted)" domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                               <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)' }} />
                               <Line type="monotone" dataKey="value" name={selectedMetric} stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                ) : null
              ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
                    Awaiting data stream...
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* NLP Executive Summary */}
      {results && (
        <div className="glass-card" style={{ marginTop: '2rem', background: 'var(--bg-primary)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} color="var(--accent-color)" /> AI Executive Summary</h3>
              <button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem' }} onClick={generateExecSummary} disabled={summaryLoading}>
                {summaryLoading ? 'Generating...' : 'Analyze Top 3'}
              </button>
           </div>
           
           {execSummary ? (
              <div style={{ lineHeight: 1.8, color: 'var(--color-text)', padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                {execSummary}
              </div>
           ) : (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>Generate an NLP-powered explanation of our mathematical findings directly for stakeholders.</p>
           )}
        </div>
      )}
      
      {/* Forecast Engine */}
      <div className="grid-2" style={{ marginTop: '2rem' }}>
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem'}}><TrendingUp color="var(--accent-color)" /> ML Cost Projection</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1.5rem' }}>Projected 6-month compounding server costs via Linear Regression modeled on expected monthly user growth.</p>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Expected Monthly User Growth</span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{growthPercent}% / mo</span>
            </div>
            <input type="range" min="0" max="250" step="5" value={growthPercent} onChange={e => setGrowthPercent(e.target.value)} />
          </div>
        </div>
        
        <div className="glass-card" style={{ minHeight: '200px' }}>
             {mlLoading ? <div className="loader"></div> : (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                   <XAxis dataKey="month" stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
                   <YAxis stroke="var(--color-muted)" tick={{ fontSize: 12 }} />
                   <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)' }} />
                   <Line type="monotone" dataKey="multiplier" name="Cost Multiplier (x)" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-primary)' }} />
                 </LineChart>
               </ResponsiveContainer>
             )}
        </div>
      </div>
      
      {/* Deployment Pipelines */}
      {results && (
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
            Available Deployment Pipelines
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {results.slice(0, 4).map((res, i) => (
              <div key={res.provider} style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '1rem', border: i === 0 ? '1px solid #10b981' : '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: i === 0 ? '#10b981' : 'var(--color-text)' }}>#{i+1} {res.provider}</h4>
                  <div style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '12px', color: i === 0 ? '#10b981' : 'var(--color-text)' }}>
                    Score: {res.score.toFixed(3)}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1rem', lineHeight: 1.8 }}>
                  <strong>Cost:</strong> ${res.metrics.Cost.toFixed(3)}/hr<br/>
                  <strong>Uptime:</strong> {res.metrics.Reliability.toFixed(2)}%<br/>
                  <strong>Latency:</strong> {res.metrics.Latency.toFixed(1)}ms<br/>
                  <strong style={{ color: '#10b981' }}>Carbon Rating:</strong> {res.metrics.Sustainability.toFixed(1)} / 100
                </div>
                <button className={i === 0 ? "btn-primary" : "btn-outline"} style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => setSelectedProvider(res.provider)}>
                  Generate Deployment Guide
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hybrid Composition Architecture */}
      <div className="glass-card" style={{ marginTop: '2rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Link size={20} color="#8b5cf6" /> Hybrid Multi-Cloud Architecture Pipeline</h3>
             <button className="btn-outline" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }} onClick={handleHybrid} disabled={hybridLoading}>
                {hybridLoading ? 'Splitting Nodes...' : 'Generate Hybrid Split'}
             </button>
         </div>
         {hybridData && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
               <div style={{ flex: 1, padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={16} color="#3b82f6"/> Frontend Node</div>
                  Optimized for Latency/Throughput: <strong>{hybridData.frontend.provider}</strong>
               </div>
               <div style={{ flex: 1, padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={16} color="#10b981"/> Database Node</div>
                  Optimized for GuardDuty/Reliability: <strong>{hybridData.database.provider}</strong>
               </div>
            </div>
         )}
         {hybridData && (
             <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>Generate a complete multi-cloud Terraform (.tf) file bridging the {hybridData.frontend.provider} Frontend to a cross-region {hybridData.database.provider} Database cluster.</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <input type="text" className="input-field" placeholder="Optional GitHub Repo URL for Code Scanning" style={{ flex: 1, margin: 0 }} value={hybridGithubUrl} onChange={e => setHybridGithubUrl(e.target.value)} />
                   <button className="btn-primary" style={{ background: '#8b5cf6', width: 'auto' }} onClick={handleGenerateHybridIaC} disabled={hybridIaCLoading}>
                      {hybridIaCLoading ? 'Synthesizing...' : 'Generate Hybrid IaC'}
                   </button>
                </div>
                {hybridTerraform && (
                   <div style={{ marginTop: '1.5rem', background: '#0f172a', padding: '1.5rem', borderRadius: '8px', color: '#e2e8f0', border: '1px solid #475569', maxHeight: '400px', overflowY: 'auto' }}>
                      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(hybridTerraform) }} />
                   </div>
                )}
             </div>
         )}
      </div>
      
      {selectedProvider && (
         <DeploymentGuide provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
      )}
    </div>
  )
}
