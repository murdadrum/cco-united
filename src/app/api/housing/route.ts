import { NextRequest, NextResponse } from 'next/server'
import { getSfToken, invalidateSfToken } from '@/lib/sfAuth'

export async function POST(req: NextRequest) {
  const { name, email, phone, details, requestType } = await req.json()

  if (!name || !email || !details || !requestType) {
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

  const caseBody = {
    Subject: `Housing Request: ${name}`,
    SuppliedName: name,
    SuppliedEmail: email,
    SuppliedPhone: phone ?? null,
    Description: details,
    Type: requestType,
    Priority: requestType === 'Emergency' ? 'High' : 'Medium',
    Status: 'New',
    Origin: 'Web',
  }

  const sfRes = await fetch(
    `${instanceUrl}/services/data/v66.0/sobjects/Case`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(caseBody),
    }
  )

  if (!sfRes.ok) {
    const err = await sfRes.text()
    console.error('SF Case create error', err)
    if (sfRes.status === 401) invalidateSfToken()
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  const { id: caseId } = await sfRes.json()
  return NextResponse.json({ ok: true, caseId })
}
