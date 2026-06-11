'use client'
/* eslint-disable @next/next/no-img-element */
import { useState, useMemo } from 'react'
import type { FoodCampaign, MondayCampaign } from '@/lib/sfTypes'

// ─── Images ─────────────────────────────────────────────────────────────────

const FOOD_TYPE_IMAGES: Array<[string, string]> = [
  ['strawberry',    'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80'],
  ['fresh produce', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80'],
  ['canned',        'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80'],
  ['frozen meat',   'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80'],
  ['dairy',         'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80'],
  ['mixed',         'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'],
]

const MONDAY_CAMPAIGN_IMAGES: Array<[string, string]> = [
  ['breakfast',  'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80'],
  ['farmer',     'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80'],
  ['youth',      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80'],
  ['emergency',  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80'],
  ['meat',       'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80'],
  ['strawberry', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80'],
  ['delivery',   'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'],
]

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'

function getSfImage(foodType: string | null): string {
  if (!foodType) return DEFAULT_IMAGE
  const lc = foodType.toLowerCase()
  return FOOD_TYPE_IMAGES.find(([kw]) => lc.includes(kw))?.[1] ?? DEFAULT_IMAGE
}

function getMondayImage(name: string): string {
  const lc = name.toLowerCase()
  return MONDAY_CAMPAIGN_IMAGES.find(([kw]) => lc.includes(kw))?.[1] ?? DEFAULT_IMAGE
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  return new Date(s.length === 10 ? s + 'T00:00:00' : s)
}

function formatLong(s: string | null): string {
  if (!s) return ''
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
  }).format(parseDate(s))
}

function formatShort(s: string | null): string {
  if (!s) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parseDate(s))
}

function formatDateRange(from: string | null, to: string | null): string {
  const fmt = (s: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parseDate(s))
  if (from && to) return `${fmt(from)} – ${fmt(to)}`
  if (from) return fmt(from)
  if (to) return fmt(to)
  return ''
}

function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.classList.add('loaded')
}

// ─── Unified item type for calendar/list ─────────────────────────────────────

interface NutritionItem {
  id: string
  name: string
  date: string | null   // primary date (SF: Distribution_Date__c, Monday: timelineFrom)
  dateTo: string | null // end of range (Monday only)
  label: string | null  // food type or "Active Campaign"
  stock: number | null
  location: string | null
  organization: string | null
  image: string
  source: 'sf' | 'monday'
}

function toItems(sf: FoodCampaign[], monday: MondayCampaign[]): NutritionItem[] {
  const sfItems: NutritionItem[] = sf.map(c => ({
    id: c.id,
    name: c.name,
    date: c.date,
    dateTo: null,
    label: c.foodType,
    stock: c.quantity,
    location: c.location,
    organization: c.organization,
    image: getSfImage(c.foodType),
    source: 'sf',
  }))
  const mondayItems: NutritionItem[] = monday.map(c => ({
    id: c.id,
    name: c.name,
    date: c.timelineFrom,
    dateTo: c.timelineTo,
    label: 'Active Campaign',
    stock: c.availableStock,
    location: c.location,
    organization: c.manager,
    image: getMondayImage(c.name),
    source: 'monday',
  }))
  return [...mondayItems, ...sfItems]
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarView({ items }: { items: NutritionItem[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells: { day: number; currentMonth: boolean }[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, currentMonth: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, currentMonth: true })
  for (let d = 1; d <= 42 - cells.length; d++) cells.push({ day: d, currentMonth: false })

  const itemsByDay = useMemo(() => {
    const map: Record<string, NutritionItem[]> = {}
    for (const item of items) {
      if (!item.date) continue
      const d = parseDate(item.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString()
        if (!map[key]) map[key] = []
        map[key].push(item)
      }
    }
    return map
  }, [items, year, month])

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
    .format(new Date(year, month, 1))

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
          const dayItems = cell.currentMonth ? (itemsByDay[cell.day.toString()] ?? []) : []
          return (
            <div
              key={i}
              className={[
                'calendar-day',
                !cell.currentMonth ? 'calendar-day--other-month' : '',
                isToday ? 'calendar-day--today' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="calendar-day-number">{cell.day}</div>
              {dayItems.map(item => (
                <span key={item.id} className="calendar-event-dot">{item.name}</span>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'Cinzel, serif',
      color: 'var(--cn-gold)',
      fontSize: '1.1rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: '1.25rem',
      borderBottom: '1px solid rgba(200,150,12,0.25)',
      paddingBottom: '0.5rem',
    }}>
      {children}
    </h2>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type View = 'grid' | 'list' | 'calendar'

interface Props {
  campaigns: FoodCampaign[]
  mondayCampaigns: MondayCampaign[]
}

export default function NutritionGrid({ campaigns, mondayCampaigns }: Props) {
  const [view, setView] = useState<View>('grid')

  const allItems = useMemo(() => toItems(campaigns, mondayCampaigns), [campaigns, mondayCampaigns])

  const mondayItems = useMemo(() => allItems.filter(i => i.source === 'monday'), [allItems])
  const sfItems     = useMemo(() => allItems.filter(i => i.source === 'sf'),     [allItems])

  if (allItems.length === 0) {
    return (
      <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
          Food Distribution &amp; Member Enrollment
        </p>
        <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          The Strawberry Dispatch tracks active and planned food distribution campaigns across the Keys CCO
          service area. Member enrollment and distribution scheduling are being configured for public access.
          Check back soon for campaign dates and self-registration.
        </p>
        <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
          Need to register or inquire? Contact{' '}
          <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>
          {' '}to be connected with the Keys CCO.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* View toggle — matches events page */}
      <div className="events-controls" style={{ marginBottom: '2rem' }}>
        <div style={{ flex: 1 }} />
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

      {/* ── Grid ── */}
      {view === 'grid' && (
        <div>
          {mondayItems.length > 0 && (
            <>
              <SectionHeader>Active Campaigns</SectionHeader>
              <div className="events-grid" style={{ marginBottom: '3rem' }}>
                {mondayItems.map(item => <NutritionCard key={item.id} item={item} />)}
              </div>
            </>
          )}
          {sfItems.length > 0 && (
            <>
              {mondayItems.length > 0 && <SectionHeader>Scheduled Distributions</SectionHeader>}
              <div className="events-grid">
                {sfItems.map(item => <NutritionCard key={item.id} item={item} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── List ── */}
      {view === 'list' && (
        <div className="events-list">
          {allItems.map(item => (
            <div key={item.id} className="event-list-item">
              <span className="event-list-date">
                {item.source === 'monday'
                  ? formatShort(item.date) + (item.dateTo ? ` – ${formatShort(item.dateTo)}` : '')
                  : formatShort(item.date)}
              </span>
              <span className="event-list-title">{item.name}</span>
              <span className="event-list-org">{item.location ?? ''}</span>
              {item.label && <span className="event-list-type">{item.label}</span>}
            </div>
          ))}
        </div>
      )}

      {/* ── Calendar ── */}
      {view === 'calendar' && <CalendarView items={allItems} />}
    </>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function NutritionCard({ item }: { item: NutritionItem }) {
  const dateText = item.source === 'monday'
    ? formatDateRange(item.date, item.dateTo)
    : formatLong(item.date)

  return (
    <div className="event-card">
      <img
        className="feature-card-img"
        src={item.image}
        alt={item.label ?? item.name}
        loading="lazy"
        onLoad={onImgLoad}
        onError={onImgLoad}
      />
      <div className="feature-card-scrim" />
      <div className="event-card-body">
        {item.label && <div className="event-card-type">{item.label}</div>}
        <div className="event-card-title">{item.name}</div>
        {dateText && <div className="event-card-date">{dateText}</div>}
        {item.location && (
          <div className="event-card-date" style={{ opacity: 0.75, fontSize: '0.78rem' }}>{item.location}</div>
        )}
        {item.stock != null && (
          <div className="event-card-org" style={{ marginTop: 'auto' }}>
            {item.stock.toLocaleString()} {item.source === 'monday' ? 'units' : 'boxes'} available
            {item.organization ? ` · ${item.organization}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
