import type { MondayCampaign } from './sfTypes'

const BOARD_ID = '18415376711'
const GROUP_ID = 'topics' // Active Campaigns

const QUERY = `
  query {
    boards(ids: [${BOARD_ID}]) {
      groups(ids: ["${GROUP_ID}"]) {
        items_page(limit: 50) {
          items {
            id
            name
            column_values(ids: [
              "timerange_mm3t7p7t",
              "numeric_mm3ttm",
              "numeric_mm3tx3p2",
              "formula_mm3t9sxw",
              "location_mm3tx2f7",
              "multiple_person_mm3tf50e"
            ]) {
              id
              text
              value
            }
          }
        }
      }
    }
  }
`.trim()

interface MondayColumnValue {
  id: string
  text: string
  value: string | null
}

interface MondayItem {
  id: string
  name: string
  column_values: MondayColumnValue[]
}

function col(item: MondayItem, colId: string): string {
  return item.column_values.find(c => c.id === colId)?.text ?? ''
}

function parseNumber(text: string): number | null {
  const n = parseFloat(text)
  return isNaN(n) ? null : n
}

export async function fetchMondayNutritionCampaigns(): Promise<MondayCampaign[]> {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: QUERY }),
      next: { revalidate: 300 },
    })

    if (!res.ok) return []

    const json = await res.json()
    const items: MondayItem[] =
      json.data?.boards?.[0]?.groups?.[0]?.items_page?.items ?? []

    return items.map(item => {
      const timelineText = col(item, 'timerange_mm3t7p7t')
      // text format: "2026-06-01 - 2026-08-31"
      const [timelineFrom = null, timelineTo = null] = timelineText
        ? timelineText.split(' - ')
        : []

      const locationText = col(item, 'location_mm3tx2f7')
      const beginningStock = parseNumber(col(item, 'numeric_mm3ttm'))
      const distributedUnits = parseNumber(col(item, 'numeric_mm3tx3p2'))
      const availableStockText = col(item, 'formula_mm3t9sxw')
      const availableStock = parseNumber(availableStockText) ??
        (beginningStock != null && distributedUnits != null
          ? beginningStock - distributedUnits
          : beginningStock)

      return {
        id: item.id,
        name: item.name,
        timelineFrom: timelineFrom || null,
        timelineTo: timelineTo || null,
        beginningStock,
        distributedUnits,
        availableStock,
        location: locationText || null,
        manager: col(item, 'multiple_person_mm3tf50e') || null,
      }
    })
  } catch {
    return []
  }
}
