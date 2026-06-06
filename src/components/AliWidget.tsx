"use client"
import { useState, useRef, useEffect, useCallback } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }
type Mode = 'alis' | 'agentforce' | 'both'

const QUICK_REPLIES = [
  "What is CCO United?",
  "How do I join a CCO?",
  "Tell me about upcoming events",
  "What tools does the platform offer?",
  "How can I get involved?",
]

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} style={{ color: '#E8B84B', fontWeight: 600 }}>{part.slice(2, -2)}</span>
    }
    return <span key={i}>{part}</span>
  })
}

// ── Alis (Anthropic) streaming ────────────────────────────────────────────────
async function streamAlis(
  messages: Message[],
  onChunk: (text: string) => void
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error(`Alis API ${res.status}`)

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = '', out = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n'); buf = lines.pop()!
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const d = line.slice(6).trim()
      if (d === '[DONE]') break
      try {
        const p = JSON.parse(d)
        if (p.type === 'content_block_delta' && p.delta?.text) {
          out += p.delta.text
          onChunk(out)
        }
      } catch { /* skip */ }
    }
  }
  return out
}

// ── Agentforce streaming ──────────────────────────────────────────────────────
async function streamAgentforce(
  message: string,
  sessionId: string | null,
  onChunk: (text: string) => void,
  onSession: (id: string) => void
): Promise<string> {
  const res = await fetch('/api/agentforce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  })
  if (!res.ok) throw new Error(`Agentforce API ${res.status}`)

  const newSession = res.headers.get('X-Session-Id')
  if (newSession) onSession(newSession)

  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = '', out = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n'); buf = lines.pop()!
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const d = line.slice(6).trim()
      if (!d || d === '[DONE]') continue
      try {
        const p = JSON.parse(d)
        // Agentforce SSE: { type: 'chunk', data: { message: { text } } }
        const text = p?.data?.message?.text ?? p?.message?.text ?? p?.text ?? null
        if (text) { out += text; onChunk(out) }
      } catch { /* skip */ }
    }
  }
  return out || '(No response from agent)'
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function Bubble({ m, isAf }: { m: Message; isAf?: boolean }) {
  return (
    <div style={{
      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
      maxWidth: '88%',
      padding: '.55rem .85rem',
      borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      fontSize: '.9rem',
      lineHeight: 1.55,
      background: m.role === 'user'
        ? (isAf ? '#1a3a5c' : '#C8960C')
        : (isAf ? 'rgba(0,120,212,0.12)' : 'rgba(255,255,255,0.06)'),
      color: m.role === 'user'
        ? (isAf ? '#e8f0fe' : '#1A0F0A')
        : '#F5EDD8',
      borderLeft: isAf && m.role === 'assistant' ? '2px solid #0078d4' : undefined,
    }}>
      {m.role === 'assistant' ? renderContent(m.content) : m.content}
    </div>
  )
}

// ── Chat lane (reusable column) ────────────────────────────────────────────────
const AF_STUDIO_URL = 'https://orgfarm-f8c9044497-dev-ed.develop.lightning.force.com/AiCopilot/copilotStudio.app#/copilot/builder?copilotId=0XxgK000001fZIzSAM&versionId=0X9gK000002sFLtSAM'

function ChatLane({
  label, dot, hist, showChips, streaming, onChip,
  isAf = false,
}: {
  label: string; dot?: string; hist: Message[]; showChips: boolean;
  streaming: boolean; onChip: (q: string) => void; isAf?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [hist])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
      <div style={{
        padding: '.35rem .7rem',
        fontSize: '.72rem',
        fontFamily: "'Cinzel', serif",
        letterSpacing: '.06em',
        color: isAf ? '#60a5fa' : '#E8B84B',
        borderBottom: `1px solid ${isAf ? 'rgba(0,120,212,0.25)' : 'rgba(200,150,12,0.2)'}`,
        background: isAf ? 'rgba(0,40,80,0.4)' : 'rgba(26,15,10,0.4)',
        display: 'flex', alignItems: 'center', gap: '.4rem',
      }}>
        {dot && <span style={{ fontSize: '.6rem' }}>{dot}</span>}
        {label}
      </div>
      <div
        ref={ref}
        style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          gap: '.6rem', padding: '.85rem .75rem',
          background: isAf ? 'rgba(0,20,50,0.35)' : 'transparent',
        }}
      >
        {hist.map((m, i) => <Bubble key={i} m={m} isAf={isAf} />)}
        {isAf && hist.filter(m => m.role === 'user').length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, gap: '1rem', textAlign: 'center',
            padding: '1.5rem',
          }}>
            <div style={{ fontSize: '2rem' }}>⚡</div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: '.85rem',
              color: '#60a5fa', letterSpacing: '.06em',
            }}>
              Agentforce Enterprise
            </div>
            <div style={{
              fontSize: '.78rem', color: 'rgba(200,220,255,0.6)',
              lineHeight: 1.6, maxWidth: '200px',
            }}>
              Live agent powered by Salesforce. Tap below to launch a full session.
            </div>
            <a
              href={AF_STUDIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                padding: '.55rem 1.1rem',
                background: 'rgba(0,120,212,0.2)',
                border: '1px solid rgba(96,165,250,0.5)',
                color: '#60a5fa', borderRadius: '6px',
                fontSize: '.78rem', textDecoration: 'none',
                fontFamily: "'Source Sans 3', sans-serif",
                letterSpacing: '.04em',
              }}
            >
              Launch in Salesforce ↗
            </a>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', justifyContent: 'center' }}>
              {QUICK_REPLIES.map(q => (
                <a key={q} href={AF_STUDIO_URL} target="_blank" rel="noopener noreferrer" style={{
                  background: 'transparent', border: '1px solid rgba(96,165,250,0.35)',
                  color: '#60a5fa', borderRadius: '20px', padding: '.3rem .75rem',
                  fontSize: '.75rem', cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
                  letterSpacing: '.04em', textDecoration: 'none',
                }}>{q}</a>
              ))}
            </div>
          </div>
        )}
        {showChips && !streaming && !isAf && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', padding: '.25rem 0', alignSelf: 'flex-start' }}>
            {QUICK_REPLIES.map(q => (
              <button key={q} onClick={() => onChip(q)} style={{
                background: 'transparent', border: '1px solid rgba(200,150,12,0.45)',
                color: '#E8B84B', borderRadius: '20px', padding: '.3rem .75rem',
                fontSize: '.75rem', cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
                letterSpacing: '.04em',
              }}>{q}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main widget ────────────────────────────────────────────────────────────────
export default function AliWidget() {
  const [collapsed, setCollapsed]     = useState(true)
  const [mode, setMode]               = useState<Mode>('alis')
  const [alisHist, setAlisHist]       = useState<Message[]>([])
  const [afHist, setAfHist]           = useState<Message[]>([])
  const [showChips, setShowChips]     = useState(true)
  const [streaming, setStreaming]     = useState(false)
  const [afSessionId, setAfSessionId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setAlisHist([{ role: 'assistant', content: "Osiyo! I'm Alis — CCO United's AI assistant. Ask me anything about our platform, CCO organizations, events, or how to get involved." }])
    setAfHist([{ role: 'assistant', content: "Hello! I'm the CCO United Housing & Events Assistant powered by Agentforce. How can I help you today?" }])
  }, [])

  const sendMsg = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return
    if (inputRef.current) { inputRef.current.value = ''; inputRef.current.style.height = 'auto' }
    setShowChips(false)
    setStreaming(true)

    const userMsg: Message = { role: 'user', content: text.trim() }

    if (mode === 'alis' || mode === 'both') {
      const newHist = [...alisHist, userMsg]
      setAlisHist([...newHist, { role: 'assistant', content: '…' }])
      streamAlis(newHist, out => setAlisHist([...newHist, { role: 'assistant', content: out }]))
        .then(out => setAlisHist([...newHist, { role: 'assistant', content: out || 'Something went wrong.' }]))
        .catch(() => setAlisHist([...newHist, { role: 'assistant', content: 'Something went wrong. Please try again.' }]))
        .finally(() => { if (mode === 'alis') setStreaming(false) })
    }

    if (mode === 'agentforce' || mode === 'both') {
      const newAfHist = [...afHist, userMsg]
      setAfHist([...newAfHist, { role: 'assistant', content: '…' }])
      streamAgentforce(
        text.trim(), afSessionId,
        out => setAfHist([...newAfHist, { role: 'assistant', content: out }]),
        id => setAfSessionId(id)
      )
        .then(out => setAfHist([...newAfHist, { role: 'assistant', content: out }]))
        .catch(() => setAfHist([...newAfHist, { role: 'assistant', content: 'Agentforce unavailable. Please try again.' }]))
        .finally(() => setStreaming(false))
    }
  }, [streaming, mode, alisHist, afHist, afSessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = () => { const t = inputRef.current?.value.trim() || ''; if (t) sendMsg(t) }
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() }
  }
  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'
  }

  const widgetWidth = mode === 'both' ? '740px' : '360px'

  return (
    <div id="ali-widget" style={{ maxHeight: collapsed ? '54px' : '560px', width: widgetWidth, maxWidth: '96vw' }}>
      {/* Header */}
      <div id="ali-header" onClick={() => setCollapsed(c => !c)}>
        <div>
          <div className="ali-hname">
            {mode === 'agentforce' ? 'CCO Housing & Events Agent' : 'Alisdelisgi · ᎠᎵᏍᏓᎵᏍᎩ'}
          </div>
          <div className="ali-hsub">
            {mode === 'both' ? 'Alis + Agentforce — side by side' : mode === 'agentforce' ? 'Powered by Salesforce Agentforce' : 'Uh-lee-s-deh-lee-s-gee · "One who helps"'}
          </div>
        </div>
        <div className="ali-hright" style={{ gap: '.5rem' }}>
          {/* Mode toggle pills */}
          {!collapsed && (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '.3rem', marginRight: '.25rem' }}>
              {(['alis', 'both', 'agentforce'] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  background: mode === m ? 'rgba(200,150,12,0.25)' : 'transparent',
                  border: `1px solid ${mode === m ? '#C8960C' : 'rgba(200,150,12,0.3)'}`,
                  color: mode === m ? '#E8B84B' : 'rgba(212,184,150,0.5)',
                  borderRadius: '12px', padding: '.15rem .5rem',
                  fontSize: '.68rem', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                  letterSpacing: '.04em', transition: 'all .2s',
                }}>
                  {m === 'alis' ? 'Alis' : m === 'agentforce' ? 'AF' : '⇌'}
                </button>
              ))}
            </div>
          )}
          <div className="ali-hdot"></div>
          <button id="ali-toggle" aria-label={collapsed ? 'Expand chat' : 'Collapse chat'}
            onClick={e => { e.stopPropagation(); setCollapsed(c => !c) }}>
            {collapsed ? '+' : '−'}
          </button>
        </div>
      </div>

      {/* Message area */}
      <div id="ali-msgs" style={{
        display: collapsed ? 'none' : 'flex',
        flexDirection: 'row',
        gap: 0,
        padding: 0,
      }}>
        {(mode === 'alis' || mode === 'both') && (
          <ChatLane
            label="Alisdelisgi" dot="●"
            hist={alisHist} showChips={showChips} streaming={streaming}
            onChip={sendMsg}
          />
        )}
        {mode === 'both' && (
          <div style={{ width: '1px', background: 'rgba(200,150,12,0.15)', flexShrink: 0 }} />
        )}
        {(mode === 'agentforce' || mode === 'both') && (
          <ChatLane
            label="Agentforce" dot="◆"
            hist={afHist} showChips={showChips} streaming={streaming}
            onChip={sendMsg} isAf
          />
        )}
      </div>

      {/* Input row */}
      <div id="ali-row" style={{ display: collapsed ? 'none' : 'flex' }}>
        <textarea
          id="ali-input" ref={inputRef}
          placeholder={mode === 'both' ? 'Ask both assistants…' : mode === 'agentforce' ? 'Ask Agentforce…' : 'Ask Alisdelisgi…'}
          rows={1} onKeyDown={onKeyDown} onInput={onInput}
        />
        <button id="ali-send" onClick={onSubmit} disabled={streaming} aria-label="Send message">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M15 8L1 1l3 7-3 7 14-7z" /></svg>
        </button>
      </div>
    </div>
  )
}
