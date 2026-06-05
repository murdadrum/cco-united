'use client'
import { useEffect, useRef } from 'react'

export default function ScrollTopButton() {
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return
    const onScroll = () => btn.classList.toggle('visible', window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      id="scroll-top"
      ref={btnRef}
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >↑</button>
  )
}
