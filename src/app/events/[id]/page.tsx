import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getSfToken, invalidateSfToken } from '@/lib/sfAuth'
import type { CCOEvent } from '@/lib/mondayTypes'

const SOQL = (id: string) =>
  `SELECT Id, Name, Event_Date__c, Location__c, Event_Type__c, CCO_Organization__c, Is_Public__c, Description__c
   FROM Event__c WHERE Id = '${id}' AND Is_Public__c = true LIMIT 1`

async function fetchEvent(id: string): Promise<CCOEvent | null> {
  let token: string
  let instanceUrl: string
  try {
    ;({ token, instanceUrl } = await getSfToken())
  } catch {
    return null
  }

  try {
    const res = await fetch(
      `${instanceUrl}/services/data/v66.0/query?q=${encodeURIComponent(SOQL(id))}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 },
      }
    )

    if (res.status === 401) { invalidateSfToken(); return null }
    if (!res.ok) return null

    const json = await res.json()
    const r = json.records?.[0]
    if (!r) return null

    return {
      id: r.Id,
      name: r.Name,
      date: r.Event_Date__c ?? null,
      time: null,
      organization: r.CCO_Organization__c ?? null,
      eventType: r.Event_Type__c ?? null,
      isPublic: r.Is_Public__c,
      description: r.Description__c ?? null,
      location: r.Location__c ?? null,
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
            {event.location && (
              <span className="event-detail-location">{event.location}</span>
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
