'use client'
import { useEffect, useRef } from 'react'

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

export default function Nav() {
  const svgRef = useRef<SVGSVGElement>(null)

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
    const sections = ['hero','about','building','get-involved']
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-links a')
    const onScroll = () => {
      let current = 'hero'
      sections.forEach(id => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) current = id
      })
      navLinks.forEach(a => {
        a.classList.toggle('nav-active', a.getAttribute('href') === '#' + current)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav>
      <a href="#hero" className="nav-brand">
        <svg className="nav-star-svg" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" ref={svgRef}></svg>
        <span className="nav-logo">CCO United</span>
      </a>
      <div className="nav-links">
        <a href="#about">About</a>
        <a href="#building">Platform</a>
        <a href="#get-involved">Get Involved</a>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
        {/* <button id="theme-toggle" aria-label="Toggle light/dark theme">
          <span className="toggle-icon" id="toggle-icon">☀️</span>
          <span id="toggle-label">Light</span>
        </button> */}
        <a href="#get-involved" className="btn-nav">Request Access</a>
      </div>
    </nav>
  )
}
