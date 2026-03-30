import { useState, useEffect } from 'react'
import axios from 'axios'
import { Bot, X, MessageSquare } from 'lucide-react'
import { marked } from 'marked'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function ContextBot() {
  const [selectedText, setSelectedText] = useState('')
  const [tooltipPos, setTooltipPos] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  // Listen for selection event
  useEffect(() => {
    const handleMouseUp = (e) => {
      // Don't trigger if click inside the sidebar
      if (document.getElementById('bot-sidebar')?.contains(e.target)) return;

      const text = window.getSelection().toString().trim()
      if (text.length > 5) {
        setSelectedText(text)
        setTooltipPos({ x: e.pageX + 10, y: e.pageY - 30 })
      } else {
        setTooltipPos(null)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const handleAskBot = async () => {
    setTooltipPos(null)
    setSidebarOpen(true)
    
    const userMsg = { role: 'user', content: `Explain: "${selectedText}"` }
    setMessages(prev => [...prev, userMsg])
    
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/ask-bot`, { text: selectedText })
      
      const botMsg = { role: 'bot', content: res.data.answer }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'bot', content: 'Connection Error. Is the backend running?' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Tooltip near selected text */}
      {tooltipPos && (
        <div 
          className="context-bot-tooltip" 
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
          onClick={handleAskBot}
        >
          <Bot size={16} /> Ask Bot
        </div>
      )}

      {/* Floating Chat Sidebar */}
      <div id="bot-sidebar" className={`bot-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="bot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Bot color="var(--accent-color)" /> ContextBot AI
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        
        <div className="bot-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && !loading && (
             <div style={{ textAlign: 'center', color: 'var(--color-muted)', marginTop: '2rem' }}>
               <MessageSquare size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
               <p>Select any text on this page to receive intelligent contextual explanations from the AI.</p>
             </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(30,41,59,0.8)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              maxWidth: '85%',
              border: msg.role === 'bot' ? '1px solid var(--border-glass)' : 'none'
            }}>
              <div 
                className="markdown-body" 
                style={{ fontSize: '0.9rem' }}
                dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} 
              />
            </div>
          ))}
          
          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-muted)', padding: '0.75rem 1rem', background: 'rgba(30,41,59,0.5)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div className="loader" style={{ margin: 0, width: '15px', height: '15px', borderWidth: '2px' }}></div> Analyzing context...
            </div>
          )}
        </div>
      </div>
    </>
  )
}
