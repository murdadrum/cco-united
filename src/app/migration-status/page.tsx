import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ScrollTopButton from '@/components/ScrollTopButton'
import AliWidget from '@/components/AliWidget'
import { fetchMigrationStatus } from '@/lib/fetchMigrationStatus'

export const revalidate = 300

export const metadata = {
  title: 'Migration Status — CCO United',
  description: 'Live status of the Monday.com → Salesforce data migration for CCO United.',
}

function pct(sf: number, monday: number) {
  if (monday === 0) return sf > 0 ? 100 : 0
  return Math.min(100, Math.round((sf / monday) * 100))
}

function health(p: number) {
  if (p >= 90) return { label: 'On Track', color: '#2d7a2d', bg: 'rgba(45,122,45,0.15)' }
  if (p >= 50) return { label: 'In Progress', color: '#b07d12', bg: 'rgba(176,125,18,0.15)' }
  return { label: 'Needs Attention', color: '#8B1A1A', bg: 'rgba(139,26,26,0.15)' }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })
}

interface MetricCardProps {
  label: string
  mondayCount: number
  sfCount: number
  icon: string
}

function MetricCard({ label, mondayCount, sfCount, icon }: MetricCardProps) {
  const p = pct(sfCount, mondayCount)
  const h = health(p)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(200,150,12,0.2)',
      borderRadius: '12px',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.75rem' }}>{icon}</span>
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '1rem',
          color: 'var(--cn-gold)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>{label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--cn-tan)', marginBottom: '0.25rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Monday</div>
          <div style={{ fontSize: '2.25rem', fontFamily: 'Cinzel, serif', color: 'var(--cn-cream)', lineHeight: 1 }}>{mondayCount.toLocaleString()}</div>
        </div>
        <div style={{ color: 'var(--cn-gold)', fontSize: '1.5rem', opacity: 0.7 }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--cn-tan)', marginBottom: '0.25rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Salesforce</div>
          <div style={{ fontSize: '2.25rem', fontFamily: 'Cinzel, serif', color: 'var(--cn-cream)', lineHeight: 1 }}>{sfCount.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--cn-tan)', marginBottom: '0.25rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Migrated</div>
          <div style={{ fontSize: '2.25rem', fontFamily: 'Cinzel, serif', color: h.color, lineHeight: 1 }}>{p}%</div>
        </div>
      </div>

      <div>
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '999px',
          height: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            background: h.color,
            width: `${p}%`,
            height: '100%',
            borderRadius: '999px',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.3rem 0.75rem',
        borderRadius: '999px',
        background: h.bg,
        color: h.color,
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        alignSelf: 'flex-start',
      }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: h.color, display: 'inline-block',
        }} />
        {h.label}
      </div>
    </div>
  )
}

export default async function MigrationStatusPage() {
  const status = await fetchMigrationStatus()

  const overall = pct(
    status.sf.ccos + status.sf.events + status.sf.contacts,
    status.monday.ccos + status.monday.events + status.monday.ccos
  )
  const overallHealth = health(overall)

  return (
    <>
      <Nav />
      <main style={{ minHeight: '100vh', background: 'var(--cn-dark)' }}>

        {/* Hero */}
        <div style={{
          textAlign: 'center',
          padding: '5rem 1.5rem 3rem',
          borderBottom: '1px solid rgba(200,150,12,0.15)',
        }}>
          <span style={{
            display: 'inline-block',
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--cn-gold)',
            marginBottom: '1rem',
          }}>
            Monday.com → Salesforce
          </span>
          <h1 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: 'var(--cn-cream)',
            margin: '0 0 0.5rem',
            lineHeight: 1.15,
          }}>
            Migration Status
          </h1>
          <div style={{
            width: '48px', height: '3px',
            background: 'var(--cn-gold)',
            margin: '1.25rem auto',
            borderRadius: '2px',
          }} />
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            background: overallHealth.bg,
            color: overallHealth.color,
            fontSize: '0.85rem',
            fontWeight: 600,
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: overallHealth.color, display: 'inline-block',
            }} />
            Overall: {overall}% — {overallHealth.label}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--cn-tan)', opacity: 0.7 }}>
            Last updated: {fmt(status.sf.fetchedAt)} · Refreshes every 5 minutes
          </div>
        </div>

        {/* Metric Cards */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '3rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          <MetricCard
            label="CCO Organizations"
            mondayCount={status.monday.ccos}
            sfCount={status.sf.ccos}
            icon="🏛️"
          />
          <MetricCard
            label="Events"
            mondayCount={status.monday.events}
            sfCount={status.sf.events}
            icon="📅"
          />
          <MetricCard
            label="Contacts"
            mondayCount={status.monday.ccos}
            sfCount={status.sf.contacts}
            icon="👥"
          />
        </div>

        {/* System Summary */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 1.5rem 3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {[
            {
              system: 'Monday.com',
              label: 'Source System',
              color: '#0073ea',
              items: [
                { k: 'CCO Registry Board', v: status.monday.ccos.toLocaleString() + ' orgs' },
                { k: 'Events Calendar Board', v: status.monday.events.toLocaleString() + ' events' },
                { k: 'Last polled', v: fmt(status.monday.fetchedAt) },
              ],
            },
            {
              system: 'Salesforce',
              label: 'Target System',
              color: '#00a1e0',
              items: [
                { k: 'Account (CCO Orgs)', v: status.sf.ccos.toLocaleString() },
                { k: 'Event__c records', v: status.sf.events.toLocaleString() },
                { k: 'Contact records', v: status.sf.contacts.toLocaleString() },
                { k: 'Last polled', v: fmt(status.sf.fetchedAt) },
              ],
            },
          ].map(({ system, label, color, items }) => (
            <div key={system} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${color}30`,
              borderTop: `3px solid ${color}`,
              borderRadius: '8px',
              padding: '1.5rem',
            }}>
              <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: '0.4rem' }}>{label}</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-cream)', marginBottom: '1rem' }}>{system}</div>
              <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map(({ k, v }) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', gap: '1rem' }}>
                    <dt style={{ color: 'var(--cn-tan)', opacity: 0.8 }}>{k}</dt>
                    <dd style={{ color: 'var(--cn-cream)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* Jira Section */}
        <div style={{
          borderTop: '1px solid rgba(200,150,12,0.15)',
          background: 'rgba(255,255,255,0.02)',
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2 style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '1.5rem',
              color: 'var(--cn-cream)',
              marginBottom: '0.75rem',
            }}>
              Team Collaboration
            </h2>
            <p style={{ color: 'var(--cn-tan)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
              Detailed QA tracking, sprint planning, and test case management for the CCO United
              platform live on the Jira QA board. Use it to coordinate ongoing work and monitor
              individual test case status.
            </p>
            <a
              href={status.jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 2rem',
                background: 'var(--cn-crimson)',
                color: 'var(--cn-cream)',
                fontFamily: 'Cinzel, serif',
                fontSize: '0.9rem',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                borderRadius: '4px',
                transition: 'opacity 0.2s',
              }}
            >
              Open Jira QA Board ↗
            </a>
          </div>
        </div>

      </main>
      <Footer />
      <ScrollTopButton />
      <AliWidget />
    </>
  )
}
