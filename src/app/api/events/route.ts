import { NextResponse } from 'next/server'
import type { CCOEvent, EventsApiResponse } from '@/lib/mondayTypes'

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

export async function GET() {
  const apiKey = process.env.MONDAY_API_KEY
  const boardId = process.env.MONDAY_EVENTS_BOARD_ID
  const groupId = process.env.MONDAY_EVENTS_GROUP_ID

  if (!apiKey || !boardId || !groupId) {
    return NextResponse.json({ error: 'Missing Monday.com configuration' }, { status: 500 })
  }

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
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 502 })
    }

    const json = await res.json()
    const items: { id: string; name: string; column_values: { id: string; text: string }[] }[] =
      json?.data?.boards?.[0]?.groups?.[0]?.items_page?.items ?? []

    const events: CCOEvent[] = items
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
        isPublic: true, // already filtered above
        description: col(item.column_values, 'long_text_mm3wd4nk') || null,
      }))
      .sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

    const response: EventsApiResponse = { events, fetchedAt: new Date().toISOString() }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 502 })
  }
}
