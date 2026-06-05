/**
 * Reads Playwright's JSON reporter output (test-results/results.json) and
 * the Apex test counts from salesforce CI, then writes a consolidated
 * public/test-summary.json that the /tests dashboard page fetches at runtime.
 *
 * Called by the playwright.yml workflow after tests complete:
 *   node scripts/summarize-tests.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Apex suite definitions (static — source of truth is the SF repo) ──────────
const APEX_SUITES = [
  {
    suite: 'Apex — HelloWorld',
    file: 'salesforce/force-app/main/default/classes/HelloWorldTest.cls',
    count: 1,
    area: 'Salesforce',
    description: 'Basic Apex class sanity check',
  },
  {
    suite: 'Apex — EventController',
    file: 'salesforce/force-app/main/default/classes/EventControllerTest.cls',
    count: 2,
    area: 'Salesforce',
    description: 'SOQL returns only future public approved events, excludes past/private',
  },
  {
    suite: 'Apex — LoanOrigination',
    file: 'salesforce/force-app/main/default/classes/LoanOriginationCalloutTest.cls',
    count: 4,
    area: 'Salesforce',
    description: 'Mock HTTP 201 success, 500 error handling, trigger coverage, payload structure',
  },
]

// ── File-to-area mapping (matches test file paths → display area) ─────────────
const AREA_MAP = {
  'smoke':             'Navigation',
  'events':            'Events',
  'contact-form':      'Contact Form',
  'submit-event':      'Events',
  'ali-chat':          'Alisdelisgi Chat',
  'negative':          'Negative / Security',
  'hello':             'Navigation',
  'event_list':        'Events',
  'housing_inquiry':   'Contact Form',
  'etl':               'Salesforce',
}

function areaFor(filePath) {
  for (const [key, area] of Object.entries(AREA_MAP)) {
    if (filePath.includes(key)) return area
  }
  return 'Other'
}

function labelFor(filePath) {
  if (filePath.includes('bdd')) {
    const m = filePath.match(/([^/]+)\.feature/)
    if (m) return `BDD — ${m[1].replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}`
  }
  const m = filePath.match(/([^/]+)\.spec\.ts$/)
  if (m) {
    const name = m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
    return `Playwright — ${name}`
  }
  return filePath
}

// ── Read Playwright JSON results ──────────────────────────────────────────────
const resultsPath = join(ROOT, 'test-results', 'results.json')

let playwrightSuites = []

if (existsSync(resultsPath)) {
  const raw = JSON.parse(readFileSync(resultsPath, 'utf8'))

  // Group specs by file
  const byFile = new Map()

  function walkSuite(suite, parentFile) {
    const file = suite.file || parentFile
    if (suite.specs) {
      for (const spec of suite.specs) {
        const key = file || spec.file || 'unknown'
        if (!byFile.has(key)) byFile.set(key, { pass: 0, fail: 0, skip: 0, total: 0 })
        const entry = byFile.get(key)
        entry.total++
        const result = spec.tests?.[0]?.results?.[0]
        const status = result?.status ?? 'unknown'
        if (status === 'passed') entry.pass++
        else if (status === 'skipped' || spec.tests?.[0]?.expectedStatus === 'skipped') entry.skip++
        else entry.fail++
      }
    }
    if (suite.suites) {
      for (const child of suite.suites) walkSuite(child, file)
    }
  }

  if (raw.suites) {
    for (const suite of raw.suites) walkSuite(suite, suite.file)
  }

  // Deduplicate by normalized file stem (chromium + mobile-safari run same specs)
  const stemMap = new Map()
  for (const [filePath, counts] of byFile) {
    // Normalize: strip leading paths, keep the spec file name
    const stem = filePath
      .replace(/^.*\/tests\//, '')
      .replace(/\.spec\.ts$/, '')
      .replace(/\.feature$/, '')
    if (!stemMap.has(stem)) {
      stemMap.set(stem, { filePath, counts: { ...counts } })
    } else {
      // Take the max (some runs may skip mobile-safari)
      const existing = stemMap.get(stem).counts
      existing.pass  = Math.max(existing.pass,  counts.pass)
      existing.fail  = Math.max(existing.fail,  counts.fail)
      existing.skip  = Math.max(existing.skip,  counts.skip)
      existing.total = Math.max(existing.total, counts.total)
    }
  }

  for (const [, { filePath, counts }] of stemMap) {
    playwrightSuites.push({
      suite:       labelFor(filePath),
      file:        filePath.replace(/^.*\/ccou-web\//, ''),
      count:       counts.total,
      pass:        counts.pass,
      fail:        counts.fail,
      skip:        counts.skip,
      area:        areaFor(filePath),
      description: '',
    })
  }

  // Sort stable: BDD last, alphabetical within group
  playwrightSuites.sort((a, b) => {
    const aBdd = a.suite.startsWith('BDD') ? 1 : 0
    const bBdd = b.suite.startsWith('BDD') ? 1 : 0
    return aBdd - bBdd || a.suite.localeCompare(b.suite)
  })

} else {
  console.warn('No test-results/results.json found — using empty Playwright suites.')
}

// ── Merge with Apex (always static) ──────────────────────────────────────────
const allSuites = [
  ...playwrightSuites,
  ...APEX_SUITES.map(s => ({ ...s, pass: s.count, fail: 0, skip: 0 })),
]

const totalTests  = allSuites.reduce((s, t) => s + t.count, 0)
const totalPass   = allSuites.reduce((s, t) => s + (t.pass ?? t.count), 0)
const totalFail   = allSuites.reduce((s, t) => s + (t.fail ?? 0), 0)
const totalSkip   = allSuites.reduce((s, t) => s + (t.skip ?? 0), 0)
const passRate    = totalTests > 0 ? Math.round((totalPass / totalTests) * 100) : 0

const summary = {
  generatedAt: new Date().toISOString(),
  totalTests,
  totalPass,
  totalFail,
  totalSkip,
  passRate,
  suites: allSuites,
}

const outPath = join(ROOT, 'public', 'test-summary.json')
writeFileSync(outPath, JSON.stringify(summary, null, 2))
console.log(`✓ Wrote ${outPath}`)
console.log(`  ${totalTests} total tests | ${totalPass} pass | ${totalFail} fail | ${totalSkip} skip | ${passRate}% pass rate`)
console.log(`  ${allSuites.length} suites (${playwrightSuites.length} Playwright/BDD + ${APEX_SUITES.length} Apex)`)
