import { NextRequest, NextResponse } from 'next/server'

interface TokenResponse {
  access_token: string
  instance_url: string
}

let cachedToken: { token: string; instanceUrl: string; expiresAt: number } | null = null

async function getSfToken(): Promise<{ token: string; instanceUrl: string }> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { token: cachedToken.token, instanceUrl: cachedToken.instanceUrl }
  }

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: process.env.SF_CLIENT_ID!,
    client_secret: process.env.SF_CLIENT_SECRET!,
    username: process.env.SF_USERNAME!,
    password: process.env.SF_PASSWORD! + (process.env.SF_SECURITY_TOKEN ?? ''),
  })

  const res = await fetch(
    `${process.env.SF_INSTANCE_URL}/services/oauth2/token`,
    { method: 'POST', body: params }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SF auth failed: ${err}`)
  }

  const data: TokenResponse = await res.json()
  // Cache for 1 hour (SF access tokens last 2 hours by default)
  cachedToken = {
    token: data.access_token,
    instanceUrl: data.instance_url,
    expiresAt: Date.now() + 60 * 60 * 1000,
  }
  return { token: cachedToken.token, instanceUrl: cachedToken.instanceUrl }
}

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
    // Invalidate cached token on 401
    if (sfRes.status === 401) cachedToken = null
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  const { id: caseId } = await sfRes.json()
  return NextResponse.json({ ok: true, caseId })
}
