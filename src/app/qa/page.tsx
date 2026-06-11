import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'QA Board — CCO United',
  description: 'Live Jira project board for CCO United — sprint status, epics, and backlog.',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface JiraStatus { name: string }
interface JiraIssueType { name: string }
interface JiraParent { key: string; fields?: { summary: string } }
interface JiraFields {
  summary: string
  status: JiraStatus
  issuetype: JiraIssueType
  parent?: JiraParent
}
interface JiraIssue { key: string; fields: JiraFields }

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchBoard(): Promise<JiraIssue[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/api/jira-board`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  'Done':        '#4A7C59',
  'In Progress': '#C8960C',
  'In Review':   '#2C5F7A',
  'To Do':       'rgba(255,255,255,0.18)',
}
const STATUS_TEXT: Record<string, string> = {
  'Done':        '#F5EDD8',
  'In Progress': '#1A0F0A',
  'In Review':   '#F5EDD8',
  'To Do':       'var(--cn-tan)',
}
const TYPE_ICON: Record<string, string> = {
  Epic:    '◈',
  Story:   '◉',
  Task:    '◻',
  Subtask: '·',
  Feature: '◆',
  Bug:     '✕',
  Request: '◎',
}

function Badge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.15rem 0.55rem',
      fontSize: '0.65rem',
      fontFamily: "'Source Sans 3', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      background: STATUS_COLOR[status] ?? 'rgba(255,255,255,0.1)',
      color: STATUS_TEXT[status] ?? 'var(--cn-cream)',
      borderRadius: 2,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function QAPage() {
  const issues = await fetchBoard()

  const epics   = issues.filter(i => i.fields.issuetype.name === 'Epic')
  const nonEpic = issues.filter(i => i.fields.issuetype.name !== 'Epic')

  // Stats
  const total     = issues.length
  const done      = issues.filter(i => i.fields.status.name === 'Done').length
  const inProg    = issues.filter(i => i.fields.status.name === 'In Progress').length
  const inReview  = issues.filter(i => i.fields.status.name === 'In Review').length
  const todo      = issues.filter(i => i.fields.status.name === 'To Do').length
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0

  // Group children by epic key
  const byEpic: Record<string, JiraIssue[]> = {}
  const orphans: JiraIssue[] = []
  for (const issue of nonEpic) {
    const parentKey = issue.fields.parent?.key
    if (parentKey) {
      byEpic[parentKey] = byEpic[parentKey] ?? []
      byEpic[parentKey].push(issue)
    } else {
      orphans.push(issue)
    }
  }

  // Gauge SVG
  const cx = 110, cy = 100, R = 80, stroke = 18
  const circ = Math.PI * R
  const filled = (pct / 100) * circ
  const startX = cx - R, startY = cy, endX = cx + R, endY = cy
  const gaugeColor = pct === 100 ? '#4A7C59' : pct > 70 ? '#C8960C' : '#8B1A1A'

  return (
    <>
      <Nav />
      <main className="tests-page">

        {/* Hero */}
        <div className="events-hero">
          <span className="section-label">Project Management</span>
          <h1 className="section-title">QA Board</h1>
          <div className="gold-rule" />
          <p className="tests-summary">
            Live view of the CCO United Jira board — sprints, epics, and backlog status.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--cn-tan)', marginTop: '0.5rem', opacity: 0.7 }}>
            Synced from{' '}
            <a href="https://cco-united.atlassian.net/jira/software/projects/SCRUM/boards/1"
              target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--cn-gold)', textDecoration: 'none' }}>
              cco-united.atlassian.net · SCRUM
            </a>
            {' '}· refreshes every 5 min
          </p>
        </div>

        <div className="container">

          {/* ── Stats ── */}
          <section className="tests-section">
            <h2 className="tests-section-title">At a Glance</h2>
            <div className="tests-stat-grid">
              <div className="tests-stat-card tests-stat-card--gold">
                <span className="tests-stat-number">{total}</span>
                <span className="tests-stat-label">Total Issues</span>
              </div>
              <div className="tests-stat-card tests-stat-card--green">
                <span className="tests-stat-number">{done}</span>
                <span className="tests-stat-label">Done</span>
              </div>
              <div className="tests-stat-card tests-stat-card--gold">
                <span className="tests-stat-number">{inProg}</span>
                <span className="tests-stat-label">In Progress</span>
              </div>
              <div className="tests-stat-card tests-stat-card--blue">
                <span className="tests-stat-number">{inReview}</span>
                <span className="tests-stat-label">In Review</span>
              </div>
              <div className="tests-stat-card" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <span className="tests-stat-number">{todo}</span>
                <span className="tests-stat-label">To Do</span>
              </div>
              <div className={`tests-stat-card ${pct === 100 ? 'tests-stat-card--green' : pct > 70 ? 'tests-stat-card--gold' : 'tests-stat-card--red'}`}>
                <span className="tests-stat-number">{pct}%</span>
                <span className="tests-stat-label">Complete</span>
              </div>
            </div>
          </section>

          {/* ── Gauge + Epic summary ── */}
          <section className="tests-section">
            <h2 className="tests-section-title">Sprint Progress</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>

              {/* Gauge */}
              <div className="tests-chart-card tests-chart-card--center">
                <div className="tests-chart-title">Overall Completion</div>
                <svg viewBox="0 0 220 110" width="220" height="110" style={{ display: 'block', margin: '1rem auto 0' }}>
                  <path d={`M${startX},${startY} A${R},${R},0,0,1,${endX},${endY}`}
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} strokeLinecap="round" />
                  <path d={`M${startX},${startY} A${R},${R},0,0,1,${endX},${endY}`}
                    fill="none" stroke={gaugeColor} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={`${filled} ${circ}`} />
                  <text x={cx} y={cy - 10} textAnchor="middle" fill="#F5EDD8" fontSize="28"
                    fontFamily="Cinzel,serif" fontWeight="700">{pct}%</text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fill={gaugeColor} fontSize="9"
                    fontFamily="Source Sans 3,sans-serif" letterSpacing="1.5">COMPLETE</text>
                </svg>
                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--cn-tan)' }}>
                  {done} of {total} issues closed
                </div>
              </div>

              {/* Epic status table */}
              <div>
                {epics.map(epic => {
                  const children = byEpic[epic.key] ?? []
                  const epicDone = children.filter(c => c.fields.status.name === 'Done').length
                  const epicTotal = children.length
                  const epicPct = epicTotal > 0 ? Math.round((epicDone / epicTotal) * 100) : (epic.fields.status.name === 'Done' ? 100 : 0)
                  return (
                    <div key={epic.key} style={{
                      display: 'grid',
                      gridTemplateColumns: '72px 1fr 100px 52px',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.7rem 0',
                      borderBottom: '1px solid rgba(200,150,12,0.1)',
                    }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--cn-gold)', fontFamily: 'monospace' }}>{epic.key}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--cn-cream)', fontWeight: 600 }}>{epic.fields.summary}</span>
                      <Badge status={epic.fields.status.name} />
                      <span style={{ fontSize: '0.75rem', color: epicPct === 100 ? '#4A7C59' : 'var(--cn-tan)', textAlign: 'right' }}>
                        {epicTotal > 0 ? `${epicDone}/${epicTotal}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── Issues by Epic ── */}
          <section className="tests-section">
            <h2 className="tests-section-title">Issues by Epic</h2>
            {epics.map(epic => {
              const children = byEpic[epic.key] ?? []
              if (children.length === 0) return null
              return (
                <div key={epic.key} style={{ marginBottom: '2rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    background: 'rgba(200,150,12,0.07)',
                    borderLeft: '3px solid var(--cn-gold)',
                    marginBottom: '0.25rem',
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--cn-gold)', fontFamily: 'monospace', minWidth: 72 }}>{epic.key}</span>
                    <span style={{ fontSize: '0.9rem', fontFamily: "'Cinzel', serif", color: 'var(--cn-cream)', fontWeight: 600, flex: 1 }}>
                      {epic.fields.summary}
                    </span>
                    <Badge status={epic.fields.status.name} />
                  </div>
                  <div className="test-inventory">
                    {children.map(issue => (
                      <div key={issue.key} className="test-inventory-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--cn-gold)', fontSize: '0.75rem', minWidth: 16, textAlign: 'center' }}>
                            {TYPE_ICON[issue.fields.issuetype.name] ?? '·'}
                          </span>
                          <span className="test-inventory-suite" style={{ fontWeight: issue.fields.issuetype.name === 'Story' ? 600 : 400 }}>
                            {issue.fields.summary}
                          </span>
                        </div>
                        <div />
                        <div className="test-inventory-desc" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                          {issue.key}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge status={issue.fields.status.name} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Orphans (no parent epic) */}
            {orphans.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: '3px solid rgba(255,255,255,0.2)',
                  marginBottom: '0.25rem',
                }}>
                  <span style={{ fontSize: '0.9rem', fontFamily: "'Cinzel', serif", color: 'var(--cn-cream)', fontWeight: 600 }}>
                    Standalone Issues
                  </span>
                </div>
                <div className="test-inventory">
                  {orphans.map(issue => (
                    <div key={issue.key} className="test-inventory-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--cn-gold)', fontSize: '0.75rem', minWidth: 16, textAlign: 'center' }}>
                          {TYPE_ICON[issue.fields.issuetype.name] ?? '·'}
                        </span>
                        <span className="test-inventory-suite">{issue.fields.summary}</span>
                      </div>
                      <div />
                      <div className="test-inventory-desc" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                        {issue.key}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Badge status={issue.fields.status.name} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
