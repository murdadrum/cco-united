import { getSfToken, invalidateSfToken } from './sfAuth'
import type { CCOEvent } from './sfTypes'

const SOQL = `
  SELECT Id, Name, Event_Date__c, Location__c, Event_Type__c,
         CCO_Organization__c, Is_Public__c, Description__c, Status__c
  FROM Event__c
  WHERE Is_Public__c = true
    AND Status__c = 'Approved'
    AND Event_Date__c >= TODAY
  ORDER BY Event_Date__c ASC
  LIMIT 50
`.trim().replace(/\s+/g, ' ')

interface SfEventRecord {
  Id: string
  Name: string
  Event_Date__c: string | null
  Location__c: string | null
  Event_Type__c: string | null
  CCO_Organization__c: string | null
  Is_Public__c: boolean
  Description__c: string | null
  Status__c: string | null
}

export async function fetchPublicEvents(): Promise<CCOEvent[]> {
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
    const records: SfEventRecord[] = json.records ?? []

    return records.map(r => ({
      id: r.Id,
      name: r.Name,
      date: r.Event_Date__c ?? null,
      time: null,
      organization: r.CCO_Organization__c ?? null,
      eventType: r.Event_Type__c ?? null,
      isPublic: r.Is_Public__c,
      description: r.Description__c ?? null,
      location: r.Location__c ?? null,
    }))
  } catch {
    return []
  }
}
