export interface CCOEvent {
  id: string
  name: string
  date: string | null
  time: string | null
  organization: string | null
  eventType: string | null
  isPublic: boolean
  description: string | null
}

export interface EventsApiResponse {
  events: CCOEvent[]
  fetchedAt: string
}
