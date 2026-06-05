'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  { hash: 'about', label: 'About' },
  { hash: 'building', label: 'Platform' },
  { hash: 'get-involved', label: 'Get Involved' },
]

export default function Nav() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('hero')

  const close = useCallback(() => setOpen(false), [])
  const pathname = usePathname()
  const isHome = pathname === '/'
  const navHref = (hash: string) => isHome ? `#${hash}` : `/#${hash}`

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
    const sections = ['hero', 'about', 'building', 'get-involved']
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

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <nav>
        <a href={navHref('hero')} className="nav-brand">
          <svg className="nav-star-svg" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" ref={svgRef}></svg>
          <span className="nav-logo">CCO United</span>
        </a>
        <div className="nav-links">
          {NAV_ITEMS.map(({ hash, label }) => (
            <a key={hash} href={navHref(hash)} className={isHome && active === hash ? 'nav-active' : ''}>
              {label}
            </a>
          ))}
          <Link href="/events" className={pathname.startsWith('/events') ? 'nav-active' : ''}>
            Events
          </Link>
          <Link href="/tests" className={pathname.startsWith('/tests') ? 'nav-active' : ''}>
            Tests
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href={navHref('get-involved')} className="btn-nav">Request Access</a>
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

      {open && (
        <div className="nav-flyout-backdrop" onClick={close} aria-hidden="true" />
      )}

      <div className={`nav-flyout${open ? ' nav-flyout-open' : ''}`} aria-hidden={!open}>
        <nav className="nav-flyout-links">
          {NAV_ITEMS.map(({ hash, label }) => (
            <a
              key={hash}
              href={navHref(hash)}
              className={isHome && active === hash ? 'nav-active' : ''}
              onClick={close}
            >
              {label}
            </a>
          ))}
          <Link
            href="/events"
            className={pathname.startsWith('/events') ? 'nav-active' : ''}
            onClick={close}
          >
            Events
          </Link>
          <Link
            href="/tests"
            className={pathname.startsWith('/tests') ? 'nav-active' : ''}
            onClick={close}
          >
            Tests
          </Link>
          <a href={navHref('get-involved')} className="btn-nav nav-flyout-cta" onClick={close}>
            Request Access
          </a>
        </nav>
      </div>
    </>
  )
}
