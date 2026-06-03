import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import SubmitEventForm from './SubmitEventForm'

export const metadata = {
  title: 'Submit an Event | CCO United',
  description: 'Submit an upcoming event on behalf of your Cherokee Nation CCO organization.',
}

export default function SubmitEventPage() {
  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Submit an Event</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            All events are reviewed by the CCOU Admin before being published to the CN network calendar.
            Please submit as far in advance as possible.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem 4rem' }}>
          <SubmitEventForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
