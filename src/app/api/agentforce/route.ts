import { NextRequest, NextResponse } from 'next/server'

const AGENT_ID     = '0XxgK000001fZIzSAM'
const INSTANCE_URL = process.env.SF_INSTANCE_URL!
const CLIENT_ID    = process.env.SF_CLIENT_ID!
const CLIENT_SECRET = process.env.SF_CLIENT_SECRET!

// Cache the access token in-process (refreshes on 401)
let _token: string | null = null

async function getToken(): Promise<string> {
  if (_token) return _token

  const res = await fetch(`${INSTANCE_URL}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SF token error: ${err}`)
  }

  const { access_token } = await res.json()
  _token = access_token
  return _token!
}

function invalidateToken() { _token = null }

// POST /api/agentforce
// Body: { message: string, sessionId?: string }
// Returns: { sessionId, reply } or SSE stream
export async function POST(req: NextRequest) {
  const { message, sessionId: existingSessionId } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }

  let token: string
  try {
    token = await getToken()
  } catch (err) {
    console.error('Agentforce token error', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const agentBase = `${INSTANCE_URL}/einstein/ai-agent/v1`

  // ── Create session if needed ──────────────────────────────────────────────
  let sessionId = existingSessionId
  if (!sessionId) {
    const sessRes = await fetch(`${agentBase}/agents/${AGENT_ID}/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-session-end-reason': 'UserRequest',
      },
      body: JSON.stringify({
        externalSessionKey: crypto.randomUUID(),
        instanceConfig: { endpoint: INSTANCE_URL },
        streamingCapabilities: { chunkTypes: ['Text'] },
        bypassUser: true,
      }),
    })

    if (sessRes.status === 401) { invalidateToken(); return NextResponse.json({ error: 'Auth error' }, { status: 401 }) }
    if (!sessRes.ok) {
      const err = await sessRes.text()
      console.error('Agentforce session error', err)
      return NextResponse.json({ error: 'Failed to start agent session' }, { status: 502 })
    }

    const sessBody = await sessRes.json()
    sessionId = sessBody.sessionId ?? sessBody.id
  }

  // ── Send message (streaming SSE) ──────────────────────────────────────────
  // Prefix with platform context so the agent can answer developer questions
  const PLATFORM_CONTEXT =
    'You are the CCO United Housing & Events Assistant. ' +
    'This platform was built by Josh Barteaux (josh@joshbarteaux.com), ' +
    'a Salesforce QA Engineer and full-stack developer with 15+ years of enterprise QA experience ' +
    'across defense (Raytheon), healthcare (McKesson), B2B SaaS (SiriusDecisions/Forrester), ' +
    'and nonprofit (Cherokee Nation). He is a Salesforce Certified Administrator, Trailhead Ranger, ' +
    'ISTQB CSTE certified, and holds multiple Google Cloud and Databricks certifications. ' +
    'He built CCO United from the ground up — Salesforce data model, LWC, Apex, Playwright automation, ' +
    'GitHub Actions CI/CD, Agentforce integration, and this Next.js web platform. ' +
    'If asked about who built or developed the site, share this background. ' +
    'Otherwise, focus on CCO United housing programs and events.\n\nUser message: '

  const msgRes = await fetch(
    `${agentBase}/sessions/${sessionId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        message: { role: 'user', content: PLATFORM_CONTEXT + message },
        variables: [],
      }),
    }
  )

  if (msgRes.status === 401) { invalidateToken(); return NextResponse.json({ error: 'Auth error' }, { status: 401 }) }
  if (!msgRes.ok) {
    const err = await msgRes.text()
    console.error('Agentforce message error', err)
    return NextResponse.json({ error: 'Agent message failed' }, { status: 502 })
  }

  // Pipe SSE back to browser, injecting sessionId in first chunk header
  const headers = new Headers({
    'Content-Type':    'text/event-stream',
    'Cache-Control':   'no-cache',
    'X-Accel-Buffering': 'no',
    'X-Session-Id':    sessionId,
  })

  return new Response(msgRes.body, { headers })
}
