const SLACK_CHANNEL = '#ccou-notifications'

export async function postSlackMessage(blocks: object[], text: string): Promise<void> {
  const token = process.env.SLACK_ACCESS_TOKEN
  if (!token) return

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel: SLACK_CHANNEL, text, blocks }),
  })
}

export function housingBlocks(
  name: string, email: string, phone: string | undefined,
  program: string, caseId: string, isEmergency: boolean
) {
  const ref = caseId.slice(-6).toUpperCase()
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: isEmergency ? '🚨 EMERGENCY — Housing Inquiry' : '🏠 New Housing Inquiry' },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${name}` },
        { type: 'mrkdwn', text: `*Program:*\n${program}` },
        { type: 'mrkdwn', text: `*Email:*\n${email}` },
        { type: 'mrkdwn', text: `*Phone:*\n${phone || '(not provided)'}` },
        { type: 'mrkdwn', text: `*SF Case ID:*\n${caseId}` },
        { type: 'mrkdwn', text: `*Ref #:*\n${ref}` },
      ],
    },
    { type: 'divider' },
  ]
}

export function eventBlocks(
  title: string, ccoOrg: string, submittedBy: string,
  email: string, eventType: string, dateTime: string, recordId: string
) {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📅 New Event Submission' },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Event:*\n${title}` },
        { type: 'mrkdwn', text: `*Type:*\n${eventType}` },
        { type: 'mrkdwn', text: `*CCO Org:*\n${ccoOrg}` },
        { type: 'mrkdwn', text: `*Date/Time:*\n${dateTime}` },
        { type: 'mrkdwn', text: `*Submitted By:*\n${submittedBy}` },
        { type: 'mrkdwn', text: `*Email:*\n${email}` },
        { type: 'mrkdwn', text: `*SF Record ID:*\n${recordId}` },
      ],
    },
    { type: 'divider' },
  ]
}
