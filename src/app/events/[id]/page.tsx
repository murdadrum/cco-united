import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import type { CCOEvent } from '@/lib/mondayTypes'

const QUERY = `
  query GetEvent($itemId: ID!) {
    items(ids: [$itemId]) {
      id
      name
      column_values(ids: [
        "date_mm3wkeye",
        "dropdown_mm3wv6ax",
        "dropdown_mm3w9yyc",
        "boolean_mm3wsfmn",
        "long_text_mm3wd4nk"
      ]) {
        id
        text
      }
    }
  }
`

function col(columnValues: { id: string; text: string }[], colId: string): string {
  return columnValues.find(c => c.id === colId)?.text ?? ''
}

async function fetchEvent(id: string): Promise<CCOEvent | null> {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
        'API-Version': '2023-10',
      },
      body: JSON.stringify({ query: QUERY, variables: { itemId: id } }),
      next: { revalidate: 300 },
    })

    const json = await res.json()
    const item = json?.data?.items?.[0]
    if (!item) return null

    const pubVal = col(item.column_values, 'boolean_mm3wsfmn')
    const isPublic = pubVal === 'true' || pubVal === 'v'
    if (!isPublic) return null

    return {
      id: item.id,
      name: item.name,
      date: col(item.column_values, 'date_mm3wkeye') || null,
      time: null,
      organization: col(item.column_values, 'dropdown_mm3wv6ax') || null,
      eventType: col(item.column_values, 'dropdown_mm3w9yyc') || null,
      isPublic: true,
      description: col(item.column_values, 'long_text_mm3wd4nk') || null,
    }
  } catch {
    return null
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const normalized = dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr.replace(' ', 'T')
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(normalized))
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await fetchEvent(id)
  if (!event) return { title: 'Event Not Found — CCO United' }
  return {
    title: `${event.name} — CCO United Events`,
    description: event.description
      ? event.description.slice(0, 160)
      : `${event.name} — a public event from CCO United organizations.`,
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params
  const event = await fetchEvent(id)
  if (!event) notFound()

  return (
    <>
      <Nav />
      <main className="event-detail-page">
        <div className="event-detail-hero">
          <a href="/events" className="event-back-link">← All Events</a>
          {event.eventType && (
            <span className="section-label">{event.eventType}</span>
          )}
          <h1 className="section-title">{event.name}</h1>
          <div className="gold-rule" />
          <div className="event-detail-meta">
            {event.date && (
              <span className="event-detail-date">{formatDate(event.date)}</span>
            )}
            {event.organization && (
              <span className="event-detail-org">{event.organization}</span>
            )}
          </div>
        </div>
        <div className="event-detail-body">
          {event.description && (
            <div className="event-detail-description">{event.description}</div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
