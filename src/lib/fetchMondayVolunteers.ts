import type { MondayVolunteer } from './sfTypes'

const BOARD_ID = '18417387415'

const QUERY = `
  query {
    boards(ids: [${BOARD_ID}]) {
      groups {
        id
        title
        items_page(limit: 100) {
          items {
            id
            name
            column_values(ids: ["status", "email", "phone", "location", "dropdown", "status_1", "date4"]) {
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

export async function fetchMondayVolunteers(): Promise<MondayVolunteer[]> {
  try {
    const json = await mondayFetch(QUERY) as { data?: { boards?: [{ groups?: MondayGroup[] }] } } | null
    const groups: MondayGroup[] = json?.data?.boards?.[0]?.groups ?? []
    const results: MondayVolunteer[] = []
    for (const group of groups) {
      for (const item of group.items_page.items) {
        results.push({
          id: item.id,
          name: item.name,
          status: col(item, 'status') || null,
          email: col(item, 'email') || null,
          phone: col(item, 'phone') || null,
          location: col(item, 'location') || null,
          skills: col(item, 'dropdown') || null,
          hoursPerWeek: col(item, 'status_1') || null,
          startDate: col(item, 'date4') || null,
          group: group.title,
        })
      }
    }
    return results
  } catch {
    return []
  }
}
