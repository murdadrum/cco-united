#!/usr/bin/env node
// Appends a run entry to public/test-history.json.
// Called by each CI workflow after tests complete.
//
// Each entry records: timestamp, lane, pass/fail counts, commit SHA, run URL.
// The file grows indefinitely — kept at ≤200 entries by trimming oldest.
//
// Required env vars: HISTORY_LANE (playwright | newman | salesforce-apex | salesforce-bdd)
// Optional env vars:
//   HISTORY_PASS      number of passing tests (default 0)
//   HISTORY_FAIL      number of failing tests (default 0)
//   HISTORY_TOTAL     total tests (default pass+fail)
//   GITHUB_RUN_ID     injected by GitHub Actions
//   GITHUB_SERVER_URL injected by GitHub Actions
//   GITHUB_REPOSITORY injected by GitHub Actions
//   GITHUB_SHA        injected by GitHub Actions
//   GITHUB_REF_NAME   injected by GitHub Actions

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const lane  = process.env.HISTORY_LANE
if (!lane) {
  console.error('HISTORY_LANE is required (playwright | newman | salesforce-apex | salesforce-bdd)')
  process.exit(1)
}

const pass  = parseInt(process.env.HISTORY_PASS  || '0', 10)
const fail  = parseInt(process.env.HISTORY_FAIL  || '0', 10)
const total = parseInt(process.env.HISTORY_TOTAL || String(pass + fail), 10)

const runId     = process.env.GITHUB_RUN_ID || ''
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
const repo      = process.env.GITHUB_REPOSITORY || 'murdadrum/ccou-salesforce'
const sha       = (process.env.GITHUB_SHA || '').slice(0, 7)
const branch    = process.env.GITHUB_REF_NAME || 'main'
const runUrl    = runId ? `${serverUrl}/${repo}/actions/runs/${runId}` : null

const entry = {
  timestamp: new Date().toISOString(),
  lane,
  branch,
  sha,
  runUrl,
  total,
  pass,
  fail,
  passRate: total > 0 ? Math.round((pass / total) * 100) : 0,
}

const historyPath = join(ROOT, 'public', 'test-history.json')
const publicDir   = join(ROOT, 'public')

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })

let history = []
if (existsSync(historyPath)) {
  try {
    history = JSON.parse(readFileSync(historyPath, 'utf8'))
    if (!Array.isArray(history)) history = []
  } catch {
    history = []
  }
}

history.push(entry)

// Keep at most 200 entries (oldest trimmed first)
if (history.length > 200) history = history.slice(-200)

writeFileSync(historyPath, JSON.stringify(history, null, 2))
console.log(`✓ Appended to test-history.json (${history.length} total entries)`)
console.log(`  Lane: ${lane} | ${pass}/${total} pass | SHA: ${sha || 'n/a'}`)
