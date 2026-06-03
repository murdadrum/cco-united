import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MUTATION = `
  mutation CreateSubscriber($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
    create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
      id
    }
  }
`

export async function POST(req: NextRequest) {
  const { email, name } = await req.json().catch(() => ({}))

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const apiKey = process.env.MONDAY_API_KEY
  const boardId = process.env.MONDAY_SUBSCRIBERS_BOARD_ID

  if (!apiKey || !boardId) {
    return NextResponse.json({ error: 'Missing configuration' }, { status: 500 })
  }

  const today = new Date().toISOString().split('T')[0]
  const columnValues = JSON.stringify({
    email_mm3y7jse: { email, text: email },
    date_mm3yf68t: { date: today },
  })

  try {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
        'API-Version': '2023-10',
      },
      body: JSON.stringify({
        query: MUTATION,
        variables: {
          boardId,
          itemName: name?.trim() || email,
          columnValues,
        },
      }),
    })

    const json = await res.json()
    if (json?.errors?.length) {
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
