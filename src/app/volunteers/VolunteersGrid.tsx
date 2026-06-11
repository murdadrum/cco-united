'use client'
import { useState } from 'react'
import type { MondayVolunteer } from '@/lib/sfTypes'

// ─── Status colors matching Monday.com ───────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  'New':    '#579bfc',
  'Active': '#00c875',
  'Past':   '#bca58a',
}

function statusColor(status: string | null): string {
  return status ? (STATUS_COLORS[status] ?? '#888') : '#888'
}

// ─── Date helper ──────────────────────────────────────────────────────────────

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

// ─── Volunteer avatar initials ────────────────────────────────────────────────

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const text = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'rgba(200,150,12,0.18)',
      border: '2px solid rgba(200,150,12,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Cinzel, serif',
      fontSize: '1.1rem',
      color: 'var(--cn-gold)',
      flexShrink: 0,
    }}>
      {text}
    </div>
  )
}

// ─── Skill tag ────────────────────────────────────────────────────────────────

function SkillTag({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.55rem',
      background: 'rgba(200,150,12,0.12)',
      border: '1px solid rgba(200,150,12,0.28)',
      borderRadius: '4px',
      fontSize: '0.75rem',
      color: 'var(--cn-tan)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ─── Volunteer card (grid) ────────────────────────────────────────────────────

function VolunteerCard({ volunteer }: { volunteer: MondayVolunteer }) {
  const color = statusColor(volunteer.status)
  const skillList = volunteer.skills
    ? volunteer.skills.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div className="form-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Initials name={volunteer.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--cn-cream)', fontSize: '0.95rem', lineHeight: 1.3 }}>
            {volunteer.name}
          </div>
          {volunteer.status && (
            <span style={{
              display: 'inline-block',
              marginTop: '0.3rem',
              padding: '0.15rem 0.5rem',
              background: color,
              borderRadius: '3px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '0.04em',
            }}>
              {volunteer.status}
            </span>
          )}
        </div>
      </div>

      {volunteer.hoursPerWeek && (
        <div style={{ fontSize: '0.82rem', color: 'var(--cn-tan)' }}>
          <span style={{ color: 'var(--cn-gold-light)', fontWeight: 600 }}>{volunteer.hoursPerWeek} hrs/wk</span>
          {volunteer.startDate && (
            <span style={{ marginLeft: '0.75rem', opacity: 0.75 }}>since {formatDate(volunteer.startDate)}</span>
          )}
        </div>
      )}

      {volunteer.location && (
        <div style={{ fontSize: '0.8rem', color: 'var(--cn-cream)', opacity: 0.6, lineHeight: 1.3 }}>
          {volunteer.location}
        </div>
      )}

      {skillList.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
          {skillList.map(s => <SkillTag key={s} label={s} />)}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type View = 'grid' | 'list'

interface Props {
  volunteers: MondayVolunteer[]
}

const GROUP_ORDER = ['New volunteers', 'Active volunteers', 'Past volunteers']

export default function VolunteersGrid({ volunteers }: Props) {
  const [view, setView] = useState<View>('grid')
  const [filter, setFilter] = useState<string>('All')

  const statusFilters = ['All', 'New', 'Active', 'Past']

  const filtered = filter === 'All'
    ? volunteers
    : volunteers.filter(v => v.status === filter)

  const byGroup = GROUP_ORDER.reduce<Record<string, MondayVolunteer[]>>((acc, g) => {
    const items = filtered.filter(v => v.group === g)
    if (items.length > 0) acc[g] = items
    return acc
  }, {})

  if (volunteers.length === 0) {
    return (
      <div className="form-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--cn-gold)', marginBottom: '1rem' }}>
          Volunteer Registry Coming Soon
        </p>
        <p style={{ color: 'var(--cn-cream)', opacity: 0.75, fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          The CCO United Volunteer Network is being set up. Once live, community members
          can register their skills and availability to support Cherokee Nation CCO organizations.
        </p>
        <p style={{ color: 'var(--cn-cream)', opacity: 0.6, fontSize: '0.85rem' }}>
          Interested in volunteering? Contact{' '}
          <a href="mailto:josh@joshbarteaux.com" style={{ color: 'var(--cn-gold)' }}>josh@joshbarteaux.com</a>.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Controls */}
      <div className="events-controls" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {statusFilters.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                border: filter === s
                  ? '1px solid var(--cn-gold)'
                  : '1px solid rgba(200,150,12,0.25)',
                background: filter === s
                  ? 'rgba(200,150,12,0.18)'
                  : 'transparent',
                color: filter === s ? 'var(--cn-gold)' : 'var(--cn-tan)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
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

      {filtered.length === 0 && (
        <p style={{ color: 'var(--cn-cream)', opacity: 0.5, textAlign: 'center', padding: '2rem 0' }}>
          No volunteers in this group.
        </p>
      )}

      {/* ── Grid ── */}
      {view === 'grid' && (
        <div>
          {Object.entries(byGroup).map(([groupTitle, items]) => (
            <div key={groupTitle} style={{ marginBottom: '3rem' }}>
              <SectionHeader>{groupTitle}</SectionHeader>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}>
                {items.map(v => <VolunteerCard key={v.id} volunteer={v} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── List ── */}
      {view === 'list' && (
        <div className="events-list">
          {filtered.map(v => (
            <div key={v.id} className="event-list-item">
              <span className="event-list-date" style={{ minWidth: '5rem' }}>
                {v.hoursPerWeek ? `${v.hoursPerWeek} hrs` : '—'}
              </span>
              <span className="event-list-title">{v.name}</span>
              <span className="event-list-org">{v.skills ?? ''}</span>
              {v.status && (
                <span
                  className="event-list-type"
                  style={{ background: statusColor(v.status), borderColor: statusColor(v.status), color: '#fff' }}
                >
                  {v.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
