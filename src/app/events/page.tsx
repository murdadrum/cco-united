import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ScrollTopButton from '@/components/ScrollTopButton'
import AliWidget from '@/components/AliWidget'
import EventsClient from './EventsClient'
import type { EventsApiResponse } from '@/lib/mondayTypes'

export const revalidate = 300

export const metadata = {
  title: 'Upcoming Events — Cherokee Nation CCO United',
  description:
    'Browse upcoming public events from Cherokee Nation Community & Cultural Outreach organizations.',
}

async function fetchEvents() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/events`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data: EventsApiResponse = await res.json()
    return data.events ?? []
  } catch {
    return []
  }
}

export default async function EventsPage() {
  const events = await fetchEvents()

  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Upcoming Events</h1>
          <div className="gold-rule" />
        </div>
        <div className="container">
          <EventsClient events={events} />
        </div>
      </main>
      <Footer />
      <ScrollTopButton />
      <AliWidget />
    </>
  )
}
