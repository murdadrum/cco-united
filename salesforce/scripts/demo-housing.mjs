/**
 * CCO United — Housing Inquiry Demo Import
 * Inserts 5 demo Lead records representing housing inquiry submissions
 * into the orgfarm Salesforce org via REST API.
 *
 * Usage: node salesforce/scripts/demo-housing.mjs
 *        node salesforce/scripts/demo-housing.mjs --dry-run
 */

const DRY_RUN = process.argv.includes('--dry-run')

async function getSfToken() {
  const username     = process.env.SF_USERNAME
  const password     = process.env.SF_PASSWORD
  const token        = process.env.SF_SECURITY_TOKEN ?? ''
  const loginUrl     = process.env.SF_LOGIN_URL ?? 'https://login.salesforce.com'
  const clientId     = process.env.SF_CLIENT_ID ?? ''
  const clientSecret = process.env.SF_CLIENT_SECRET ?? ''

  if (!username || !password) throw new Error('SF_USERNAME and SF_PASSWORD are required.')

  const body = new URLSearchParams({
    grant_type: 'password', client_id: clientId, client_secret: clientSecret,
    username, password: password + token,
  })

  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`SF auth failed (${res.status}): ${await res.text()}`)
  const json = await res.json()
  return { accessToken: json.access_token, instanceUrl: json.instance_url }
}

async function sfPost(instanceUrl, accessToken, sobject, payload) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] POST /sobjects/${sobject}`, JSON.stringify(payload, null, 2))
    return { id: `DRY_${sobject}_${Math.random().toString(36).slice(2, 8)}`, success: true }
  }
  const res = await fetch(`${instanceUrl}/services/data/v66.0/sobjects/${sobject}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`SF ${sobject} POST failed: ${JSON.stringify(json)}`)
  return json
}

function buildLead({ firstName, lastName, email, phone, program, message }) {
  const description = [
    `Program Interest: ${program}`,
    message ? `\nMessage: ${message}` : '',
  ].join('').trim()

  return {
    FirstName:   firstName,
    LastName:    lastName,
    Email:       email,
    Phone:       phone ?? null,
    Company:     'CCO United Housing Inquiry',
    LeadSource:  'Web',
    Description: description,
  }
}

const HOUSING_SUBMISSIONS = [
  {
    firstName: 'Angela',
    lastName:  'Bigfeather',
    email:     'angela.bigfeather@example.com',
    phone:     '(918) 555-1101',
    program:   'Emergency Shelter',
    message:   'My family of four was displaced after a fire last week. We need immediate shelter assistance and any help with replacing basic necessities. Wado.',
  },
  {
    firstName: 'Marcus',
    lastName:  'Thornton',
    email:     'marcus.thornton@example.com',
    phone:     '(918) 555-1202',
    program:   'Rental Assistance',
    message:   'I am two months behind on rent due to a medical leave from work. I have a repayment plan in place but need a bridge to avoid eviction. My landlord has agreed to hold through the end of the month.',
  },
  {
    firstName: 'Ruth',
    lastName:  'Downing',
    email:     'ruth.downing@example.com',
    phone:     '(918) 555-1303',
    program:   'Elder Housing',
    message:   'I am inquiring on behalf of my 78-year-old mother who is currently living alone in a home that needs significant accessibility modifications. She would also benefit from a senior living community if one is available through the CCO program.',
  },
  {
    firstName: 'Darnell',
    lastName:  'Sixkiller',
    email:     'darnell.sixkiller@example.com',
    phone:     '(918) 555-1404',
    program:   'Homeownership Paths',
    message:   'My wife and I have been renting for seven years and are ready to pursue homeownership. We are looking for guidance on down payment assistance, credit counseling, and any CN-affiliated lending programs.',
  },
  {
    firstName: 'Connie',
    lastName:  'Raincrow',
    email:     'connie.raincrow@example.com',
    phone:     null,
    program:   'Utility Relief',
    message:   'Our electricity was shut off three days ago. I have three children at home. I applied through the utility company but was told to seek community assistance in the meantime. Any help is appreciated.',
  },
]

async function main() {
  console.log(`\n╔══════════════════════════════════════════╗`)
  console.log(`║   CCO United — Housing Inquiry Import    ║`)
  console.log(`║   5 Demo Lead Records                    ║`)
  if (DRY_RUN) console.log(`║   MODE: DRY RUN (no data written)        ║`)
  console.log(`╚══════════════════════════════════════════╝\n`)

  let accessToken, instanceUrl
  if (!DRY_RUN) {
    console.log('Authenticating to Salesforce...')
    ;({ accessToken, instanceUrl } = await getSfToken())
    console.log(`✓ Authenticated → ${instanceUrl}\n`)
  }

  console.log('── Housing Inquiry Leads ────────────────────────')
  const results = []
  for (const sub of HOUSING_SUBMISSIONS) {
    const lead = buildLead(sub)
    const fullName = `${sub.firstName} ${sub.lastName}`
    try {
      const result = await sfPost(instanceUrl, accessToken, 'Lead', lead)
      results.push({ name: fullName, id: result.id, ok: true })
      console.log(`  ✓ ${fullName} [${sub.program}] → ${result.id}`)
    } catch (e) {
      results.push({ name: fullName, id: null, ok: false, error: e.message })
      console.error(`  ✗ ${fullName}: ${e.message}`)
    }
  }

  const pass = results.filter(r => r.ok).length
  const fail = results.filter(r => !r.ok).length
  console.log(`\n── Summary ──────────────────────────────────────`)
  console.log(`  Leads: ${pass} inserted, ${fail} failed`)
  console.log(`  Total: ${pass} records${DRY_RUN ? ' (dry run)' : ' written to Salesforce'}\n`)

  if (fail > 0) process.exit(1)
}

main().catch(e => { console.error(e.message); process.exit(1) })
