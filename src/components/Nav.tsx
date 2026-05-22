'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const CLAN = ['#8B1A1A','#C8960C','#4A5E3A','#2C5F7A','#7A3B6B','#8B5E1A','#1A4A3A']

function starSegs(cx: number, cy: number, R: number, r: number, n: number) {
  const pts: string[] = []
  for (let i = 0; i < n * 2; i++) {
    const angle = (Math.PI / n) * i - Math.PI / 2
    const rad = i % 2 === 0 ? R : r
    pts.push(`${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

const NAV_ITEMS = [
  { href: '#about', label: 'About the Nation' },
  { href: '#government', label: 'Government' },
  { href: '#services', label: 'Services' },
  { href: '#news', label: 'News' },
  { href: '#get-involved', label: 'Get Involved' },
]

const CCO_LINK = 'https://cco-united.joshbarteaux.com'

export default function Nav() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('hero')

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const n = 7, cx = 14, cy = 14, R = 13, r = 5.5
    for (let i = 0; i < n; i++) {
      const a1 = (Math.PI * 2 / n) * i - Math.PI / 2
      const a2 = (Math.PI * 2 / n) * (i + 1) - Math.PI / 2
      const am = (a1 + a2) / 2
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', `M${cx},${cy} L${cx+R*Math.cos(a1)},${cy+R*Math.sin(a1)} L${cx+R*Math.cos(am)*0.42+cx*0},${cy+R*Math.sin(am)*0.42} Z`)
      path.setAttribute('fill', CLAN[i])
      svg.appendChild(path)
    }
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    poly.setAttribute('points', starSegs(cx, cy, R, r, n))
    poly.setAttribute('fill', 'none')
    poly.setAttribute('stroke', 'rgba(255,255,255,0.08)')
    poly.setAttribute('stroke-width', '0.5')
    svg.appendChild(poly)
  }, [])

  useEffect(() => {
    const sections = ['hero','about','government','services','news','cco-united','get-involved']
    const onScroll = () => {
      let current = 'hero'
      sections.forEach(id => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) current = id
      })
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close flyout on Escape or outside click
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  // Prevent body scroll when flyout is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <nav>
        <a href="#hero" className="nav-brand">
          <svg className="nav-star-svg" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" ref={svgRef}></svg>
          <span className="nav-logo">Cherokee Nation</span>
        </a>
        <div className="nav-links">
          {NAV_ITEMS.map(({ href, label }) => (
            <a key={href} href={href} className={active === href.slice(1) ? 'nav-active' : ''}>
              {label}
            </a>
          ))}
          <a href={CCO_LINK} target="_blank" rel="noopener noreferrer" className="nav-cco-link">
            CCO United ↗
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="#get-involved" className="btn-nav">Contact Us</a>
          <button
            className="nav-hamburger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            <span className={`nav-hamburger-bar${open ? ' open' : ''}`} />
            <span className={`nav-hamburger-bar${open ? ' open' : ''}`} />
            <span className={`nav-hamburger-bar${open ? ' open' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      {open && (
        <div className="nav-flyout-backdrop" onClick={close} aria-hidden="true" />
      )}

      {/* Flyout drawer */}
      <div className={`nav-flyout${open ? ' nav-flyout-open' : ''}`} aria-hidden={!open}>
        <nav className="nav-flyout-links">
          {NAV_ITEMS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={active === href.slice(1) ? 'nav-active' : ''}
              onClick={close}
            >
              {label}
            </a>
          ))}
          <a href={CCO_LINK} target="_blank" rel="noopener noreferrer" className="nav-flyout-cco" onClick={close}>
            CCO United ↗
          </a>
          <a href="#get-involved" className="btn-nav nav-flyout-cta" onClick={close}>
            Contact Us
          </a>
        </nav>
      </div>
    </>
  )
}
