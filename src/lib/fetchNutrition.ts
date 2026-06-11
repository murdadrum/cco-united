import { getSfToken, invalidateSfToken } from './sfAuth'
import type { FoodCampaign } from './sfTypes'

const SOQL = `
  SELECT Id, Name, Distribution_Date__c, Location__c, Food_Type__c,
         Quantity_Available__c, Status__c, CCO_Organization__r.Name,
         Is_Public__c, Description__c
  FROM FoodDistribution__c
  WHERE Is_Public__c = true
    AND Status__c IN ('Scheduled', 'Active')
  ORDER BY Distribution_Date__c ASC
  LIMIT 50
`.trim().replace(/\s+/g, ' ')

interface SfFoodRecord {
  Id: string
  Name: string
  Distribution_Date__c: string | null
  Location__c: string | null
  Food_Type__c: string | null
  Quantity_Available__c: number | null
  Status__c: string | null
  CCO_Organization__r: { Name: string } | null
  Is_Public__c: boolean
  Description__c: string | null
}

export async function fetchNutritionCampaigns(): Promise<FoodCampaign[]> {
  let token: string
  let instanceUrl: string
  try {
    ;({ token, instanceUrl } = await getSfToken())
  } catch {
    return []
  }

  try {
    const res = await fetch(
      `${instanceUrl}/services/data/v66.0/query?q=${encodeURIComponent(SOQL)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 },
      }
    )

    if (res.status === 401) {
      invalidateSfToken()
      return []
    }

    if (!res.ok) return []

    const json = await res.json()
    const records: SfFoodRecord[] = json.records ?? []

    return records.map(r => ({
      id: r.Id,
      name: r.Name,
      date: r.Distribution_Date__c ?? null,
      location: r.Location__c ?? null,
      foodType: r.Food_Type__c ?? null,
      quantity: r.Quantity_Available__c ?? null,
      status: r.Status__c ?? null,
      organization: r.CCO_Organization__r?.Name ?? null,
      description: r.Description__c ?? null,
      isPublic: r.Is_Public__c,
    }))
  } catch {
    return []
  }
}
