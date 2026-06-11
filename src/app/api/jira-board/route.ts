import { NextResponse } from 'next/server'

export const revalidate = 300

const JIRA_BASE = 'https://cco-united.atlassian.net'
const JIRA_EMAIL = 'josh@joshbarteaux.com'

async function jiraFetch(path: string) {
  const token = process.env.JIRA_API_TOKEN
  if (!token) return null
  const auth = Buffer.from(`${JIRA_EMAIL}:${token}`).toString('base64')
  const res = await fetch(`${JIRA_BASE}${path}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
    next: { revalidate: 300 },
  })
  if (!res.ok) return null
  return res.json()
}

export async function GET() {
  const data = await jiraFetch('/rest/api/3/search/jql?' + new URLSearchParams({
    jql: 'project = SCRUM ORDER BY key ASC',
    maxResults: '200',
    fields: 'summary,status,issuetype,parent',
  }).toString())

  if (!data) return NextResponse.json({ error: 'Jira unavailable' }, { status: 503 })

  return NextResponse.json(data.issues ?? [], {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  })
}
