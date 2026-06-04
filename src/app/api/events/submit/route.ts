import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { title, ccoOrg, dateTime, location, eventType, isPublic,
          submittedBy, email, description } = await req.json()

  if (!title || !ccoOrg || !dateTime || !location || !eventType || !submittedBy || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Parse datetime-local value (YYYY-MM-DDTHH:MM) into Monday's date/time format
  const [datePart, timePart] = (dateTime as string).split('T')
  const timeFormatted = timePart ? `${timePart}:00` : '00:00:00'

  const columnValues = JSON.stringify({
    dropdown_mm3wv6ax: { ids: [parseInt(ccoOrg, 10)] },
    date_mm3wkeye: { date: datePart, time: timeFormatted },
    location_mm3wrcrr: { address: location },
    dropdown_mm3w9yyc: { ids: [parseInt(eventType, 10)] },
    boolean_mm3wsfmn: isPublic ? 'true' : 'false',
    text_mm3w87h6: submittedBy,
    email_mm3w2zs6: { email, text: email },
    long_text_mm3wd4nk: { text: description || '' },
  })

  const query = `
    mutation CreateEvent($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item(
        board_id: $boardId
        group_id: $groupId
        item_name: $itemName
        column_values: $columnValues
      ) { id }
    }
  `

  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MONDAY_API_KEY}`,
      'API-Version': '2023-10',
    },
    body: JSON.stringify({
      query,
      variables: {
        boardId: '18415647485',
        groupId: 'group_mm3wccdn',
        itemName: title,
        columnValues,
      },
    }),
  })

  const data = await res.json()

  if (data.errors?.length) {
    console.error('Monday API error', data.errors)
    return NextResponse.json({ error: 'Failed to submit event' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.data?.create_item?.id })
}
