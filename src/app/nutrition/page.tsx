import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'The Strawberry Dispatch — Nutrition & Food Distribution | CCO United',
  description: 'Cherokee Nation Keys CCO food distribution campaigns, member intake, and nutritional support programs through CCO United.',
}

export default function NutritionPage() {
  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">The Strawberry Dispatch</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            Connecting Cherokee Nation community members with food distribution campaigns
            and nutritional support — coordinated by the Keys CCO.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem 4rem' }}>
          <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
              Food Distribution &amp; Member Enrollment
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The Strawberry Dispatch tracks active and planned food distribution campaigns across the Keys CCO
              service area. Community members can register to receive distributions, and campaign managers
              coordinate stock, locations, and timelines — all within CCO United.
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Member enrollment and distribution scheduling are being configured for public access.
              Check back soon for campaign dates and self-registration.
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
              Need to register or inquire about a distribution? Contact{' '}
              <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>
              {' '}to be connected with the Keys CCO.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
