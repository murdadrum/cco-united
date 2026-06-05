'use client'
import { useState, useMemo } from 'react'
import type { CCOEvent } from '@/lib/sfTypes'

type View = 'grid' | 'list' | 'calendar'

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseDateStr(dateStr: string): Date {
  // SF returns "2026-06-15" or ISO datetime — normalize to local midnight
  const normalized = dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr.replace(' ', 'T')
  return new Date(normalized)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parseDateStr(dateStr))
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parseDateStr(dateStr))
}

function CalendarView({ events }: { events: CCOEvent[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells: { day: number; currentMonth: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, currentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false })
  }

  const eventsByDay = useMemo(() => {
    const map: Record<string, CCOEvent[]> = {}
    for (const ev of events) {
      if (!ev.date) continue
      const d = parseDateStr(ev.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString()
        if (!map[key]) map[key] = []
        map[key].push(ev)
      }
    }
    return map
  }, [events, year, month])

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1)
  )

  return (
    <div className="events-calendar">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">‹</button>
        <span className="calendar-month-label">{monthLabel}</span>
        <button className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">›</button>
      </div>
      <div className="calendar-grid">
        {DAY_HEADERS.map(h => (
          <div key={h} className="calendar-day-header">{h}</div>
        ))}
        {cells.map((cell, i) => {
          const isToday =
            cell.currentMonth &&
            cell.day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
          const dayEvents = cell.currentMonth ? (eventsByDay[cell.day.toString()] ?? []) : []
          return (
            <div
              key={i}
              className={[
                'calendar-day',
                !cell.currentMonth ? 'calendar-day--other-month' : '',
                isToday ? 'calendar-day--today' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="calendar-day-number">{cell.day}</div>
              {dayEvents.map(ev => (
                <a key={ev.id} href={`/events/${ev.id}`} className="calendar-event-dot">
                  {ev.name}
                </a>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EventsClient({ events }: { events: CCOEvent[] }) {
  const [view, setView] = useState<View>('list')
  const [filterOrg, setFilterOrg] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribeName, setSubscribeName] = useState('')
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const uniqueOrgs = useMemo(
    () => Array.from(new Set(events.map(e => e.organization).filter(Boolean)))
      .filter(org => org !== '(Register a new CCO)')
      .sort() as string[],
    [events]
  )
  const uniqueTypes = useMemo(
    () => Array.from(new Set(events.map(e => e.eventType).filter(Boolean))).sort() as string[],
    [events]
  )

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (filterOrg && ev.organization !== filterOrg) return false
      if (filterType && ev.eventType !== filterType) return false
      if (filterDateFrom && ev.date && ev.date.slice(0, 10) < filterDateFrom) return false
      if (filterDateTo && ev.date && ev.date.slice(0, 10) > filterDateTo) return false
      return true
    })
  }, [events, filterOrg, filterType, filterDateFrom, filterDateTo])

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!subscribeEmail) return
    setSubscribeStatus('submitting')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail, name: subscribeName }),
      })
      setSubscribeStatus(res.ok ? 'success' : 'error')
    } catch {
      setSubscribeStatus('error')
    }
  }

  return (
    <>
      <div className="events-controls">
        <div className="events-filters">
          <span className="events-filters-label">Filter:</span>
          <select
            className="events-filter-select"
            value={filterOrg}
            onChange={e => setFilterOrg(e.target.value)}
            aria-label="Filter by organization"
          >
            <option value="">All Organizations</option>
            {uniqueOrgs.map(org => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>
          <select
            className="events-filter-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            aria-label="Filter by event type"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="date"
            className="events-filter-date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            aria-label="From date"
            title="From date"
          />
          <span className="events-filters-label">to</span>
          <input
            type="date"
            className="events-filter-date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            aria-label="To date"
            title="To date"
          />
        </div>
        <div className="view-toggle" role="group" aria-label="View style">
          {(['grid', 'list', 'calendar'] as View[]).map(v => (
            <button
              key={v}
              className={`view-toggle-btn${view === v ? ' view-toggle-btn--active' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'grid' ? 'Grid' : v === 'list' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="events-empty">No upcoming events match your filters.</div>
      )}

      {view === 'grid' && filteredEvents.length > 0 && (
        <div className="events-grid">
          {filteredEvents.map(ev => (
            <a key={ev.id} href={`/events/${ev.id}`} className="event-card">
              {ev.eventType && <div className="event-card-type">{ev.eventType}</div>}
              <div className="event-card-title">{ev.name}</div>
              {ev.date && <div className="event-card-date">{formatDate(ev.date)}</div>}
              {ev.organization && <div className="event-card-org">{ev.organization}</div>}
            </a>
          ))}
        </div>
      )}

      {view === 'list' && filteredEvents.length > 0 && (
        <div className="events-list">
          {filteredEvents.map(ev => (
            <a key={ev.id} href={`/events/${ev.id}`} className="event-list-item">
              <span className="event-list-date">{formatShortDate(ev.date)}</span>
              <span className="event-list-title">{ev.name}</span>
              <span className="event-list-org">{ev.organization ?? ''}</span>
              {ev.eventType && <span className="event-list-type">{ev.eventType}</span>}
            </a>
          ))}
        </div>
      )}

      {view === 'calendar' && (
        <CalendarView events={filteredEvents} />
      )}

      <section className="events-subscribe">
        <div className="events-subscribe-copy">
          <span className="section-label">Stay Connected</span>
          <h2 className="section-title">Get Event Updates</h2>
          <p>
            Subscribe to receive notifications about upcoming CCO United
            organization events open to the public.
          </p>
          <a href="/events/submit" className="btn-outline" style={{ marginTop: '1.25rem', display: 'inline-block' }}>
            Submit an Event →
          </a>
        </div>
        <div className="subscribe-form">
          {subscribeStatus === 'success' ? (
            <div className="subscribe-success">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>✶</div>
              You&apos;re subscribed. Wado!
            </div>
          ) : (
            <form onSubmit={handleSubscribe}>
              <div className="form-group">
                <label>Name (optional)</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={subscribeName}
                  onChange={e => setSubscribeName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email Address <span style={{ color: '#D45C5C' }}>*</span></label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={subscribeEmail}
                  onChange={e => setSubscribeEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-submit"
                disabled={subscribeStatus === 'submitting'}
              >
                {subscribeStatus === 'submitting' ? 'Subscribing…' : 'Subscribe'}
              </button>
              {subscribeStatus === 'error' && (
                <p className="subscribe-error">Something went wrong. Please try again.</p>
              )}
            </form>
          )}
        </div>
      </section>
    </>
  )
}
