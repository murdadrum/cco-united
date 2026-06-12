'use client'
import { useEffect } from 'react'

export default function ThemeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem('ccou-theme')
    if (saved === 'light') document.body.classList.add('light')

    const toggle = () => {
      const isLight = document.body.classList.toggle('light')
      localStorage.setItem('ccou-theme', isLight ? 'light' : 'dark')
      window.dispatchEvent(new Event('ccou-theme-changed'))
    }
    window.addEventListener('ccou-toggle-theme', toggle)
    return () => window.removeEventListener('ccou-toggle-theme', toggle)
  }, [])
  return null
}
