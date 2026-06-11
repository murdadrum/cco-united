/**
 * CCO United — Strawberry Dispatch Demo Import
 * Inserts 7 FoodDistribution__c records into the orgfarm Salesforce org.
 *
 * Usage: node salesforce/scripts/demo-nutrition.mjs [--dry-run]
 * Auth:  Uses `sf org display --target-org ccounited-orgfarm` (SF CLI must be authenticated)
 */

import { execSync } from 'child_process'

const DRY_RUN = process.argv.includes('--dry-run')
const SF_ALIAS = 'ccounited-orgfarm'

// ── Auth ─────────────────────────────────────────────────────────────────────

async function getSfToken() {
  const raw = execSync(`sf org display --target-org ${SF_ALIAS} --json`, { encoding: 'utf8' })
  const result = JSON.parse(raw).result
  return { accessToken: result.accessToken, instanceUrl: result.instanceUrl }
}

// ── REST helpers ─────────────────────────────────────────────────────────────

async function sfPost(instanceUrl, accessToken, sobject, payload) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] POST /sobjects/${sobject}`, JSON.stringify(payload, null, 2))
    return { id: `DRY_${sobject}_${Math.random().toString(36).slice(2, 8)}`, success: true }
  }
  const res = await fetch(
    `${instanceUrl}/services/data/v66.0/sobjects/${sobject}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(`SF ${sobject} POST failed: ${JSON.stringify(json)}`)
  return json
}

async function sfQuery(instanceUrl, accessToken, soql) {
  const res = await fetch(
    `${instanceUrl}/services/data/v66.0/query?q=${encodeURIComponent(soql)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`SF query failed (${res.status}): ${await res.text()}`)
  return (await res.json()).records ?? []
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const CAMPAIGNS = [
  {
    Name: 'Keys CCO Strawberry Harvest Distribution',
    Distribution_Date__c: '2026-06-28T10:00:00',
    Location__c: 'Keys Community Center, 108 N. Maple, Sallisaw, OK',
    Food_Type__c: 'Strawberry Harvest',
    Quantity_Available__c: 150,
    Status__c: 'Scheduled',
    Is_Public__c: true,
    _orgName: 'Keys Cherokee Community Organization',
    Contact_Name__c: 'Mary Sequoyah',
    Contact_Email__c: 'keys.cherokee.community@gmail.com',
    Description__c: 'Annual strawberry harvest distribution coordinated by the Keys CCO. Fresh-picked strawberries available on a first-come, first-served basis. One box per household. Wado!',
  },
  {
    Name: 'Cookson Hills Mobile Pantry',
    Distribution_Date__c: '2026-07-12T09:00:00',
    Location__c: 'Cookson Community Building, Cookson, OK',
    Food_Type__c: 'Mixed Box',
    Quantity_Available__c: 80,
    Status__c: 'Scheduled',
    Is_Public__c: true,
    _orgName: 'Cookson Hills Cherokee Alliance',
    Contact_Name__c: 'Patricia Hummingbird',
    Contact_Email__c: 'cookson.alliance@cherokee.org',
    Description__c: 'Monthly mobile pantry serving rural Cookson Hills families. Mixed boxes include canned goods, fresh produce, and pantry staples. No income verification required.',
  },
  {
    Name: 'Gore River Summer Food Box',
    Distribution_Date__c: '2026-07-26T10:00:00',
    Location__c: 'Gore Riverfront Park Pavilion, Gore, OK',
    Food_Type__c: 'Canned Goods',
    Quantity_Available__c: 60,
    Status__c: 'Scheduled',
    Is_Public__c: true,
    _orgName: 'Gore District CCO',
    Contact_Name__c: 'Linda Cornsilk',
    Contact_Email__c: 'gore.district@cherokee.org',
    Description__c: 'Summer food box distribution for Gore River district families. Canned goods, dry staples, and pantry items. Distribution runs 10am–1pm or until supplies last.',
  },
  {
    Name: 'Hulbert Family Food Day',
    Distribution_Date__c: '2026-08-09T09:00:00',
    Location__c: 'Hulbert School Gymnasium, Hulbert, OK',
    Food_Type__c: 'Mixed Box',
    Quantity_Available__c: 90,
    Status__c: 'Scheduled',
    Is_Public__c: true,
    _orgName: 'Hulbert Community Outreach',
    Contact_Name__c: 'Robert Walkingstick',
    Contact_Email__c: 'hulbert.outreach@cherokee.org',
    Description__c: 'Family food distribution day at Hulbert School. Mixed boxes with fresh produce, canned goods, and frozen items. Back-to-school supplies available for children while supplies last.',
  },
  {
    Name: 'Tahlequah Community Pantry',
    Distribution_Date__c: '2026-08-23T10:00:00',
    Location__c: 'Tahlequah CCO Resource Hub, 123 W. Delaware Ave, Tahlequah, OK',
    Food_Type__c: 'Fresh Produce',
    Quantity_Available__c: 120,
    Status__c: 'Scheduled',
    Is_Public__c: true,
    _orgName: 'Tahlequah District CCO Council',
    Contact_Name__c: 'James Adair',
    Contact_Email__c: 'tahlequah.cco@cherokee.org',
    Description__c: 'Fresh produce distribution from local Cherokee Nation farms. Seasonal vegetables, fruits, and herbs. Held at the new CCO Resource Hub. Drive-through pickup available.',
  },
  {
    Name: 'Braggs Eagle Back-to-School Food Box',
    Distribution_Date__c: '2026-09-06T09:00:00',
    Location__c: 'Braggs Community Center, Braggs, OK',
    Food_Type__c: 'Mixed Box',
    Quantity_Available__c: 75,
    Status__c: 'Scheduled',
    Is_Public__c: true,
    _orgName: 'Braggs Eagle District CCO',
    Contact_Name__c: 'Susan Bowlin',
    Contact_Email__c: 'braggs.eagle@cherokee.org',
    Description__c: 'Back-to-school food box distribution for Eagle District families. Boxes include shelf-stable items, snacks, and breakfast foods to help families start the school year strong.',
  },
  {
    Name: 'Park Hill Fall Harvest Share',
    Distribution_Date__c: '2026-10-04T10:00:00',
    Location__c: 'Park Hill Ceremonial Grounds, Park Hill, OK',
    Food_Type__c: 'Strawberry Harvest',
    Quantity_Available__c: 100,
    Status__c: 'Scheduled',
    Is_Public__c: true,
    _orgName: 'Park Hill Cultural Circle',
    Contact_Name__c: 'Thomas Proctor',
    Contact_Email__c: 'parkhill.cultural@cherokee.org',
    Description__c: 'Fall harvest share at the Park Hill Ceremonial Grounds. Strawberries, seasonal produce, and traditional foods prepared by community members. Held alongside the fall gathering.',
  },
]

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════╗`)
  console.log(`║   CCO United — Strawberry Dispatch Demo Import       ║`)
  console.log(`║   7 FoodDistribution__c campaigns                    ║`)
  if (DRY_RUN) console.log(`║   MODE: DRY RUN (no data written)                    ║`)
  console.log(`╚══════════════════════════════════════════════════════╝\n`)

  let accessToken, instanceUrl
  if (!DRY_RUN) {
    console.log('Authenticating to Salesforce...')
    ;({ accessToken, instanceUrl } = await getSfToken())
    console.log(`✓ Authenticated → ${instanceUrl}\n`)
  }

  // Look up existing Account IDs
  let orgIdMap = {}
  if (!DRY_RUN) {
    console.log('── Fetching existing CCO Organization Accounts ─────────')
    const accounts = await sfQuery(instanceUrl, accessToken, 'SELECT Id, Name FROM Account')
    for (const a of accounts) orgIdMap[a.Name] = a.Id
    console.log(`  Found ${accounts.length} accounts\n`)
  } else {
    // Dry run: fake IDs so output is readable
    for (const c of CAMPAIGNS) orgIdMap[c._orgName] = `DRY_ACCOUNT_ID`
  }

  // Insert campaigns
  console.log('── Food Distribution Campaigns (FoodDistribution__c) ────')
  const results = []
  for (const seed of CAMPAIGNS) {
    const { _orgName, ...record } = seed
    const orgId = orgIdMap[_orgName]
    if (!orgId) {
      console.error(`  ✗ ${record.Name}: no Account found for "${_orgName}"`)
      results.push({ name: record.Name, ok: false })
      continue
    }
    record.CCO_Organization__c = orgId
    try {
      const result = await sfPost(instanceUrl, accessToken, 'FoodDistribution__c', record)
      results.push({ name: record.Name, id: result.id, ok: true })
      console.log(`  ✓ ${record.Name} → ${result.id}`)
    } catch (e) {
      results.push({ name: record.Name, ok: false, error: e.message })
      console.error(`  ✗ ${record.Name}: ${e.message}`)
    }
  }

  const pass = results.filter(r => r.ok).length
  const fail = results.filter(r => !r.ok).length
  console.log(`\n── Summary ──────────────────────────────────────────────`)
  console.log(`  Campaigns: ${pass} inserted, ${fail} failed`)
  console.log(`  Total: ${pass} records${DRY_RUN ? ' (dry run)' : ' written to Salesforce'}\n`)

  if (fail > 0) process.exit(1)
}

main().catch(e => { console.error(e.message); process.exit(1) })
