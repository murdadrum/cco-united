import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { name, email, org, role, interest, message } = await req.json()

  if (!name || !email || !org) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.RESEND_TO_EMAIL!,
    replyTo: email,
    subject: `CCO United — New founding member request: ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Organization: ${org}`,
      `Role: ${role || '(not provided)'}`,
      `Area of interest: ${interest || '(not provided)'}`,
      `Message: ${message || '(not provided)'}`,
    ].join('\n'),
  })

  if (error) {
    console.error('Resend error', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
