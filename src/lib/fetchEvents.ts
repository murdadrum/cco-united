import type { CCOEvent } from './mondayTypes'

const QUERY = `
  query GetPublicEvents($boardId: ID!, $groupId: String!) {
    boards(ids: [$boardId]) {
      groups(ids: [$groupId]) {
        items_page(limit: 50) {
          items {
            id
            name
            column_values(ids: [
              "date_mm3wkeye",
              "dropdown_mm3wv6ax",
              "dropdown_mm3w9yyc",
              "boolean_mm3wsfmn",
              "long_text_mm3wd4nk"
            ]) {
              id
              text
              value
            }
          }
        }
      }
    }
  }
`

function col(columnValues: { id: string; text: string }[], colId: string): string {
  return columnValues.find(c => c.id === colId)?.text ?? ''
}

export async function fetchPublicEvents(): Promise<CCOEvent[]> {
  const apiKey = process.env.MONDAY_API_KEY
  const boardId = process.env.MONDAY_EVENTS_BOARD_ID
  const groupId = process.env.MONDAY_EVENTS_GROUP_ID

  if (!apiKey || !boardId || !groupId) return []

  try {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
        'API-Version': '2023-10',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { boardId, groupId },
      }),
      next: { revalidate: 300 },
    })

    if (!res.ok) return []

    const json = await res.json()
    const items: { id: string; name: string; column_values: { id: string; text: string }[] }[] =
      json?.data?.boards?.[0]?.groups?.[0]?.items_page?.items ?? []

    return items
      .filter(item => {
        const val = col(item.column_values, 'boolean_mm3wsfmn')
        return val === 'true' || val === 'v'
      })
      .map(item => ({
        id: item.id,
        name: item.name,
        date: col(item.column_values, 'date_mm3wkeye') || null,
        time: null,
        organization: col(item.column_values, 'dropdown_mm3wv6ax') || null,
        eventType: col(item.column_values, 'dropdown_mm3w9yyc') || null,
        isPublic: true,
        description: col(item.column_values, 'long_text_mm3wd4nk') || null,
      }))
      .sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
  } catch {
    return []
  }
}
