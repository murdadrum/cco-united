/**
 * CCO United — Demo Import
 * Inserts 10 CCO Organizations (Account) + 10 Events (Event__c)
 * into the orgfarm Salesforce org via REST API.
 *
 * Usage: node salesforce/scripts/demo-import.mjs
 * Requires: SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN, SF_LOGIN_URL in env
 *   OR pass --dry-run to print the payloads without hitting the org.
 */

const DRY_RUN = process.argv.includes('--dry-run')

// ── Auth ─────────────────────────────────────────────────────────────────────

async function getSfToken() {
  const username  = process.env.SF_USERNAME
  const password  = process.env.SF_PASSWORD
  const token     = process.env.SF_SECURITY_TOKEN ?? ''
  const loginUrl  = process.env.SF_LOGIN_URL ?? 'https://login.salesforce.com'
  const clientId  = process.env.SF_CLIENT_ID ?? '3MVG9'
  const clientSecret = process.env.SF_CLIENT_SECRET ?? ''

  if (!username || !password) {
    throw new Error('SF_USERNAME and SF_PASSWORD are required. Set them in your shell.')
  }

  const body = new URLSearchParams({
    grant_type:    'password',
    client_id:     clientId,
    client_secret: clientSecret,
    username,
    password:      password + token,
  })

  const res = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SF auth failed (${res.status}): ${err}`)
  }

  const json = await res.json()
  return { accessToken: json.access_token, instanceUrl: json.instance_url }
}

// ── REST helpers ─────────────────────────────────────────────────────────────

async function sfPost(instanceUrl, accessToken, sobject, payload) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] POST /sobjects/${sobject}`, JSON.stringify(payload, null, 2))
    return { id: `DRY_${sobject}_${Math.random().toString(36).slice(2,8)}`, success: true }
  }

  const res = await fetch(
    `${instanceUrl}/services/data/v66.0/sobjects/${sobject}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  const json = await res.json()
  if (!res.ok) throw new Error(`SF ${sobject} POST failed: ${JSON.stringify(json)}`)
  return json
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const CCO_ORGS = [
  {
    Name: 'Keys Cherokee Community Organization',
    CCO_Contact_Name__c: 'Mary Sequoyah',
    CCO_Contact_Email__c: 'keys.cherokee.community@gmail.com',
    CCO_Member_Since__c: '2018-03-15',
    CCO_Status__c: 'Active',
    CCO_Mission__c: 'Preserving Cherokee language and culture in the Keys district through community gatherings, language classes, and seasonal ceremonies.',
    Phone: '(918) 555-0101',
    BillingCity: 'Sallisaw',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Tahlequah District CCO Council',
    CCO_Contact_Name__c: 'James Adair',
    CCO_Contact_Email__c: 'tahlequah.cco@cherokee.org',
    CCO_Member_Since__c: '2015-07-01',
    CCO_Status__c: 'Active',
    CCO_Mission__c: 'Coordinating cultural outreach, elder support programs, and youth mentorship for the Tahlequah district.',
    Phone: '(918) 555-0202',
    BillingCity: 'Tahlequah',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Stilwell Cherokee Heritage Society',
    CCO_Contact_Name__c: 'Dorothy Swimmer',
    CCO_Contact_Email__c: 'stilwell.heritage@cherokee.org',
    CCO_Member_Since__c: '2019-01-10',
    CCO_Status__c: 'Active',
    CCO_Mission__c: 'Protecting and celebrating Cherokee heritage sites, oral histories, and traditional arts in the Stilwell area.',
    Phone: '(918) 555-0303',
    BillingCity: 'Stilwell',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Hulbert Community Outreach',
    CCO_Contact_Name__c: 'Robert Walkingstick',
    CCO_Contact_Email__c: 'hulbert.outreach@cherokee.org',
    CCO_Member_Since__c: '2020-04-22',
    CCO_Status__c: 'Active',
    CCO_Mission__c: 'Delivering food assistance, health screenings, and family support services to Hulbert district families.',
    Phone: '(918) 555-0404',
    BillingCity: 'Hulbert',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Braggs Eagle District CCO',
    CCO_Contact_Name__c: 'Susan Bowlin',
    CCO_Contact_Email__c: 'braggs.eagle@cherokee.org',
    CCO_Member_Since__c: '2021-08-05',
    CCO_Status__c: 'Active',
    CCO_Mission__c: 'Youth leadership development, sports programs, and cultural education for Eagle District families.',
    Phone: '(918) 555-0505',
    BillingCity: 'Braggs',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Park Hill Cultural Circle',
    CCO_Contact_Name__c: 'Thomas Proctor',
    CCO_Contact_Email__c: 'parkhill.cultural@cherokee.org',
    CCO_Member_Since__c: '2017-11-30',
    CCO_Status__c: 'Active',
    CCO_Mission__c: 'Organizing stickball tournaments, stomp dances, and cultural preservation workshops in the Park Hill community.',
    Phone: '(918) 555-0606',
    BillingCity: 'Park Hill',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Gore District CCO',
    CCO_Contact_Name__c: 'Linda Cornsilk',
    CCO_Contact_Email__c: 'gore.district@cherokee.org',
    CCO_Member_Since__c: '2022-02-14',
    CCO_Status__c: 'Active',
    CCO_Mission__c: 'River district community events, elder transportation, and nutrition programs along the Arkansas River corridor.',
    Phone: '(918) 555-0707',
    BillingCity: 'Gore',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Welling Community Outreach',
    CCO_Contact_Name__c: 'George Vann',
    CCO_Contact_Email__c: 'welling.outreach@cherokee.org',
    CCO_Member_Since__c: '2023-06-01',
    CCO_Status__c: 'Pending Approval',
    CCO_Mission__c: 'New CCO focused on housing assistance, utility aid, and community resilience for the Welling area.',
    Phone: '(918) 555-0808',
    BillingCity: 'Welling',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Cookson Hills Cherokee Alliance',
    CCO_Contact_Name__c: 'Patricia Hummingbird',
    CCO_Contact_Email__c: 'cookson.alliance@cherokee.org',
    CCO_Member_Since__c: '2016-09-18',
    CCO_Status__c: 'Active',
    CCO_Mission__c: 'Rural outreach across the Cookson Hills — connecting isolated families to healthcare, education, and cultural programs.',
    Phone: '(918) 555-0909',
    BillingCity: 'Cookson',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
  {
    Name: 'Marble City Cherokee Cultural Center',
    CCO_Contact_Name__c: 'David Runningwater',
    CCO_Contact_Email__c: 'marblecity.cultural@cherokee.org',
    CCO_Member_Since__c: '2024-01-15',
    CCO_Status__c: 'Pending Approval',
    CCO_Mission__c: 'Establishing a permanent cultural center in Marble City for language immersion, traditional crafts, and community gatherings.',
    Phone: '(918) 555-1010',
    BillingCity: 'Marble City',
    BillingStateCode: 'OK',
    BillingCountryCode: 'US',
  },
]

// Events use orgName to look up the Account ID at runtime
const EVENTS_SEED = [
  {
    Name: 'Annual Stickball Tournament',
    Event_Date__c: '2026-07-12',
    Location__c: 'Park Hill Ceremonial Grounds, Park Hill, OK',
    Event_Type__c: 'Convention',
    _orgName: 'Park Hill Cultural Circle',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'Join us for the annual stickball tournament — the oldest team sport in North America. Open to all ages. Traditional food, crafts, and music throughout the day. Ôsiyo!',
    Submitted_By__c: 'Thomas Proctor',
    Submitter_Email__c: 'parkhill.cultural@cherokee.org',
  },
  {
    Name: 'Cherokee Language Immersion Workshop',
    Event_Date__c: '2026-07-19',
    Location__c: 'Keys Community Center, Sallisaw, OK',
    Event_Type__c: 'Meeting',
    _orgName: 'Keys Cherokee Community Organization',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'A full-day introductory workshop in the Cherokee syllabary and spoken language. Beginner and intermediate tracks available. Materials provided. Space is limited to 30 participants.',
    Submitted_By__c: 'Mary Sequoyah',
    Submitter_Email__c: 'keys.cherokee.community@gmail.com',
  },
  {
    Name: 'Heritage Trail Groundbreaking Ceremony',
    Event_Date__c: '2026-07-25',
    Location__c: 'Marble City Community Park, Marble City, OK',
    Event_Type__c: 'Groundbreaking',
    _orgName: 'Marble City Cherokee Cultural Center',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'Groundbreaking for the new Marble City Heritage Trail — a 1.2-mile walking path connecting the cultural center to the historic ceremonial site. Remarks by community elders. Refreshments to follow.',
    Submitted_By__c: 'David Runningwater',
    Submitter_Email__c: 'marblecity.cultural@cherokee.org',
  },
  {
    Name: 'Cookson Hills Health & Wellness Fair',
    Event_Date__c: '2026-08-02',
    Location__c: 'Cookson Community Building, Cookson, OK',
    Event_Type__c: 'Convention',
    _orgName: 'Cookson Hills Cherokee Alliance',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'Free health screenings, dental check-ups, vision tests, and nutrition counseling for Cookson Hills residents. Cherokee Nation Health Services will be on-site. No appointment necessary.',
    Submitted_By__c: 'Patricia Hummingbird',
    Submitter_Email__c: 'cookson.alliance@cherokee.org',
  },
  {
    Name: 'Youth Leadership Summit',
    Event_Date__c: '2026-08-09',
    Location__c: 'Braggs Community Center, Braggs, OK',
    Event_Type__c: 'Convention',
    _orgName: 'Braggs Eagle District CCO',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'A two-day summit for Cherokee Nation youth ages 14–22. Workshops on civic leadership, cultural identity, entrepreneurship, and college planning. Scholarship information available.',
    Submitted_By__c: 'Susan Bowlin',
    Submitter_Email__c: 'braggs.eagle@cherokee.org',
  },
  {
    Name: 'Gore River District Community Gathering',
    Event_Date__c: '2026-08-16',
    Location__c: 'Gore Riverfront Park, Gore, OK',
    Event_Type__c: 'Meeting',
    _orgName: 'Gore District CCO',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'Monthly community gathering for Gore district families. Potluck dinner, updates from community liaisons, and open time for neighbors to connect. Bring a dish to share!',
    Submitted_By__c: 'Linda Cornsilk',
    Submitter_Email__c: 'gore.district@cherokee.org',
  },
  {
    Name: 'Tahlequah Ribbon Cutting — CCO Resource Hub',
    Event_Date__c: '2026-08-22',
    Location__c: '123 W. Delaware Ave, Tahlequah, OK',
    Event_Type__c: 'Ribbon Cutting',
    _orgName: 'Tahlequah District CCO Council',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'Grand opening of the new Tahlequah CCO Resource Hub — a shared space for CCO organizations to hold meetings, workshops, and community events. Tours available all day. Wado!',
    Submitted_By__c: 'James Adair',
    Submitter_Email__c: 'tahlequah.cco@cherokee.org',
  },
  {
    Name: 'Traditional Crafts & Arts Fair',
    Event_Date__c: '2026-09-06',
    Location__c: 'Stilwell Civic Center, Stilwell, OK',
    Event_Type__c: 'Convention',
    _orgName: 'Stilwell Cherokee Heritage Society',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'A celebration of Cherokee traditional arts — basket weaving, beadwork, pottery, and regalia-making. Demonstrations by master craftspeople. Items for sale. Free admission.',
    Submitted_By__c: 'Dorothy Swimmer',
    Submitter_Email__c: 'stilwell.heritage@cherokee.org',
  },
  {
    Name: 'Hulbert Family Resource Day',
    Event_Date__c: '2026-09-13',
    Location__c: 'Hulbert School Gymnasium, Hulbert, OK',
    Event_Type__c: 'Convention',
    _orgName: 'Hulbert Community Outreach',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'One-stop resource event for Hulbert district families. SNAP enrollment assistance, WIC, housing applications, elder services signup, and back-to-school supplies for children.',
    Submitted_By__c: 'Robert Walkingstick',
    Submitter_Email__c: 'hulbert.outreach@cherokee.org',
  },
  {
    Name: 'Fall Stomp Dance & Feast',
    Event_Date__c: '2026-10-03',
    Location__c: 'Park Hill Ceremonial Grounds, Park Hill, OK',
    Event_Type__c: 'Convention',
    _orgName: 'Park Hill Cultural Circle',
    Is_Public__c: true,
    Status__c: 'Approved',
    Description__c: 'Annual fall stomp dance honoring the harvest season. Traditional food, fire-making demonstration, elder storytelling, and community dancing. All are welcome to observe and participate.',
    Submitted_By__c: 'Thomas Proctor',
    Submitter_Email__c: 'parkhill.cultural@cherokee.org',
  },
]

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n╔══════════════════════════════════════════╗`)
  console.log(`║   CCO United — Demo Import               ║`)
  console.log(`║   10 CCO Organizations + 10 Events       ║`)
  if (DRY_RUN) console.log(`║   MODE: DRY RUN (no data written)        ║`)
  console.log(`╚══════════════════════════════════════════╝\n`)

  let accessToken, instanceUrl
  if (!DRY_RUN) {
    console.log('Authenticating to Salesforce...')
    ;({ accessToken, instanceUrl } = await getSfToken())
    console.log(`✓ Authenticated → ${instanceUrl}\n`)
  }

  // Insert CCO Organizations — build name→ID map as we go
  console.log('── CCO Organizations (Account) ─────────────────')
  const orgResults = []
  const orgIdMap = {}  // name → SF record ID
  for (const org of CCO_ORGS) {
    try {
      const result = await sfPost(instanceUrl, accessToken, 'Account', org)
      orgResults.push({ name: org.Name, id: result.id, ok: true })
      orgIdMap[org.Name] = result.id
      console.log(`  ✓ ${org.Name} → ${result.id}`)
    } catch (e) {
      orgResults.push({ name: org.Name, id: null, ok: false, error: e.message })
      console.error(`  ✗ ${org.Name}: ${e.message}`)
    }
  }

  // Insert Events — resolve _orgName → CCO_Organization__c ID
  console.log('\n── Events (Event__c) ────────────────────────────')
  const eventResults = []
  for (const seed of EVENTS_SEED) {
    const { _orgName, ...ev } = seed
    const orgId = orgIdMap[_orgName]
    if (!orgId && !DRY_RUN) {
      console.error(`  ✗ ${ev.Name}: no Account ID for "${_orgName}" (org insert failed?)`)
      eventResults.push({ name: ev.Name, id: null, ok: false })
      continue
    }
    if (orgId) ev.CCO_Organization__c = orgId
    try {
      const result = await sfPost(instanceUrl, accessToken, 'Event__c', ev)
      eventResults.push({ name: ev.Name, id: result.id, ok: true })
      console.log(`  ✓ ${ev.Name} → ${result.id}`)
    } catch (e) {
      eventResults.push({ name: ev.Name, id: null, ok: false, error: e.message })
      console.error(`  ✗ ${ev.Name}: ${e.message}`)
    }
  }

  // Summary
  const ccoPass = orgResults.filter(r => r.ok).length
  const ccpFail = orgResults.filter(r => !r.ok).length
  const evPass  = eventResults.filter(r => r.ok).length
  const evFail  = eventResults.filter(r => !r.ok).length

  console.log(`\n── Summary ──────────────────────────────────────`)
  console.log(`  CCO Organizations: ${ccoPass} inserted, ${ccpFail} failed`)
  console.log(`  Events:            ${evPass} inserted, ${evFail} failed`)
  console.log(`  Total:             ${ccoPass + evPass} records${DRY_RUN ? ' (dry run)' : ' written to Salesforce'}\n`)

  if (ccpFail + evFail > 0) process.exit(1)
}

main().catch(e => { console.error(e.message); process.exit(1) })
