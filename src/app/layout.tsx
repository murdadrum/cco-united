import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

const FAVICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+CiAgPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzFBMEYwQSIvPgogIDxwYXRoIGQ9Ik0xNi4wLDE2LjAgTDEzLjI3LDEwLjMyIEwxNi4wMCwyLjAwIEwxOC43MywxMC4zMiBaIiBmaWxsPSIjOEIxQTFBIiBzdHJva2U9IiNDODk2MEMiIHN0cm9rZS13aWR0aD0iMC42Ii8+PHBhdGggZD0iTTE2LjAsMTYuMCBMMTguNzMsMTAuMzIgTDI2Ljk1LDcuMjcgTDIyLjE0LDE0LjYwIFoiIGZpbGw9IiNDODk2MEMiIHN0cm9rZT0iI0M4OTYwQyIgc3Ryb2tlLXdpZHRoPSIwLjYiLz48cGF0aCBkPSJNMTYuMCwxNi4wIEwyMi4xNCwxNC42MCBMMjkuNjUsMTkuMTIgTDIwLjkzLDE5LjkzIFoiIGZpbGw9IiM0QTVFM0EiIHN0cm9rZT0iI0M4OTYwQyIgc3Ryb2tlLXdpZHRoPSIwLjYiLz48cGF0aCBkPSJNMTYuMCwxNi4wIEwyMC45MywxOS45MyBMMjIuMDcsMjguNjEgTDE2LjAwLDIyLjMwIFoiIGZpbGw9IiMyQzVGN0EiIHN0cm9rZT0iI0M4OTYwQyIgc3Ryb2tlLXdpZHRoPSIwLjYiLz48cGF0aCBkPSJNMTYuMCwxNi4wIEwxNi4wMCwyMi4zMCBMOS45MywyOC42MSBMMTEuMDcsMTkuOTMgWiIgZmlsbD0iIzdBM0I2QiIgc3Ryb2tlPSIjQzg5NjBDIiBzdHJva2Utd2lkdGg9IjAuNiIvPjxwYXRoIGQ9Ik0xNi4wLDE2LjAgTDExLjA3LDE5LjkzIEwyLjM1LDE5LjEyIEw5Ljg2LDE0LjYwIFoiIGZpbGw9IiM4QjVFMUEiIHN0cm9rZT0iI0M4OTYwQyIgc3Ryb2tlLXdpZHRoPSIwLjYiLz48cGF0aCBkPSJNMTYuMCwxNi4wIEw5Ljg2LDE0LjYwIEw1LjA1LDcuMjcgTDEzLjI3LDEwLjMyIFoiIGZpbGw9IiMxQTRBM0EiIHN0cm9rZT0iI0M4OTYwQyIgc3Ryb2tlLXdpZHRoPSIwLjYiLz4KPC9zdmc+'

export const metadata: Metadata = {
  title: 'CCO United',
  description: "CCO United — the shared digital workspace for Cherokee Nation's Community & Cultural Outreach organizations.",
  icons: { icon: FAVICON, shortcut: FAVICON },
  openGraph: {
    type: 'website',
    title: 'CCO United',
    description: 'One Platform. One Hundred Communities. Stronger Together.',
    url: 'https://cco-united.joshbarteaux.com',
    siteName: 'CCO United',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CCO United',
    description: 'One Platform. One Hundred Communities. Stronger Together.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider />
        {children}
      </body>
    </html>
  )
}
