import type { MondayGrant, MondayGrantProvider } from './sfTypes'

const PIPELINE_BOARD_ID = '18417383367'
const PROVIDERS_BOARD_ID = '18417383365'

const PIPELINE_QUERY = `
  query {
    boards(ids: [${PIPELINE_BOARD_ID}]) {
      groups {
        id
        title
        items_page(limit: 50) {
          items {
            id
            name
            column_values(ids: ["status", "date4", "numbers", "connect_boards"]) {
              id
              text
              value
            }
          }
        }
      }
    }
  }
`.trim()

const PROVIDERS_QUERY = `
  query {
    boards(ids: [${PROVIDERS_BOARD_ID}]) {
      groups(ids: ["topics"]) {
        items_page(limit: 50) {
          items {
            id
            name
            column_values(ids: ["text", "phone", "email"]) {
              id
              text
              value
            }
          }
        }
      }
    }
  }
`.trim()

interface MondayColumnValue {
  id: string
  text: string
  value: string | null
}

interface MondayItem {
  id: string
  name: string
  column_values: MondayColumnValue[]
}

interface MondayGroup {
  id: string
  title: string
  items_page: { items: MondayItem[] }
}

function col(item: MondayItem, colId: string): string {
  return item.column_values.find(c => c.id === colId)?.text ?? ''
}

async function mondayFetch(query: string): Promise<unknown> {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) return null
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    next: { revalidate: 300 },
  })
  if (!res.ok) return null
  return res.json()
}

export async function fetchMondayGrants(): Promise<MondayGrant[]> {
  try {
    const json = await mondayFetch(PIPELINE_QUERY) as { data?: { boards?: [{ groups?: MondayGroup[] }] } } | null
    const groups: MondayGroup[] = json?.data?.boards?.[0]?.groups ?? []
    const results: MondayGrant[] = []
    for (const group of groups) {
      for (const item of group.items_page.items) {
        const amountText = col(item, 'numbers')
        const amount = amountText ? parseFloat(amountText) : null
        results.push({
          id: item.id,
          name: item.name,
          status: col(item, 'status') || null,
          dueDate: col(item, 'date4') || null,
          amount: isNaN(amount as number) ? null : amount,
          provider: col(item, 'connect_boards') || null,
          group: group.title,
        })
      }
    }
    return results
  } catch {
    return []
  }
}

export async function fetchMondayGrantProviders(): Promise<MondayGrantProvider[]> {
  try {
    const json = await mondayFetch(PROVIDERS_QUERY) as { data?: { boards?: [{ groups?: [{ items_page: { items: MondayItem[] } }] }] } } | null
    const items: MondayItem[] = json?.data?.boards?.[0]?.groups?.[0]?.items_page?.items ?? []
    return items.map(item => ({
      id: item.id,
      name: item.name,
      contact: col(item, 'text') || null,
      phone: col(item, 'phone') || null,
      email: col(item, 'email') || null,
    }))
  } catch {
    return []
  }
}
