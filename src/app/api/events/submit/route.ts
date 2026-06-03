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
    mutation {
      create_item(
        board_id: 18415647485
        group_id: "group_mm3wccdn"
        item_name: ${JSON.stringify(title)}
        column_values: ${JSON.stringify(columnValues)}
      ) { id }
    }
  `

  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MONDAY_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  })

  const data = await res.json()

  if (data.errors?.length) {
    console.error('Monday API error', data.errors)
    return NextResponse.json({ error: 'Failed to submit event' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.data?.create_item?.id })
}
