'use client'
import { useState } from 'react'
import type { MondayGrant, MondayGrantProvider } from '@/lib/sfTypes'

// ─── Status colors matching Monday.com pipeline ──────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  'New':           '#216edf',
  'Working on it': '#fdab3d',
  'Submitted':     '#784bd1',
  'Awarded':       '#00c875',
  'Declined':      '#df2f4a',
}

function statusColor(status: string | null): string {
  return status ? (STATUS_COLORS[status] ?? '#888') : '#888'
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(s: string | null): string {
  if (!s) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(s + 'T00:00:00'))
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'Cinzel, serif',
      color: 'var(--cn-gold)',
      fontSize: '1.1rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: '1.25rem',
      borderBottom: '1px solid rgba(200,150,12,0.25)',
      paddingBottom: '0.5rem',
    }}>
      {children}
    </h2>
  )
}

// ─── Grant card ───────────────────────────────────────────────────────────────

const GRANT_IMAGES = [
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
  'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
]

function grantImage(index: number): string {
  return GRANT_IMAGES[index % GRANT_IMAGES.length]
}

function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.classList.add('loaded')
}

function GrantCard({ grant, index }: { grant: MondayGrant; index: number }) {
  const color = statusColor(grant.status)
  return (
    <div className="event-card">
      <img
        className="feature-card-img"
        src={grantImage(index)}
        alt={grant.name}
        loading="lazy"
        onLoad={onImgLoad}
        onError={onImgLoad}
      />
      <div className="feature-card-scrim" />
      <div className="event-card-body">
        {grant.status && (
          <div className="event-card-type" style={{ background: color, borderColor: color }}>
            {grant.status}
          </div>
        )}
        <div className="event-card-title">{grant.name}</div>
        {grant.dueDate && (
          <div className="event-card-date">Due {formatDate(grant.dueDate)}</div>
        )}
        {grant.amount != null && (
          <div className="event-card-date" style={{ color: 'var(--cn-gold-light)', fontWeight: 600 }}>
            ${grant.amount.toLocaleString()}
          </div>
        )}
        {grant.provider && (
          <div className="event-card-org">{grant.provider}</div>
        )}
      </div>
    </div>
  )
}

// ─── Provider card ────────────────────────────────────────────────────────────

function ProviderCard({ provider }: { provider: MondayGrantProvider }) {
  return (
    <div className="form-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-gold)', fontSize: '1rem', marginBottom: '0.25rem' }}>
        {provider.name}
      </div>
      {provider.contact && (
        <div style={{ color: 'var(--cn-cream)', fontSize: '0.88rem' }}>{provider.contact}</div>
      )}
      {provider.phone && (
        <a href={`tel:${provider.phone}`} style={{ color: 'var(--cn-tan)', fontSize: '0.85rem', textDecoration: 'none' }}>
          {provider.phone}
        </a>
      )}
      {provider.email && (
        <a href={`mailto:${provider.email}`} style={{ color: 'var(--cn-gold-light)', fontSize: '0.85rem', textDecoration: 'none' }}>
          {provider.email}
        </a>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type View = 'grid' | 'list'

interface Props {
  grants: MondayGrant[]
  providers: MondayGrantProvider[]
}

export default function GrantsGrid({ grants, providers }: Props) {
  const [view, setView] = useState<View>('grid')

  const activeGrants    = grants.filter(g => g.group === 'Active Grants')
  const submittedGrants = grants.filter(g => g.group !== 'Active Grants')

  if (grants.length === 0) {
    return (
      <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
          Grants Pipeline Coming Soon
        </p>
        <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          The Grant Management Pipeline is being configured in the CCO United platform. CCO representatives
          will be able to submit grant opportunities, track applications, and collaborate with other organizations.
        </p>
        <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
          To submit a grant opportunity now, contact{' '}
          <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* View toggle */}
      <div className="events-controls" style={{ marginBottom: '2rem' }}>
        <div style={{ flex: 1 }} />
        <div className="view-toggle" role="group" aria-label="View style">
          {(['grid', 'list'] as View[]).map(v => (
            <button
              key={v}
              className={`view-toggle-btn${view === v ? ' view-toggle-btn--active' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'grid' ? 'Grid' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {view === 'grid' && (
        <div>
          {activeGrants.length > 0 && (
            <>
              <SectionHeader>Active Grants</SectionHeader>
              <div className="events-grid" style={{ marginBottom: '3rem' }}>
                {activeGrants.map((g, i) => <GrantCard key={g.id} grant={g} index={i} />)}
              </div>
            </>
          )}
          {submittedGrants.length > 0 && (
            <>
              <SectionHeader>Submitted Grants</SectionHeader>
              <div className="events-grid">
                {submittedGrants.map((g, i) => <GrantCard key={g.id} grant={g} index={i + activeGrants.length} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── List ── */}
      {view === 'list' && (
        <div className="events-list">
          {grants.map(g => (
            <div key={g.id} className="event-list-item">
              <span className="event-list-date">
                {g.amount != null ? `$${g.amount.toLocaleString()}` : '—'}
              </span>
              <span className="event-list-title">{g.name}</span>
              <span className="event-list-org">{g.provider ?? ''}</span>
              {g.status && (
                <span
                  className="event-list-type"
                  style={{ background: statusColor(g.status), borderColor: statusColor(g.status), color: '#fff' }}
                >
                  {g.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Grant Providers ── */}
      {providers.length > 0 && (
        <div style={{ marginTop: '3.5rem' }}>
          <SectionHeader>Grant Providers</SectionHeader>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}>
            {providers.map(p => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </div>
      )}
    </>
  )
}
