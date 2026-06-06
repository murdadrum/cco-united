#!/usr/bin/env node
// Transitions Jira issues based on CI test outcome and posts a run comment.
// Usage: node scripts/jira-update.mjs --status pass QA-12 QA-13
//        node scripts/jira-update.mjs --status fail QA-23 QA-24
//
// Required env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN
// Optional env vars: GITHUB_RUN_ID, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_SHA
//
// Transition IDs (cco-united.atlassian.net QA project):
//   21 = To Do | 31 = In Progress (failing) | 41 = Done (passing)

const TRANSITION_PASS = '41' // Done
const TRANSITION_FAIL = '31' // In Progress

const args = process.argv.slice(2)
const statusIdx = args.indexOf('--status')
if (statusIdx === -1 || !args[statusIdx + 1]) {
  console.error('Usage: jira-update.mjs --status pass|fail QA-XX ...')
  process.exit(1)
}

const status = args[statusIdx + 1].toLowerCase()
if (status !== 'pass' && status !== 'fail') {
  console.error('--status must be "pass" or "fail"')
  process.exit(1)
}

const issueKeys = args.filter((a, i) => a !== '--status' && args[i - 1] !== '--status')
if (issueKeys.length === 0) {
  console.log('No issue keys provided — nothing to update.')
  process.exit(0)
}

const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env
if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('Missing required env vars: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN')
  process.exit(1)
}

const transitionId = status === 'pass' ? TRANSITION_PASS : TRANSITION_FAIL
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')

const runId     = process.env.GITHUB_RUN_ID || ''
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
const repo      = process.env.GITHUB_REPOSITORY || 'murdadrum/ccou-salesforce'
const sha       = (process.env.GITHUB_SHA || '').slice(0, 7)
const runUrl    = runId ? `${serverUrl}/${repo}/actions/runs/${runId}` : null
const runDate   = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

async function jiraPost(path, body) {
  return fetch(`${JIRA_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

async function addComment(issueKey) {
  const icon   = status === 'pass' ? '✅' : '❌'
  const result = status === 'pass' ? 'PASSED' : 'FAILED'

  const body = {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `${icon} ${result}`, marks: [{ type: 'strong' }] },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `Run: ${runDate}` },
          ...(sha ? [{ type: 'hardBreak' }, { type: 'text', text: `Commit: ${sha}` }] : []),
          ...(runUrl ? [
            { type: 'hardBreak' },
            { type: 'text', text: 'CI run ' },
            { type: 'inlineCard', attrs: { url: runUrl } },
          ] : []),
        ],
      },
    ],
  }

  const res = await jiraPost(`/rest/api/3/issue/${issueKey}/comment`, { body })
  return res.status === 201 || res.status === 200
}

let passed = 0
let failed = 0

for (const key of issueKeys) {
  const url = `${JIRA_BASE_URL}/rest/api/3/issue/${key}/transitions`
  try {
    const [transRes, commentOk] = await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ transition: { id: transitionId } }),
      }),
      addComment(key),
    ])

    const transOk = transRes.status === 204 || transRes.status === 200
    if (transOk && commentOk) {
      console.log(`✓ ${key} → ${status === 'pass' ? 'Done' : 'In Progress'} + comment`)
      passed++
    } else {
      if (!transOk) {
        const body = await transRes.text()
        console.error(`✗ ${key} transition HTTP ${transRes.status}: ${body}`)
      }
      if (!commentOk) console.error(`✗ ${key} comment failed`)
      failed++
    }
  } catch (err) {
    console.error(`✗ ${key} → ${err.message}`)
    failed++
  }
}

console.log(`\nJira update: ${passed} succeeded, ${failed} failed`)
if (failed > 0) process.exit(1)
