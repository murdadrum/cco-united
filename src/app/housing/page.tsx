import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Welcome Home — Housing Assistance | CCO United',
  description: 'Connect families with housing resources, assistance programs, and support services coordinated across Cherokee Nation CCO organizations.',
}

export default function HousingPage() {
  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Welcome Home</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            Connecting Cherokee Nation families with housing resources, assistance programs,
            and support services — coordinated across all CCO organizations.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem 4rem' }}>
          <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
              Housing Assistance Portal Coming Soon
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The Welcome Home housing assistance platform is being built within CCO United. It will connect
              Cherokee Nation families with available housing resources, assistance programs, and support
              services across all CCO organizations in the network.
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
              Need housing assistance now? Contact{' '}
              <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>
              {' '}to be connected with your local CCO organization.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
