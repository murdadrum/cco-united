import { NextRequest, NextResponse } from 'next/server'
import { getSfToken, invalidateSfToken } from '@/lib/sfAuth'
import { postSlackMessage, eventBlocks } from '@/lib/slack'

export async function POST(req: NextRequest) {
  const { title, ccoOrg, dateTime, location, eventType, isPublic,
          submittedBy, email, description } = await req.json()

  if (!title || !ccoOrg || !dateTime || !location || !eventType || !submittedBy || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let token: string
  let instanceUrl: string
  try {
    ;({ token, instanceUrl } = await getSfToken())
  } catch (err) {
    console.error('SF token error', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const eventBody = {
    Name: title,
    CCO_Organization__c: ccoOrg,
    Event_Date__c: dateTime,
    Location__c: location,
    Event_Type__c: eventType,
    Is_Public__c: isPublic ?? false,
    Submitted_By__c: submittedBy,
    Submitter_Email__c: email,
    Description__c: description ?? '',
    Status__c: 'Pending Review',
  }

  const sfRes = await fetch(
    `${instanceUrl}/services/data/v66.0/sobjects/Event__c`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    }
  )

  if (!sfRes.ok) {
    const err = await sfRes.text()
    console.error('SF Event__c create error', err)
    if (sfRes.status === 401) invalidateSfToken()
    return NextResponse.json({ error: 'Failed to submit event' }, { status: 500 })
  }

  const { id } = await sfRes.json()

  // ── Slack notification (non-blocking) ────────────────────────────────────
  postSlackMessage(
    eventBlocks(title, ccoOrg, submittedBy, email, eventType, dateTime, id),
    `📅 New event submitted: ${title} by ${submittedBy}`
  ).catch(err => console.error('Slack notify error (non-fatal)', err))

  return NextResponse.json({ ok: true, id })
}
