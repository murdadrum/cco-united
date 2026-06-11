import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import AliWidget from '@/components/AliWidget'
import ScrollTopButton from '@/components/ScrollTopButton'
import NutritionGrid from './NutritionGrid'
import { fetchNutritionCampaigns } from '@/lib/fetchNutrition'
import { fetchMondayNutritionCampaigns } from '@/lib/fetchMondayNutrition'

export const revalidate = 300

export const metadata = {
  title: 'The Strawberry Dispatch — Nutrition & Food Distribution | CCO United',
  description: 'Cherokee Nation Keys CCO food distribution campaigns, member intake, and nutritional support programs through CCO United.',
}

export default async function NutritionPage() {
  const [campaigns, mondayCampaigns] = await Promise.all([
    fetchNutritionCampaigns(),
    fetchMondayNutritionCampaigns(),
  ])

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

        <div className="container" style={{ maxWidth: '1200px', padding: '2rem 1.5rem 4rem' }}>
          <NutritionGrid campaigns={campaigns} mondayCampaigns={mondayCampaigns} />
        </div>
      </main>
      <Footer />
      <ScrollTopButton />
      <AliWidget />
    </>
  )
}
