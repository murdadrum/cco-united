import { getSfToken, invalidateSfToken } from './sfAuth'

export interface MigrationStatus {
  sf: { ccos: number; events: number; contacts: number; fetchedAt: string }
  monday: { ccos: number; events: number; fetchedAt: string }
  jiraUrl: string
}

const JIRA_URL = 'https://cco-united.atlassian.net/jira/core/projects/CUE/board'

async function sfCount(token: string, instanceUrl: string, soql: string): Promise<number> {
  const url = `${instanceUrl}/services/data/v66.0/query?q=${encodeURIComponent(soql)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) { invalidateSfToken(); return 0 }
  if (!res.ok) return 0
  const data = await res.json()
  return data.totalSize ?? 0
}

async function mondayCount(boardId: number): Promise<number> {
  const query = `query { boards(ids: [${boardId}]) { items_page(limit: 500) { items { id } } } }`
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MONDAY_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) return 0
  const data = await res.json()
  return data.data?.boards?.[0]?.items_page?.items?.length ?? 0
}

export async function fetchMigrationStatus(): Promise<MigrationStatus> {
  const [sfResult, mondayResult] = await Promise.allSettled([
    (async () => {
      const { token, instanceUrl } = await getSfToken()
      const [ccos, events, contacts] = await Promise.all([
        sfCount(token, instanceUrl, 'SELECT COUNT() FROM Account'),
        sfCount(token, instanceUrl, 'SELECT COUNT() FROM Event__c'),
        sfCount(token, instanceUrl, 'SELECT COUNT() FROM Contact'),
      ])
      return { ccos, events, contacts, fetchedAt: new Date().toISOString() }
    })(),
    (async () => {
      const [ccos, events] = await Promise.all([
        mondayCount(18415645308),
        mondayCount(18415647485),
      ])
      return { ccos, events, fetchedAt: new Date().toISOString() }
    })(),
  ])

  return {
    sf: sfResult.status === 'fulfilled'
      ? sfResult.value
      : { ccos: 0, events: 0, contacts: 0, fetchedAt: new Date().toISOString() },
    monday: mondayResult.status === 'fulfilled'
      ? mondayResult.value
      : { ccos: 0, events: 0, fetchedAt: new Date().toISOString() },
    jiraUrl: JIRA_URL,
  }
}
