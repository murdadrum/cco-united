import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Certifications & LMS | CCO United',
  description: 'NonprofitReady integration for Cherokee Nation CCO volunteer and staff development — grants, fundraising, leadership, and board essentials.',
}

export default function LearningPage() {
  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Certifications &amp; LMS</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            Professional development for CCO volunteers and staff — grants, fundraising,
            leadership, and board governance through our NonprofitReady integration.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem 4rem' }}>
          <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
              Learning Platform Coming Soon
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The CCO United Learning Management System is being configured with curated certification
              paths for Cherokee Nation CCO volunteers and staff. Courses will cover grant writing,
              fundraising, leadership, and board governance essentials.
            </p>
            <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
              Questions about training opportunities? Contact{' '}
              <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
