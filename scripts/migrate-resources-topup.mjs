/**
 * migrate-resources-topup.mjs
 * Second pass: creates only the items missing from partially-migrated groups.
 * Compares item counts per group between source and destination, then fills gaps.
 *
 * Usage: node --env-file=.env.local scripts/migrate-resources-topup.mjs
 */

const RA_KEY = process.env.MONDAY_API_KEY_RA
const DEST_KEY = process.env.MONDAY_API_KEY
const SOURCE_BOARD = '18412424662'
const DEST_BOARD = '18416228470'

if (!RA_KEY || !DEST_KEY) {
  console.error('Missing MONDAY_API_KEY_RA or MONDAY_API_KEY in environment')
  process.exit(1)
}

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function mondayQuery(apiKey, query, variables = {}, retries = 6) {
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
      let retryAfter = 12
      try { retryAfter = JSON.parse(body)?.errors?.[0]?.extensions?.retry_in_seconds ?? 12 } catch {}
      if (attempt < retries) { await sleep((retryAfter + 2) * 1000); continue }
      throw new Error(`HTTP ${res.status}: ${body}`)
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    const json = await res.json()
    if (json.errors) {
      const errText = JSON.stringify(json.errors)
      const isRateLimited = errText.includes('COMPLEXITY_BUDGET') || errText.includes('RESOURCE_LOCKED')
      if (isRateLimited && attempt < retries) { await sleep(12000); continue }
      throw new Error(errText)
    }
    return json.data
  }
}

function colVal(item, srcColId) {
  return item.column_values.find(c => c.id === srcColId)?.text ?? ''
}

function buildColumnValues(item) {
  const vals = {}
  const set = (destId, val) => { if (val) vals[destId] = val }

  const cat = colVal(item, SRC_COLS.category); if (cat) vals[DEST_COLS.category] = { label: cat }
  const cco = colVal(item, SRC_COLS.cco); if (cco) vals[DEST_COLS.cco] = { label: cco }
  const av = colVal(item, SRC_COLS.availability); if (av) vals[DEST_COLS.availability] = { label: av }
  const cost = colVal(item, SRC_COLS.cost); if (cost) vals[DEST_COLS.cost] = { label: cost }
  const cap = colVal(item, SRC_COLS.capacity); if (cap) vals[DEST_COLS.capacity] = { label: cap }
  const io = colVal(item, SRC_COLS.indoorOutdoor); if (io) vals[DEST_COLS.indoorOutdoor] = { label: io }
  const hw = colVal(item, SRC_COLS.healthWellness); if (hw) vals[DEST_COLS.healthWellness] = { label: hw }
  const ye = colVal(item, SRC_COLS.youthElder); if (ye) vals[DEST_COLS.youthElder] = { label: ye }
  const desc = colVal(item, SRC_COLS.description); set(DEST_COLS.description, desc)
  const notes = colVal(item, SRC_COLS.notes); if (notes) vals[DEST_COLS.notes] = { text: notes }
  const contact = colVal(item, SRC_COLS.contact); set(DEST_COLS.contact, contact)

  return JSON.stringify(vals)
}

async function fetchGroupItemCount(apiKey, boardId, groupId) {
  const data = await mondayQuery(apiKey, `{
    boards(ids: [${boardId}]) {
      groups(ids: ["${groupId}"]) { items_page(limit: 1) { cursor items { id } } }
    }
  }`)
  // Monday doesn't return count directly per group; use items_count on board, or paginate
  // Instead, use the boards items_count trick per group via complexity-light query
  return null // placeholder — we'll use a different approach below
}

async function getDestGroupCounts() {
  // Fetch all dest groups with item page (just IDs) to count
  const data = await mondayQuery(DEST_KEY, `{
    boards(ids: [${DEST_BOARD}]) {
      groups {
        id
        title
        items_page(limit: 500) { cursor items { id } }
      }
    }
  }`)
  const result = {}
  for (const g of data.boards[0].groups) {
    let count = g.items_page.items.length
    let cursor = g.items_page.cursor
    while (cursor) {
      const more = await mondayQuery(DEST_KEY, `{
        boards(ids: [${DEST_BOARD}]) {
          groups(ids: ["${g.id}"]) {
            items_page(limit: 500, cursor: "${cursor}") { cursor items { id } }
          }
        }
      }`)
      const p = more.boards[0].groups[0].items_page
      count += p.items.length
      cursor = p.cursor || null
      if (cursor) await sleep(300)
    }
    result[g.title] = { id: g.id, count }
  }
  return result
}

async function fetchSourceGroupItems(groupId, groupTitle) {
  const allColIds = Object.values(SRC_COLS)
  const items = []
  let cursor = null
  do {
    const query = cursor
      ? `{ boards(ids: [${SOURCE_BOARD}]) { groups(ids: ["${groupId}"]) { items_page(limit: 500, cursor: "${cursor}") { cursor items { id name column_values(ids: ${JSON.stringify(allColIds)}) { id text } } } } } }`
      : `{ boards(ids: [${SOURCE_BOARD}]) { groups(ids: ["${groupId}"]) { items_page(limit: 500) { cursor items { id name column_values(ids: ${JSON.stringify(allColIds)}) { id text } } } } } }`
    const data = await mondayQuery(RA_KEY, query)
    const page = data.boards[0].groups[0]?.items_page
    if (!page) break
    items.push(...page.items)
    cursor = page.cursor || null
    if (cursor) await sleep(300)
  } while (cursor)
  return items
}

async function main() {
  console.log('=== Resources Top-Up: filling gaps from rate-limited first pass ===\n')

  console.log('Fetching source group structure...')
  const srcData = await mondayQuery(RA_KEY, `{ boards(ids: [${SOURCE_BOARD}]) { groups { id title } } }`)
  const srcGroups = srcData.boards[0].groups

  console.log('Counting items in destination groups...')
  const destCounts = await getDestGroupCounts()

  console.log('\nGap analysis:')
  const gapsToFill = []
  for (const srcGroup of srcGroups) {
    const dest = destCounts[srcGroup.title]
    if (!dest) {
      console.log(`  ⚠️  ${srcGroup.title}: no dest group found`)
      continue
    }
    // We don't know exact source count per group without fetching, but we know 252-253 each
    // Fetch only if dest count < 252
    if (dest.count < 252) {
      console.log(`  ${srcGroup.title}: dest has ${dest.count} → needs top-up`)
      gapsToFill.push({ srcGroup, destGroupId: dest.id, destCount: dest.count })
    } else {
      console.log(`  ${srcGroup.title}: ${dest.count} ✓`)
    }
  }

  if (gapsToFill.length === 0) {
    console.log('\nAll groups complete — no top-up needed.')
    return
  }

  console.log(`\nFilling ${gapsToFill.length} group(s)...`)
  let totalCreated = 0, totalFailed = 0

  const BATCH = 3
  const BATCH_DELAY = 1500

  for (const { srcGroup, destGroupId, destCount } of gapsToFill) {
    console.log(`\n  Fetching ${srcGroup.title} from source...`)
    const allItems = await fetchSourceGroupItems(srcGroup.id, srcGroup.title)
    const missing = allItems.slice(destCount) // skip already-created items (they are in order)

    console.log(`  ${srcGroup.title}: ${destCount} exist, ${missing.length} to create`)

    let created = 0, failed = 0
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH)
      const results = await Promise.allSettled(
        batch.map(item => mondayQuery(DEST_KEY, `
          mutation($boardId: ID!, $groupId: String!, $name: String!, $colVals: JSON!) {
            create_item(board_id: $boardId group_id: $groupId item_name: $name column_values: $colVals create_labels_if_missing: true) { id }
          }
        `, { boardId: DEST_BOARD, groupId: destGroupId, name: item.name, colVals: buildColumnValues(item) }))
      )
      for (const r of results) {
        if (r.status === 'fulfilled') created++
        else { failed++; if (failed <= 3) console.error(`    Error: ${r.reason?.message}`) }
      }
      await sleep(BATCH_DELAY)
    }

    totalCreated += created
    totalFailed += failed
    console.log(`  ${srcGroup.title}: created ${created}/${missing.length}${failed > 0 ? ` (${failed} failed)` : ''}`)
  }

  console.log(`\n=== Top-up complete ===`)
  console.log(`Created: ${totalCreated}, Failed: ${totalFailed}`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
