import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { fetchMondayGrants, fetchMondayGrantProviders } from '@/lib/fetchMondayGrants'
import GrantsGrid from './GrantsGrid'

export const metadata = {
  title: 'Grant Management Pipeline | CCO United',
  description: 'Track, collaborate on, and win more grants together across all Cherokee Nation CCO organizations.',
}

export default async function GrantsPage() {
  const [grants, providers] = await Promise.all([
    fetchMondayGrants(),
    fetchMondayGrantProviders(),
  ])

  return (
    <>
      <Nav />
      <main className="events-page">
        <div className="events-hero">
          <span className="section-label">Community &amp; Cultural Outreach</span>
          <h1 className="section-title">Grant Management Pipeline</h1>
          <div className="gold-rule" />
          <p style={{
            color: 'var(--cn-cream)',
            opacity: 0.8,
            maxWidth: '560px',
            margin: '1rem auto 0',
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}>
            Shared grant history, requirements, and workflows across all member organizations.
            Track opportunities, collaborate, and win more grants together.
          </p>
        </div>
        <div className="container" style={{ maxWidth: '1100px', padding: '2rem 1.5rem 4rem' }}>
          <GrantsGrid grants={grants} providers={providers} />
        </div>
      </main>
      <Footer />
    </>
  )
}
