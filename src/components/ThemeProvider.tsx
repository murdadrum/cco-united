'use client'
import { useEffect } from 'react'

export default function ThemeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem('ccou-theme')
    if (saved === 'light') document.body.classList.add('light')
  }, [])
  return null
}
