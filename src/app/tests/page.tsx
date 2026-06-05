import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// Revalidate every 5 minutes — picks up new test-summary.json after CI pushes it
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Test Status — CCO United',
  description: 'Live CI test status across all CCO United test suites.',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SuiteRow {
  suite: string
  file: string
  count: number
  pass: number
  fail: number
  skip: number
  area: string
  description: string
}

interface TestSummary {
  generatedAt: string
  totalTests: number
  totalPass: number
  totalFail: number
  totalSkip: number
  passRate: number
  suites: SuiteRow[]
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

// ── Fallback summary (used when test-summary.json hasn't been generated yet) ──
// This matches exactly what the CI would produce after the first green run.
const FALLBACK_SUMMARY: TestSummary = {
  generatedAt: '',
  totalTests: 0,
  totalPass: 0,
  totalFail: 0,
  totalSkip: 0,
  passRate: 0,
  suites: [],
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchTestSummary(): Promise<TestSummary> {
  try {
    // In production Next.js server-side fetch, the base URL is the deployment origin.
    // NEXT_PUBLIC_BASE_URL should be set on Vercel/host, falls back to localhost for dev.
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${base}/test-summary.json`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return FALLBACK_SUMMARY
    return await res.json()
  } catch {
    return FALLBACK_SUMMARY
  }
}

async function fetchRuns(repo: string): Promise<WorkflowRun[]> {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/runs?per_page=10`,
    { headers, next: { revalidate: 300 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.workflow_runs ?? []
}

async function getRepoStatus(repo: string, label: string, url: string): Promise<RepoStatus> {
  try {
    const runs = await fetchRuns(repo)
    const seen = new Set<string>()
    const deduped = runs.filter(r => { if (seen.has(r.name)) return false; seen.add(r.name); return true })
    return { repo, label, url, runs: deduped }
  } catch {
    return { repo, label, url, runs: [], error: 'Failed to fetch' }
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

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
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="test-repo-url">{data.repo}</a>
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

// ── Chart helpers (pure SVG, no deps) ────────────────────────────────────────

const AREA_COLORS = ['#C8960C','#8B1A1A','#4A5E3A','#2C5F7A','#7A3B6B','#8B5E1A','#E8B84B']

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  const cx = 90, cy = 90, R = 72, r = 44
  let angle = -Math.PI / 2
  const paths: { d: string; color: string }[] = []
  for (const sl of slices) {
    const sweep = (sl.value / total) * 2 * Math.PI
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle)
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle)
    const mid = angle + sweep
    const x3 = cx + R * Math.cos(mid), y3 = cy + R * Math.sin(mid)
    const x4 = cx + r * Math.cos(mid), y4 = cy + r * Math.sin(mid)
    const large = sweep > Math.PI ? 1 : 0
    paths.push({
      d: `M${x1},${y1} A${R},${R},0,${large},1,${x3},${y3} L${x4},${y4} A${r},${r},0,${large},0,${x2},${y2} Z`,
      color: sl.color,
    })
    angle += sweep
  }
  return (
    <svg viewBox="0 0 180 180" width="180" height="180" style={{ display: 'block' }}>
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} stroke="rgba(26,15,10,0.6)" strokeWidth="2" />)}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#F5EDD8" fontSize="22" fontFamily="Cinzel,serif" fontWeight="700">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#D4B896" fontSize="9" fontFamily="Source Sans 3,sans-serif" letterSpacing="1">
        TOTAL TESTS
      </text>
    </svg>
  )
}

function HBarChart({ bars }: { bars: { label: string; value: number; max: number; color: string }[] }) {
  const h = 28, gap = 10, pad = 4
  const totalH = bars.length * (h + gap) - gap + pad * 2
  return (
    <svg viewBox={`0 0 260 ${totalH}`} width="260" height={totalH} style={{ display: 'block' }}>
      {bars.map((b, i) => {
        const y = pad + i * (h + gap)
        const w = Math.round((b.value / b.max) * 200)
        return (
          <g key={b.label}>
            <rect x={0} y={y} width={200} height={h} rx={4} fill="rgba(255,255,255,0.06)" />
            <rect x={0} y={y} width={w} height={h} rx={4} fill={b.color} />
            <text x={8} y={y + h / 2 + 4} fill="#F5EDD8" fontSize="10" fontFamily="Source Sans 3,sans-serif" fontWeight="600">{b.label}</text>
            <text x={208} y={y + h / 2 + 4} fill="#C8960C" fontSize="11" fontFamily="Cinzel,serif" fontWeight="700">{b.value}</text>
          </g>
        )
      })}
    </svg>
  )
}

function GaugeChart({ pct }: { pct: number }) {
  const cx = 110, cy = 100, R = 80, stroke = 18
  const circ = Math.PI * R
  const filled = (pct / 100) * circ
  const startX = cx - R, startY = cy
  const endX = cx + R, endY = cy
  return (
    <svg viewBox="0 0 220 110" width="220" height="110" style={{ display: 'block' }}>
      <path d={`M${startX},${startY} A${R},${R},0,0,1,${endX},${endY}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} strokeLinecap="round" />
      <path d={`M${startX},${startY} A${R},${R},0,0,1,${endX},${endY}`} fill="none"
        stroke={pct === 100 ? '#4A7C59' : pct > 80 ? '#C8960C' : '#8B1A1A'}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`} />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#F5EDD8" fontSize="28" fontFamily="Cinzel,serif" fontWeight="700">{pct}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#4A7C59" fontSize="9" fontFamily="Source Sans 3,sans-serif" letterSpacing="1.5">PASS RATE</text>
    </svg>
  )
}

function VBarChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const maxV = Math.max(...bars.map(b => b.value), 1)
  const bw = 32, gap = 16, padL = 8, chartH = 100, padT = 8, padB = 36
  const totalW = padL + bars.length * (bw + gap) - gap + padL
  const totalH = padT + chartH + padB
  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} width={totalW} height={totalH} style={{ display: 'block' }}>
      {bars.map((b, i) => {
        const barH = Math.round((b.value / maxV) * chartH)
        const x = padL + i * (bw + gap)
        const y = padT + chartH - barH
        return (
          <g key={b.label}>
            <rect x={x} y={padT} width={bw} height={chartH} rx={4} fill="rgba(255,255,255,0.05)" />
            <rect x={x} y={y} width={bw} height={barH} rx={4} fill={b.color} />
            <text x={x + bw / 2} y={padT + chartH - barH - 6} textAnchor="middle" fill="#C8960C" fontSize="10" fontFamily="Cinzel,serif" fontWeight="700">{b.value}</text>
            <text x={x + bw / 2} y={padT + chartH + 14} textAnchor="middle" fill="#D4B896" fontSize="8" fontFamily="Source Sans 3,sans-serif">{b.label.split(' ').map((w,wi) => (
              <tspan key={wi} x={x + bw / 2} dy={wi === 0 ? 0 : 10}>{w}</tspan>
            ))}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TestStatusPage() {
  const [summary, mainRepo, portfolioRepo] = await Promise.all([
    fetchTestSummary(),
    getRepoStatus('murdadrum/cco-united',      'Production Site',        'https://github.com/murdadrum/cco-united'),
    getRepoStatus('murdadrum/ccou-salesforce', 'Salesforce Portfolio',   'https://github.com/murdadrum/ccou-salesforce'),
  ])

  const { totalTests, totalPass, totalFail, totalSkip, passRate, suites, generatedAt } = summary

  // Area breakdown for donut
  const areaMap: Record<string, number> = {}
  for (const t of suites) areaMap[t.area] = (areaMap[t.area] ?? 0) + t.count
  const areaSlices = Object.entries(areaMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: AREA_COLORS[i % AREA_COLORS.length] }))

  // Layer breakdown for VBar
  const layerBars = [
    { label: 'Playwright', value: suites.filter(t => t.suite.startsWith('Playwright')).reduce((s,t)=>s+t.count,0), color: '#C8960C' },
    { label: 'BDD',        value: suites.filter(t => t.suite.startsWith('BDD')).reduce((s,t)=>s+t.count,0),        color: '#4A5E3A' },
    { label: 'Apex',       value: suites.filter(t => t.suite.startsWith('Apex')).reduce((s,t)=>s+t.count,0),       color: '#2C5F7A' },
  ]

  // Suite bar chart
  const maxCount = Math.max(...suites.map(t => t.count), 1)
  const suiteBars = suites.map((t, i) => ({
    label: t.suite.replace('Playwright — ','').replace('BDD — ','').replace('Apex — ',''),
    value: t.count,
    max: maxCount,
    color: AREA_COLORS[i % AREA_COLORS.length],
  }))

  // CI health stats
  const allRuns = [...mainRepo.runs, ...portfolioRepo.runs]
  const ciPass  = allRuns.filter(r => r.conclusion === 'success').length
  const ciFail  = allRuns.filter(r => r.conclusion === 'failure').length
  const ciTotal = allRuns.length

  const isFresh = generatedAt !== ''
  const freshnessLabel = isFresh
    ? `Last updated ${timeAgo(generatedAt)} by CI`
    : 'Awaiting first CI run'

  return (
    <>
      <Nav />
      <main className="tests-page">

        {/* Hero */}
        <div className="events-hero">
          <span className="section-label">Quality Assurance</span>
          <h1 className="section-title">Test Status Dashboard</h1>
          <div className="gold-rule" />
          <p className="tests-summary">
            {isFresh
              ? `${totalTests} tests across 3 layers — Playwright E2E, BDD Gherkin, and Apex unit.`
              : 'Live metrics update automatically after each CI run on main.'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--cn-tan)', marginTop: '0.5rem', opacity: 0.7 }}>
            {freshnessLabel}
          </p>
        </div>

        <div className="container">

          {/* ── Stat Cards ── */}
          <section className="tests-section">
            <h2 className="tests-section-title">At a Glance</h2>
            <div className="tests-stat-grid">
              <div className={`tests-stat-card ${totalFail > 0 ? 'tests-stat-card--red' : 'tests-stat-card--green'}`}>
                <span className="tests-stat-number">{totalTests || '—'}</span>
                <span className="tests-stat-label">Total Tests</span>
              </div>
              <div className="tests-stat-card tests-stat-card--gold">
                <span className="tests-stat-number">{suites.length || '—'}</span>
                <span className="tests-stat-label">Test Suites</span>
              </div>
              <div className={`tests-stat-card ${passRate === 100 ? 'tests-stat-card--green' : passRate > 80 ? 'tests-stat-card--gold' : 'tests-stat-card--red'}`}>
                <span className="tests-stat-number">{isFresh ? `${passRate}%` : '—'}</span>
                <span className="tests-stat-label">Pass Rate</span>
              </div>
              <div className="tests-stat-card tests-stat-card--blue">
                <span className="tests-stat-number">3</span>
                <span className="tests-stat-label">Test Layers</span>
              </div>
              <div className="tests-stat-card tests-stat-card--blue">
                <span className="tests-stat-number">2</span>
                <span className="tests-stat-label">CI Pipelines</span>
              </div>
              <div className={`tests-stat-card ${ciFail > 0 ? 'tests-stat-card--red' : 'tests-stat-card--green'}`}>
                <span className="tests-stat-number">{ciPass}/{ciTotal}</span>
                <span className="tests-stat-label">CI Runs Passing</span>
              </div>
            </div>
          </section>

          {/* ── Charts Row ── */}
          {isFresh && areaSlices.length > 0 && (
            <section className="tests-section">
              <h2 className="tests-section-title">Test Metrics</h2>
              <div className="tests-charts-grid">

                {/* Donut — area breakdown */}
                <div className="tests-chart-card">
                  <div className="tests-chart-title">Tests by Area</div>
                  <div className="tests-donut-wrap">
                    <DonutChart slices={areaSlices} />
                    <div className="tests-donut-legend">
                      {areaSlices.map(sl => (
                        <div key={sl.label} className="tests-legend-row">
                          <span className="tests-legend-dot" style={{ background: sl.color }} />
                          <span className="tests-legend-label">{sl.label}</span>
                          <span className="tests-legend-pct">{Math.round(sl.value / totalTests * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gauge — pass rate */}
                <div className="tests-chart-card tests-chart-card--center">
                  <div className="tests-chart-title">Overall Pass Rate</div>
                  <GaugeChart pct={passRate} />
                  <div className="tests-gauge-sub">
                    <span className="tests-gauge-pass">{totalPass} passing</span>
                    {totalFail > 0 && <span className="tests-gauge-fail"> · {totalFail} failing</span>}
                    {totalSkip > 0 && <span style={{ color: '#6B7280' }}> · {totalSkip} skipped</span>}
                  </div>
                  <div className="tests-chart-title" style={{ marginTop: '1.5rem' }}>Tests by Layer</div>
                  <div style={{ marginTop: '.75rem' }}>
                    <VBarChart bars={layerBars} />
                  </div>
                  <div className="tests-layer-legend">
                    {layerBars.map(b => (
                      <div key={b.label} className="tests-legend-row">
                        <span className="tests-legend-dot" style={{ background: b.color }} />
                        <span className="tests-legend-label">{b.label}</span>
                        <span className="tests-legend-pct">{b.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* H-Bar — per suite */}
                <div className="tests-chart-card">
                  <div className="tests-chart-title">Tests per Suite</div>
                  <div style={{ overflowY: 'auto', maxHeight: 300 }}>
                    <HBarChart bars={suiteBars} />
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* ── CI Status ── */}
          <section className="tests-section">
            <h2 className="tests-section-title">CI Status</h2>
            <div className="test-repo-grid">
              <RepoCard data={mainRepo} />
              <RepoCard data={portfolioRepo} />
            </div>
          </section>

          {/* ── Test Inventory ── */}
          {suites.length > 0 && (
            <section className="tests-section">
              <h2 className="tests-section-title">Test Inventory</h2>
              <div className="test-inventory">
                {suites.map(suite => (
                  <div key={suite.suite} className="test-inventory-row">
                    <div className="test-inventory-suite">{suite.suite}</div>
                    <div className="test-inventory-count"
                      style={{ color: suite.fail > 0 ? '#D45C5C' : suite.pass === suite.count ? '#4A7C59' : '#C8960C' }}>
                      {suite.fail > 0 ? `${suite.pass}/${suite.count}` : suite.count}
                    </div>
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
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
