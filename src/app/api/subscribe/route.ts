import { NextRequest, NextResponse } from 'next/server'
import { getSfToken, invalidateSfToken } from '@/lib/sfAuth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const { email, name } = await req.json().catch(() => ({}))

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  let token: string
  let instanceUrl: string
  try {
    ;({ token, instanceUrl } = await getSfToken())
  } catch (err) {
    console.error('SF token error', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const [firstName, ...rest] = (name?.trim() ?? '').split(' ')
  const lastName = rest.join(' ') || 'Subscriber'

  const leadBody = {
    FirstName: firstName || 'CCO',
    LastName: lastName,
    Email: email,
    LeadSource: 'Web',
    Company: 'CCO United Subscriber',
    Description: 'Subscribed to CCO United event updates via public site.',
  }

  const sfRes = await fetch(
    `${instanceUrl}/services/data/v66.0/sobjects/Lead`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadBody),
    }
  )

  if (!sfRes.ok) {
    const err = await sfRes.text()
    console.error('SF Lead create error', err)
    if (sfRes.status === 401) invalidateSfToken()
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
