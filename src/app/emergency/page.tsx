import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Emergency & Disaster Readiness | CCO United',
  description: 'Centralized directory for emergency contacts, personnel, volunteers, resources, policies, and protocols across Cherokee Nation CCO organizations.',
}

export default function EmergencyPage() {
  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Disaster Readiness</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            Centralized directory for emergency contacts, personnel, volunteers, resources,
            policies, and protocols — coordinated across Cherokee Nation CCO organizations.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem 4rem' }}>
          <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
              Emergency Readiness Directory Coming Soon
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The Emergency &amp; Disaster Readiness board is being built for CCO United. CCO organizations
              will be able to register emergency contacts, document resources, and coordinate disaster
              response protocols across the Cherokee Nation network.
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
              For urgent emergency coordination, contact{' '}
              <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
