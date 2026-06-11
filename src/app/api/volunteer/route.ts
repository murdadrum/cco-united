import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const BOARD_ID = '18417387415'
const NEW_GROUP_ID = 'topics'

export async function POST(req: NextRequest) {
  const { name, email, phone, location, skills, hours, startDate, message } = await req.json()

  if (!name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const apiKey = process.env.MONDAY_API_KEY
  if (apiKey) {
    try {
      const colVals: Record<string, unknown> = {}
      if (email) colVals['email'] = { email, text: email }
      if (phone) colVals['phone'] = { phone, countryShortName: 'US' }
      if (skills?.length) colVals['dropdown'] = { labels: skills }
      if (hours) colVals['status_1'] = { label: hours }
      if (startDate) colVals['date4'] = { date: startDate }

      await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation($boardId: ID!, $groupId: String!, $name: String!, $colVals: JSON!) {
              create_item(board_id: $boardId group_id: $groupId item_name: $name column_values: $colVals create_labels_if_missing: true) { id }
            }
          `,
          variables: {
            boardId: BOARD_ID,
            groupId: NEW_GROUP_ID,
            name,
            colVals: JSON.stringify(colVals),
          },
        }),
      })
    } catch (err) {
      console.error('Monday create_item error', err)
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.RESEND_TO_EMAIL!,
    replyTo: email,
    subject: `CCO United — New volunteer registration: ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || '(not provided)'}`,
      `Location: ${location || '(not provided)'}`,
      `Skills: ${skills?.join(', ') || '(not provided)'}`,
      `Hours/week: ${hours || '(not provided)'}`,
      `Available to start: ${startDate || '(not provided)'}`,
      `About: ${message || '(not provided)'}`,
    ].join('\n'),
  })

  if (error) {
    console.error('Resend error', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
