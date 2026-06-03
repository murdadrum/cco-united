import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Volunteer & Donor Tools | CCO United',
  description: 'Recruit, manage, and retain the people who power your mission — CRM tools built for Cherokee Nation CCO nonprofit realities.',
}

export default function PeoplePage() {
  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Volunteer &amp; Donor Tools</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            Recruit, manage, and retain the people who power your mission — with CRM tools
            built for the realities of nonprofit community work.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem 4rem' }}>
          <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
              Volunteer Registration Coming Soon
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The Volunteer &amp; Donor management tools are being built for CCO United. Once live, CCO
              representatives will be able to register volunteers, track donors, and manage the people
              who power their mission — all in one place.
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
              Interested in volunteering? Contact{' '}
              <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>
              {' '}to get connected with your local CCO.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
