import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { getSfToken, invalidateSfToken } from '@/lib/sfAuth'

export async function POST(req: NextRequest) {
  const { name, email, phone, program, message } = await req.json()

  if (!name || !email || !program) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const details = message || `Program Interest: ${program}`
  const isEmergency = program === 'Emergency Shelter'

  // ── Create SF Case ────────────────────────────────────────────────────────
  let token: string
  let instanceUrl: string
  try {
    ;({ token, instanceUrl } = await getSfToken())
  } catch (err) {
    console.error('SF token error', err)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const caseBody = {
    Subject:       `Housing Request: ${name}`,
    SuppliedName:  name,
    SuppliedEmail: email,
    SuppliedPhone: phone || null,
    Description:   `Program Interest: ${program}\n\n${details}`,
    Type:          program,
    Priority:      isEmergency ? 'High' : 'Medium',
    Status:        'New',
    Origin:        'Web',
  }

  const sfRes = await fetch(
    `${instanceUrl}/services/data/v66.0/sobjects/Case`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(caseBody),
    }
  )

  if (!sfRes.ok) {
    const errText = await sfRes.text()
    console.error('SF Case create error', errText)
    if (sfRes.status === 401) invalidateSfToken()
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  const { id: caseId } = await sfRes.json()

  // ── Send confirmation + admin emails (non-blocking) ───────────────────────
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await Promise.all([
      // Confirmation to applicant
      resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL!,
        to:      email,
        subject: `CCO United Housing — Request Received (Ref: ${caseId.slice(-6).toUpperCase()})`,
        text: [
          `Ôsiyo ${name},`,
          '',
          `Your housing inquiry has been received. A CCO housing coordinator will follow up within 2 business days.`,
          '',
          `Reference number: ${caseId.slice(-6).toUpperCase()}`,
          `Program: ${program}`,
          phone ? `Phone: ${phone}` : '',
          message ? `\nYour message:\n${message}` : '',
          '',
          'Wado — CCO United Housing Team',
        ].filter(l => l !== undefined).join('\n'),
      }),
      // Admin notification
      resend.emails.send({
        from:    process.env.RESEND_FROM_EMAIL!,
        to:      process.env.RESEND_TO_EMAIL!,
        replyTo: email,
        subject: `[Housing${isEmergency ? ' 🚨 EMERGENCY' : ''}] ${name} — ${program}`,
        text: [
          `New housing inquiry submitted via CCO United.`,
          '',
          `SF Case ID: ${caseId}`,
          `Name:    ${name}`,
          `Email:   ${email}`,
          `Phone:   ${phone || '(not provided)'}`,
          `Program: ${program}`,
          `Priority: ${isEmergency ? 'HIGH' : 'Medium'}`,
          message ? `\nMessage:\n${message}` : '',
        ].filter(l => l !== undefined).join('\n'),
      }),
    ])
  } catch (emailErr) {
    console.error('Resend error (non-fatal)', emailErr)
  }

  return NextResponse.json({ ok: true, caseId })
}
