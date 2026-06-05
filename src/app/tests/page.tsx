import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Test Status — CCO United',
  description: 'Live CI test status across all CCO United test suites.',
}

interface WorkflowRun {
  id: number
  name: string
  conclusion: string | null
  status: string
  html_url: string
  created_at: string
  head_commit: { message: string } | null
}

interface RepoStatus {
  repo: string
  label: string
  url: string
  runs: WorkflowRun[]
  error?: string
}

async function fetchRuns(repo: string): Promise<WorkflowRun[]> {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/runs?per_page=10`,
    { headers, next: { revalidate: 60 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.workflow_runs ?? []
}

async function getRepoStatus(repo: string, label: string, url: string): Promise<RepoStatus> {
  try {
    const runs = await fetchRuns(repo)
    // Deduplicate — keep latest run per workflow name
    const seen = new Set<string>()
    const deduped = runs.filter(r => {
      if (seen.has(r.name)) return false
      seen.add(r.name)
      return true
    })
    return { repo, label, url, runs: deduped }
  } catch {
    return { repo, label, url, runs: [], error: 'Failed to fetch' }
  }
}

function statusBadge(run: WorkflowRun) {
  const c = run.conclusion
  const s = run.status
  if (s === 'in_progress' || s === 'queued') return { label: 'Running', color: '#C8960C' }
  if (c === 'success') return { label: 'Pass', color: '#4A7C59' }
  if (c === 'failure') return { label: 'Fail', color: '#8B1A1A' }
  if (c === 'skipped') return { label: 'Skipped', color: '#6B7280' }
  return { label: c ?? s, color: '#6B7280' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function RunRow({ run }: { run: WorkflowRun }) {
  const badge = statusBadge(run)
  const msg = run.head_commit?.message?.split('\n')[0] ?? ''
  return (
    <a href={run.html_url} target="_blank" rel="noopener noreferrer" className="test-run-row">
      <span className="test-run-badge" style={{ background: badge.color }}>{badge.label}</span>
      <span className="test-run-name">{run.name}</span>
      <span className="test-run-commit">{msg.slice(0, 60)}{msg.length > 60 ? '…' : ''}</span>
      <span className="test-run-time">{timeAgo(run.created_at)}</span>
    </a>
  )
}

function RepoCard({ data }: { data: RepoStatus }) {
  const allPass = data.runs.length > 0 && data.runs.every(r => r.conclusion === 'success')
  const anyFail = data.runs.some(r => r.conclusion === 'failure')
  const overallColor = anyFail ? '#8B1A1A' : allPass ? '#4A7C59' : '#C8960C'
  const overallLabel = anyFail ? 'Failing' : allPass ? 'All Green' : 'Pending'

  return (
    <div className="test-repo-card">
      <div className="test-repo-header">
        <div>
          <div className="test-repo-label">{data.label}</div>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="test-repo-url">
            {data.repo}
          </a>
        </div>
        <span className="test-overall-badge" style={{ background: overallColor }}>{overallLabel}</span>
      </div>
      {data.error ? (
        <p className="test-error">{data.error}</p>
      ) : data.runs.length === 0 ? (
        <p className="test-error">No runs found — check GitHub Actions.</p>
      ) : (
        <div className="test-run-list">
          {data.runs.map(run => <RunRow key={run.id} run={run} />)}
        </div>
      )}
    </div>
  )
}

const TEST_INVENTORY = [
  {
    suite: 'Playwright — Smoke',
    file: 'tests/smoke.spec.ts',
    count: 9,
    description: 'Page load, nav, sections, stats, feature cards, Alis spotlight',
  },
  {
    suite: 'Playwright — Events',
    file: 'tests/events.spec.ts',
    count: 5,
    description: 'Events page title, view toggle, active state, nav, subscribe form',
  },
  {
    suite: 'Playwright — Contact Form',
    file: 'tests/contact-form.spec.ts',
    count: 5,
    description: 'Field visibility, validation, email format, success state, API error handling',
  },
  {
    suite: 'Playwright — Submit Event',
    file: 'tests/submit-event.spec.ts',
    count: 4,
    description: 'Heading, validation, email error, Wado confirmation (mocked API)',
  },
  {
    suite: 'Playwright — Alis Chat',
    file: 'tests/ali-chat.spec.ts',
    count: 5,
    description: 'Toggle visibility, collapsed default, open, send/receive (mocked stream), close',
  },
  {
    suite: 'BDD — Home Page',
    file: 'tests/bdd/features/salesforce/hello.feature',
    count: 2,
    description: 'Hero title visible, Events link in nav',
  },
  {
    suite: 'BDD — Events Calendar',
    file: 'tests/bdd/features/salesforce/event_list.feature',
    count: 3,
    description: 'Heading, events grid container, Grid/List/Calendar toggles',
  },
  {
    suite: 'BDD — Housing Inquiry',
    file: 'tests/bdd/features/salesforce/housing_inquiry.feature',
    count: 2,
    description: 'Form loads with fields, submit button present',
  },
  {
    suite: 'Apex — HelloWorld',
    file: 'salesforce/.../HelloWorldTest.cls',
    count: 1,
    description: 'Basic Apex class sanity check',
  },
  {
    suite: 'Apex — EventController',
    file: 'salesforce/.../EventControllerTest.cls',
    count: 2,
    description: 'SOQL returns only future public approved events, excludes past/private',
  },
  {
    suite: 'Apex — LoanOriginationCallout',
    file: 'salesforce/.../LoanOriginationCalloutTest.cls',
    count: 4,
    description: 'Mock HTTP 201 success, 500 error handling, trigger coverage, payload structure',
  },
]

export default async function TestStatusPage() {
  const [mainRepo, portfolioRepo] = await Promise.all([
    getRepoStatus('murdadrum/cco-united', 'Production Site', 'https://github.com/murdadrum/cco-united'),
    getRepoStatus('murdadrum/ccou-salesforce', 'Salesforce Portfolio', 'https://github.com/murdadrum/ccou-salesforce'),
  ])

  const totalTests = TEST_INVENTORY.reduce((sum, s) => sum + s.count, 0)

  return (
    <>
      <Nav />
      <main className="tests-page">
        <div className="events-hero">
          <span className="section-label">Quality Assurance</span>
          <h1 className="section-title">Test Status Dashboard</h1>
          <div className="gold-rule" />
          <p className="tests-summary">
            {totalTests} tests across 3 layers — Playwright, BDD Gherkin, and Apex.
          </p>
        </div>

        <div className="container">
          <section className="tests-section">
            <h2 className="tests-section-title">CI Status</h2>
            <div className="test-repo-grid">
              <RepoCard data={mainRepo} />
              <RepoCard data={portfolioRepo} />
            </div>
          </section>

          <section className="tests-section">
            <h2 className="tests-section-title">Test Inventory</h2>
            <div className="test-inventory">
              {TEST_INVENTORY.map(suite => (
                <div key={suite.suite} className="test-inventory-row">
                  <div className="test-inventory-suite">{suite.suite}</div>
                  <div className="test-inventory-count">{suite.count}</div>
                  <div className="test-inventory-desc">{suite.description}</div>
                  <div className="test-inventory-file">{suite.file}</div>
                </div>
              ))}
              <div className="test-inventory-total">
                <span>Total</span>
                <span>{totalTests}</span>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
