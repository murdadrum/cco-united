"use client"
import { useState, useRef, useEffect, useCallback } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

export default function AliWidget() {
  const [collapsed, setCollapsed] = useState(true)
  const [hist, setHist] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setHist([{ role: 'assistant', content: 'Osiyo! I’m Alisdelisgi, the CCO United AI assistant. Ask me anything about the platform, Cherokee Nation’s CCO organizations, or how we can help your community.' }])
  }, [])

  const scrollToBottom = () => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }

  useEffect(() => { scrollToBottom() }, [hist])

  const sendMsg = useCallback(async () => {
    const input = inputRef.current
    if (!input) return
    const text = input.value.trim()
    if (!text || streaming) return
    input.value = ''
    input.style.height = 'auto'
    const userMsg: Message = { role: 'user', content: text }
    const newHist = [...hist, userMsg]
    setHist([...newHist, { role: 'assistant', content: '…' }])
    setStreaming(true)

    let out = ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHist }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
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
              setHist([...newHist, { role: 'assistant', content: out }])
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      console.error('Alis chat error', err)
      out = 'Something went wrong. Please try again.'
      setHist([...newHist, { role: 'assistant', content: out }])
    } finally {
      setStreaming(false)
      if (out) setHist([...newHist, { role: 'assistant', content: out }])
    }
  }, [hist, streaming])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
  }

  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 120) + 'px'
  }

  return (
    <div
      id="ali-widget"
      style={{ maxHeight: collapsed ? '54px' : '520px' }}
    >
      <div id="ali-header" onClick={() => setCollapsed(c => !c)}>
        <div>
          <div className="ali-hname">Alisdelisgi · ᎠᎵᏍᏓᎵᏍᎩ</div>
          <div className="ali-hsub">Uh-lee-s-deh-lee-s-gee</div>
          <div className="ali-hsub">&ldquo;One who helps&rdquo;</div>
        </div>
        <div className="ali-hright">
          <div className="ali-hdot"></div>
          <button
            id="ali-toggle"
            aria-label={collapsed ? 'Expand chat' : 'Collapse chat'}
            onClick={e => { e.stopPropagation(); setCollapsed(c => !c) }}
          >{collapsed ? '+' : '−'}</button>
        </div>
      </div>
      <div id="ali-msgs" ref={msgsRef} style={{ display: collapsed ? 'none' : 'flex' }}>
        {hist.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '.55rem .85rem',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              fontSize: '.9rem',
              lineHeight: 1.55,
              background: m.role === 'user' ? '#C8960C' : 'rgba(255,255,255,0.06)',
              color: m.role === 'user' ? '#1A0F0A' : '#F5EDD8',
            }}
          >{m.content}</div>
        ))}
      </div>
      <div id="ali-row" style={{ display: collapsed ? 'none' : 'flex' }}>
        <textarea
          id="ali-input"
          ref={inputRef}
          placeholder="Ask Alisdelisgi…"
          rows={1}
          onKeyDown={onKeyDown}
          onInput={onInput}
        />
        <button id="ali-send" onClick={sendMsg} disabled={streaming} aria-label="Send message">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M15 8L1 1l3 7-3 7 14-7z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
