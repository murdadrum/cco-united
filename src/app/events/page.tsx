import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ScrollTopButton from '@/components/ScrollTopButton'
import AliWidget from '@/components/AliWidget'
import EventsClient from './EventsClient'
import { fetchPublicEvents } from '@/lib/fetchEvents'

export const revalidate = 300

export const metadata = {
  title: 'Upcoming Events — CCO United',
  description:
    'Browse upcoming public events from Cherokee Nation Community & Cultural Outreach organizations.',
}

export default async function EventsPage() {
  const events = await fetchPublicEvents()

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
