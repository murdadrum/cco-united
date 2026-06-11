import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import RevealObserver from '@/components/RevealObserver'
import { fetchMondayVolunteers } from '@/lib/fetchMondayVolunteers'
import VolunteersGrid from './VolunteersGrid'
import VolunteerForm from './VolunteerForm'

export const metadata = {
  title: 'Volunteer Management | CCO United',
  description: 'Join the Cherokee Nation CCO United volunteer network — contribute your skills, time, and heart to our community.',
}

export default async function VolunteersPage() {
  const volunteers = await fetchMondayVolunteers()

  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Volunteer Network</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            Our volunteers are the heartbeat of CCO United — contributing skills, time, and
            dedication to strengthen Cherokee Nation communities across all 106 CCO organizations.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '1100px', padding: '2rem 1.5rem 4rem' }}>
          <VolunteersGrid volunteers={volunteers} />
        </div>

        <section id="volunteer-register" style={{ borderTop: '1px solid rgba(200,150,12,0.12)', paddingTop: '4rem', paddingBottom: '5rem' }}>
          <div className="container">
            <div className="involved-grid">
              <div className="reveal">
                <span className="section-label">Join the Network</span>
                <h2 className="section-title">Volunteer with<br /><em>CCO United</em></h2>
                <div className="gold-rule"></div>
                <p className="body-text">Volunteers are the heartbeat of Cherokee Nation's community organizations. Whether you can give a few hours a week or commit to a long-term role, your time and talents make a difference.</p>
                <div className="urgency-highlight">Every skill is needed. Every hour matters.</div>
                <p className="body-text">Register below and our volunteer coordinator will reach out to match you with opportunities across the 106 CCO organizations serving Cherokee communities.</p>
              </div>
              <div className="reveal" style={{ transitionDelay: '.15s' }}>
                <div className="form-card">
                  <VolunteerForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <RevealObserver />
    </>
  )
}
