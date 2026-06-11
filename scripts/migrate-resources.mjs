/**
 * migrate-resources.mjs
 * Mirrors the RA "Resources Management" board (18412424662) into the
 * kcco-force "Shared Resource Directory" board (18416228470).
 *
 * Usage: node --env-file=.env.local scripts/migrate-resources.mjs
 */

const RA_KEY = process.env.MONDAY_API_KEY_RA
const DEST_KEY = process.env.MONDAY_API_KEY
const SOURCE_BOARD = '18412424662'
const DEST_BOARD = '18416228470'

if (!RA_KEY || !DEST_KEY) {
  console.error('Missing MONDAY_API_KEY_RA or MONDAY_API_KEY in environment')
  process.exit(1)
}

// ─── Destination column IDs (created during board setup) ─────────────────────
const DEST_COLS = {
  category:       'color_mm47meg8',
  cco:            'color_mm47mdvy',
  availability:   'color_mm47xk6d',
  cost:           'color_mm47gvj1',
  capacity:       'color_mm47n3a',
  indoorOutdoor:  'color_mm47mdnk',
  healthWellness: 'color_mm47cgb7',
  youthElder:     'color_mm47d3ef',
  description:    'text_mm47mqy1',
  notes:          'long_text_mm4753sj',
  contact:        'text_mm47e33s',
}

// Source column IDs
const SRC_COLS = {
  category:       'color_mm36s0dh',
  cco:            'color_mm36qs9b',
  contact:        'dropdown_mm36sv9v',
  availability:   'color_mm36t9e5',
  cost:           'color_mm36hxv7',
  capacity:       'color_mm369kc9',
  indoorOutdoor:  'color_mm365kdt',
  healthWellness: 'color_mm36r345',
  youthElder:     'color_mm3624t7',
  description:    'text_mm3673ww',
  notes:          'long_text_mm36yc2r',
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function mondayQuery(apiKey, query, variables = {}, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'API-Version': '2024-10',
      },
      body: JSON.stringify({ query, variables }),
    })

    if (res.status === 429 || res.status === 423) {
      const body = await res.text()
      let retryAfter = 10
      try {
        const parsed = JSON.parse(body)
        retryAfter = parsed?.errors?.[0]?.extensions?.retry_in_seconds ?? 10
      } catch {}
      if (attempt < retries) {
        await sleep((retryAfter + 1) * 1000)
        continue
      }
      throw new Error(`HTTP ${res.status}: ${body}`)
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    const json = await res.json()
    if (json.errors) {
      const errText = JSON.stringify(json.errors)
      const isRateLimited = errText.includes('COMPLEXITY_BUDGET') || errText.includes('RESOURCE_LOCKED')
      if (isRateLimited && attempt < retries) {
        await sleep(10000)
        continue
      }
      throw new Error(errText)
    }
    return json.data
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Fetch all source items (paginated) ───────────────────────────────────────

async function fetchAllSourceItems() {
  const allGroups = []

  // First get all group IDs
  const boardData = await mondayQuery(RA_KEY, `{
    boards(ids: [${SOURCE_BOARD}]) {
      groups { id title }
    }
  }`)
  const groups = boardData.boards[0].groups
  console.log(`Source board: ${groups.length} groups`)

  const colIds = Object.values(SRC_COLS).filter(id => !id.startsWith('dropdown'))
  const allColIds = [...colIds, SRC_COLS.contact]

  for (const group of groups) {
    console.log(`  Fetching group: ${group.title}...`)
    const items = []
    let cursor = null
    let page = 0

    do {
      const query = cursor
        ? `{ boards(ids: [${SOURCE_BOARD}]) { groups(ids: ["${group.id}"]) { items_page(limit: 500, cursor: "${cursor}") { cursor items { id name column_values(ids: ${JSON.stringify(allColIds)}) { id text } } } } } }`
        : `{ boards(ids: [${SOURCE_BOARD}]) { groups(ids: ["${group.id}"]) { items_page(limit: 500) { cursor items { id name column_values(ids: ${JSON.stringify(allColIds)}) { id text } } } } } }`

      const data = await mondayQuery(RA_KEY, query)
      const page_data = data.boards[0].groups[0]?.items_page
      if (!page_data) break

      items.push(...page_data.items)
      cursor = page_data.cursor || null
      page++
      if (cursor) await sleep(300)
    } while (cursor)

    console.log(`    → ${items.length} items`)
    allGroups.push({ title: group.title, items })
  }

  return allGroups
}

// ─── Fetch destination group map ──────────────────────────────────────────────

async function fetchDestGroups() {
  const data = await mondayQuery(DEST_KEY, `{
    boards(ids: [${DEST_BOARD}]) {
      groups { id title }
    }
  }`)
  const map = {}
  for (const g of data.boards[0].groups) {
    map[g.title] = g.id
  }
  return map
}

// ─── Build column values JSON for a dest item ────────────────────────────────

function colVal(item, srcColId) {
  return item.column_values.find(c => c.id === srcColId)?.text ?? ''
}

function buildColumnValues(item) {
  const vals = {}

  const category = colVal(item, SRC_COLS.category)
  if (category) vals[DEST_COLS.category] = { label: category }

  const cco = colVal(item, SRC_COLS.cco)
  if (cco) vals[DEST_COLS.cco] = { label: cco }

  const availability = colVal(item, SRC_COLS.availability)
  if (availability) vals[DEST_COLS.availability] = { label: availability }

  const cost = colVal(item, SRC_COLS.cost)
  if (cost) vals[DEST_COLS.cost] = { label: cost }

  const capacity = colVal(item, SRC_COLS.capacity)
  if (capacity) vals[DEST_COLS.capacity] = { label: capacity }

  const indoorOutdoor = colVal(item, SRC_COLS.indoorOutdoor)
  if (indoorOutdoor) vals[DEST_COLS.indoorOutdoor] = { label: indoorOutdoor }

  const healthWellness = colVal(item, SRC_COLS.healthWellness)
  if (healthWellness) vals[DEST_COLS.healthWellness] = { label: healthWellness }

  const youthElder = colVal(item, SRC_COLS.youthElder)
  if (youthElder) vals[DEST_COLS.youthElder] = { label: youthElder }

  const description = colVal(item, SRC_COLS.description)
  if (description) vals[DEST_COLS.description] = description

  const notes = colVal(item, SRC_COLS.notes)
  if (notes) vals[DEST_COLS.notes] = { text: notes }

  const contact = colVal(item, SRC_COLS.contact)
  if (contact) vals[DEST_COLS.contact] = contact

  return JSON.stringify(vals)
}

// ─── Create a single item on the destination board ───────────────────────────

async function createItem(groupId, name, columnValues) {
  const mutation = `
    mutation($boardId: ID!, $groupId: String!, $name: String!, $colVals: JSON!) {
      create_item(
        board_id: $boardId
        group_id: $groupId
        item_name: $name
        column_values: $colVals
        create_labels_if_missing: true
      ) { id }
    }
  `
  const data = await mondayQuery(DEST_KEY, mutation, {
    boardId: DEST_BOARD,
    groupId,
    name,
    colVals: columnValues,
  })
  return data.create_item.id
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Resources Migration: RA → kcco-force ===\n')

  console.log('Step 1: Fetching source items...')
  const sourceGroups = await fetchAllSourceItems()
  const totalItems = sourceGroups.reduce((n, g) => n + g.items.length, 0)
  console.log(`\nTotal source items: ${totalItems}\n`)

  console.log('Step 2: Fetching destination group map...')
  const destGroupMap = await fetchDestGroups()
  console.log(`Destination groups: ${Object.keys(destGroupMap).join(', ')}\n`)

  console.log('Step 3: Creating items on destination board...')
  let totalCreated = 0
  let totalFailed = 0

  const BATCH = 5           // lower concurrency to reduce rate-limit pressure
  const BATCH_DELAY = 800   // ms between batches

  // Optional: only process specific groups (pass comma-separated names as arg)
  const targetGroups = process.argv[2]
    ? process.argv[2].split(',').map(s => s.trim())
    : null

  for (const { title, items } of sourceGroups) {
    if (targetGroups && !targetGroups.includes(title)) continue
    const destGroupId = destGroupMap[title]
    if (!destGroupId) {
      console.warn(`  ⚠️  No destination group found for "${title}" — skipping ${items.length} items`)
      totalFailed += items.length
      continue
    }

    let groupCreated = 0
    let groupFailed = 0

    // Process in batches
    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH)
      const results = await Promise.allSettled(
        batch.map(item => createItem(destGroupId, item.name, buildColumnValues(item)))
      )
      for (const result of results) {
        if (result.status === 'fulfilled') groupCreated++
        else {
          groupFailed++
          // Log first few failures for debugging
          if (groupFailed <= 3) console.error(`    Error: ${result.reason?.message ?? result.reason}`)
        }
      }
      await sleep(BATCH_DELAY)
    }

    totalCreated += groupCreated
    totalFailed += groupFailed
    console.log(`  ${title}: ${groupCreated}/${items.length} created${groupFailed > 0 ? ` (${groupFailed} failed)` : ''}`)
  }

  console.log(`\n=== Migration complete ===`)
  console.log(`Created: ${totalCreated}`)
  console.log(`Failed:  ${totalFailed}`)
  console.log(`Total:   ${totalCreated + totalFailed}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
