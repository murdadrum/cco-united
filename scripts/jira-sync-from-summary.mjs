#!/usr/bin/env node
// Reads public/test-summary.json and transitions Jira QA issues to reflect
// current CI pass/fail state. Also posts a comment on each issue with the run
// details for a permanent audit trail.
//
// Suite-to-Jira mapping:
//   Workstream issues (QA-1..QA-11) are NOT touched — they are containers.
//   Each test-case Task (QA-12..QA-140) is transitioned and commented.
//
// Required env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN
// Optional env vars:
//   JIRA_SCOPE        playwright | newman | salesforce | all (default: all)
//   NEWMAN_STATUS     pass | fail (required when scope=newman)
//   GITHUB_RUN_ID     injected by GitHub Actions
//   GITHUB_SERVER_URL injected by GitHub Actions
//   GITHUB_REPOSITORY injected by GitHub Actions
//   GITHUB_SHA        injected by GitHub Actions

const TRANSITION_DONE        = '41' // pass
const TRANSITION_IN_PROGRESS = '31' // fail

// ── Suite → Jira issue keys map ───────────────────────────────────────────────
const SUITE_MAP = {
  // Playwright suites
  'Playwright — Smoke':          ['QA-12','QA-13','QA-14','QA-15','QA-16','QA-17','QA-18','QA-19','QA-20','QA-21','QA-22'],
  'Playwright — Contact Form':   ['QA-23','QA-24','QA-25','QA-26','QA-27'],
  'Playwright — Ali Chat':       ['QA-28','QA-29','QA-30','QA-31','QA-32'],
  'Playwright — Events':         ['QA-33','QA-34','QA-35','QA-36','QA-37'],
  'Playwright — Submit Event':   ['QA-38','QA-39','QA-40','QA-41'],
  'Playwright — Negative':       [
    'QA-42','QA-43','QA-44','QA-45','QA-46','QA-47','QA-48','QA-49','QA-50',
    'QA-51','QA-52','QA-53','QA-54','QA-55','QA-56','QA-57','QA-58','QA-59',
    'QA-60','QA-61','QA-62','QA-63','QA-64','QA-65','QA-66','QA-67','QA-68',
    'QA-69','QA-70','QA-71','QA-72','QA-73','QA-74','QA-75','QA-76','QA-77',
  ],
  'Playwright — Slack Integration': ['QA-78','QA-79','QA-80','QA-81','QA-82','QA-83','QA-84','QA-85'],
  'Playwright — Ai Qa':          [
    'QA-86','QA-87','QA-88','QA-89','QA-90','QA-91','QA-92','QA-93','QA-94',
    'QA-95','QA-96','QA-97','QA-98','QA-99','QA-100','QA-101','QA-102','QA-103',
    'QA-104','QA-105',
  ],
  // BDD suites (salesforce-ci.yml)
  'BDD — Hello':            ['QA-106','QA-107'],
  'BDD — Etl':              ['QA-108','QA-109'],
  'BDD — Event List':       ['QA-110','QA-111','QA-112','QA-113','QA-114','QA-115'],
  'BDD — Housing Inquiry':  ['QA-116','QA-117','QA-118','QA-119','QA-120','QA-121'],
  'BDD — Housing E2E':      ['QA-122','QA-123'],
  // Newman API suites (api-contract.yml)
  'Newman':                 ['QA-124','QA-125','QA-126','QA-127','QA-128','QA-129','QA-130','QA-131','QA-132','QA-133','QA-134'],
  // Apex suites (salesforce-ci.yml)
  'Apex — HelloWorld':      ['QA-135'],
  'Apex — EventController': ['QA-136','QA-137'],
  'Apex — LoanOrigination': ['QA-138','QA-139','QA-140'],
}

const SCOPE_SUITES = {
  playwright: [
    'Playwright — Smoke', 'Playwright — Contact Form', 'Playwright — Ali Chat',
    'Playwright — Events', 'Playwright — Submit Event', 'Playwright — Negative',
    'Playwright — Slack Integration', 'Playwright — Ai Qa',
  ],
  newman: ['Newman'],
  salesforce: [
    'BDD — Hello', 'BDD — Etl', 'BDD — Event List',
    'BDD — Housing Inquiry', 'BDD — Housing E2E',
    'Apex — HelloWorld', 'Apex — EventController', 'Apex — LoanOrigination',
  ],
}
SCOPE_SUITES.all = Object.keys(SUITE_MAP)

// ── Helpers ───────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env
if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('Missing required env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN')
  process.exit(1)
}

const scope = (process.env.JIRA_SCOPE || 'all').toLowerCase()
const ownedSuiteKeys = SCOPE_SUITES[scope]
if (!ownedSuiteKeys) {
  console.error(`Unknown JIRA_SCOPE "${scope}". Valid: playwright, newman, salesforce, all`)
  process.exit(1)
}

const summaryPath = join(ROOT, 'public', 'test-summary.json')
if (!existsSync(summaryPath)) {
  console.warn('No test-summary.json found — skipping Jira sync.')
  process.exit(0)
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'))
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')

// Build run URL for the comment
const runId     = process.env.GITHUB_RUN_ID || ''
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
const repo      = process.env.GITHUB_REPOSITORY || 'murdadrum/ccou-salesforce'
const sha       = (process.env.GITHUB_SHA || '').slice(0, 7)
const runUrl    = runId ? `${serverUrl}/${repo}/actions/runs/${runId}` : null
const runDate   = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

async function jiraPost(path, body) {
  const res = await fetch(`${JIRA_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res
}

async function transition(issueKey, transitionId) {
  const res = await jiraPost(`/rest/api/3/issue/${issueKey}/transitions`, {
    transition: { id: transitionId },
  })
  return res.status === 204 || res.status === 200
}

async function addComment(issueKey, passed, suiteName) {
  const icon   = passed ? '✅' : '❌'
  const result = passed ? 'PASSED' : 'FAILED'
  const linkText = runUrl
    ? `[View CI run →|${runUrl}]`
    : '_No run URL available_'
  const commitText = sha ? `Commit: +{{${sha}}}+` : ''

  // Jira's Atlassian Document Format (ADF) for api/3
  const body = {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `${icon} ${result}`, marks: [{ type: 'strong' }] },
          { type: 'text', text: `  —  ${suiteName}` },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `Run: ${runDate}` },
          ...(sha ? [
            { type: 'hardBreak' },
            { type: 'text', text: `Commit: ${sha}` },
          ] : []),
          ...(runUrl ? [
            { type: 'hardBreak' },
            { type: 'text', text: 'CI run ', },
            { type: 'inlineCard', attrs: { url: runUrl } },
          ] : []),
        ],
      },
    ],
  }

  const res = await jiraPost(`/rest/api/3/issue/${issueKey}/comment`, { body })
  return res.status === 201 || res.status === 200
}

// ── Main ──────────────────────────────────────────────────────────────────────
let totalTransitioned = 0
let totalCommented    = 0
let totalErrors       = 0

for (const suiteKey of ownedSuiteKeys) {
  const issueKeys = SUITE_MAP[suiteKey]
  if (!issueKeys?.length) continue

  const suiteData = summary.suites?.find(s =>
    s.suite.toLowerCase().includes(
      suiteKey.toLowerCase()
        .replace('playwright — ', '')
        .replace('bdd — ', '')
        .replace('apex — ', '')
    )
  )

  let suitePassed = true
  if (suiteData) {
    suitePassed = suiteData.fail === 0
  }
  if (scope === 'newman' || suiteKey === 'Newman') {
    suitePassed = process.env.NEWMAN_STATUS === 'pass'
  }

  const transId = suitePassed ? TRANSITION_DONE : TRANSITION_IN_PROGRESS
  const label   = suitePassed ? 'Done ✅' : 'In Progress ❌'

  console.log(`\n${suiteKey} → ${label} (${issueKeys.length} issues)`)

  for (const key of issueKeys) {
    const [ok, commented] = await Promise.all([
      transition(key, transId),
      addComment(key, suitePassed, suiteKey),
    ])

    if (ok) {
      totalTransitioned++
      console.log(`  ✓ ${key} transitioned`)
    } else {
      totalErrors++
      console.error(`  ✗ ${key} transition failed`)
    }

    if (commented) {
      totalCommented++
    } else {
      console.error(`  ✗ ${key} comment failed`)
      totalErrors++
    }
  }
}

console.log(`\n── Jira sync complete ──`)
console.log(`  Transitioned: ${totalTransitioned} | Commented: ${totalCommented} | Errors: ${totalErrors}`)

if (totalErrors > 0) process.exit(1)
