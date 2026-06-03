import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Shared Resource Directory | CCO United',
  description: 'Centralized, searchable resource library across all Cherokee Nation CCO organizations — healthcare, food, housing, youth, elder services, and more.',
}

export default function ResourcesPage() {
  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Shared Resource Directory</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            A centralized, searchable library of resources shared across all CCO organizations —
            healthcare, food, housing, youth, elder services, and more.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem 4rem' }}>
          <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
              Resource Directory Coming Soon
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The Shared Resource Directory is being built in the CCO United platform. CCO representatives
              will be able to submit and manage resources for the community once the board is live.
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
              In the meantime, contact{' '}
              <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>
              {' '}to submit a resource listing.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
