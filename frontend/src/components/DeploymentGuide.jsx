import { useState, useEffect } from 'react'
import axios from 'axios'
import { marked } from 'marked'
import { Terminal, Box, FileCode, X, Copy, Check, GitBranch } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function DeploymentGuide({ provider, onClose }) {
  const [mode, setMode] = useState('cli') // cli, docker, iac
  const [githubUrl, setGithubUrl] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [debugError, setDebugError] = useState('')
  const [debugPatch, setDebugPatch] = useState('')
  const [debugLoading, setDebugLoading] = useState(false)

  const fetchGuide = async (deployMode) => {
    setLoading(true)
    setMarkdown('')
    try {
      const res = await axios.post(`${API_URL}/generate-deployment`, {
        provider_name: provider,
        mode: deployMode,
        github_url: githubUrl || null
      })
      setMarkdown(res.data.markdown)
    } catch (err) {
      console.error(err)
      setMarkdown('# Error\nFailed to fetch deployment guide.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch immediately on mount, and when mode changes
  useEffect(() => {
    fetchGuide(mode)
  }, [mode, provider]) // Don't fetch automatically on githubUrl change, wait for button

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDebug = async () => {
     if(!debugError || !markdown) return;
     setDebugLoading(true)
     setDebugPatch('')
     try {
       const res = await axios.post(`${API_URL}/debug-deployment`, {
         error_msg: debugError,
         initial_guide: markdown
       })
       setDebugPatch(res.data.patch)
     } catch (err) {
       console.error(err)
       setDebugPatch("AI Agent failed to connect.")
     } finally {
       setDebugLoading(false)
     }
  }

  return (
    <div className="modal-overlay open">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Deploy to {provider}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
        
        {/* GitHub Integration Input */}
        <div style={{ marginBottom: '1.5rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontWeight: 600 }}>
             <GitBranch size={18} /> Deep GitHub Integration Pipeline
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
            Paste your GitHub repository to generate context-aware deployment commands and Infrastructure-as-Code files exactly matched to your codebase.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <input 
               type="text" 
               className="input-field" 
               placeholder="https://github.com/user/repo" 
               style={{ flex: 1, margin: 0 }}
               value={githubUrl}
               onChange={(e) => setGithubUrl(e.target.value)}
             />
             <button className="btn-primary" style={{ width: 'auto' }} onClick={() => fetchGuide(mode)}>
               Analyze Repo
             </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn-outline ${mode === 'cli' ? 'active' : ''}`}
            style={{ display: 'flex', gap: '8px', alignItems: 'center', background: mode === 'cli' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', borderColor: mode === 'cli' ? 'var(--accent-color)' : 'var(--border-glass)' }}
            onClick={() => setMode('cli')}
          >
            <Terminal size={18} /> Direct CLI 
          </button>
          <button 
            className={`btn-outline ${mode === 'docker' ? 'active' : ''}`}
            style={{ display: 'flex', gap: '8px', alignItems: 'center', background: mode === 'docker' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', borderColor: mode === 'docker' ? 'var(--accent-color)' : 'var(--border-glass)' }}
            onClick={() => setMode('docker')}
          >
            <Box size={18} /> Docker Container
          </button>
          <button 
            className={`btn-outline ${mode === 'iac' ? 'active' : ''}`}
            style={{ display: 'flex', gap: '8px', alignItems: 'center', background: mode === 'iac' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', borderColor: mode === 'iac' ? 'var(--accent-color)' : 'var(--border-glass)' }}
            onClick={() => setMode('iac')}
          >
            <FileCode size={18} /> Terraform IaC Script
          </button>
        </div>
        
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', minHeight: '300px', padding: '1.5rem', border: '1px solid var(--border-glass)', position: 'relative' }}>
          {loading ? (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                <div className="loader"></div>
                <div style={{ color: 'var(--color-muted)', marginTop: '1rem' }}>
                  {githubUrl ? "Securely fetching codebase via Direct RAG..." : "Generating deployment blueprints..."}
                </div>
             </div>
          ) : (
            <>
              <button 
                onClick={handleCopy} 
                className="btn-outline" 
                style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <div 
                className="markdown-body" 
                dangerouslySetInnerHTML={{ __html: marked.parse(markdown) }} 
              />
            </>
          )}
        </div>
        
        {/* Agentic Debugging Terminal */}
        {markdown && !loading && (
          <div style={{ marginTop: '1.5rem', background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', marginBottom: '0.5rem', fontWeight: 600 }}>
              <Terminal size={18} /> Agentic Debugging Terminal
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Did a generated command fail? Paste your terminal error here. The AI will cross-reference the exact deployment blueprint it wrote and generate a hotfix patch specifically for you.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                style={{ flex: 1, padding: '0.5rem', background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', borderRadius: '4px' }}
                placeholder="Paste the Error 502, crashing log, or docker build syntax error..." 
                value={debugError}
                onChange={e => setDebugError(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDebug()}
              />
              <button 
                onClick={handleDebug} 
                className="btn-primary" 
                style={{ width: 'auto', background: '#38bdf8', color: '#0f172a' }}
                disabled={debugLoading}
              >
                {debugLoading ? 'Debugging...' : 'Analyze Error'}
              </button>
            </div>
            
            {debugPatch && (
              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid #38bdf8', color: '#f8fafc', fontSize: '0.9rem' }}>
                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(debugPatch) }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
