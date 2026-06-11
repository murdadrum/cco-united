export interface CCOEvent {
  id: string
  name: string
  date: string | null
  time: string | null
  organization: string | null
  eventType: string | null
  isPublic: boolean
  description: string | null
  location: string | null
}

export interface EventsApiResponse {
  events: CCOEvent[]
  fetchedAt: string
}

export interface FoodCampaign {
  id: string
  name: string
  date: string | null
  location: string | null
  foodType: string | null
  quantity: number | null
  status: string | null
  organization: string | null
  description: string | null
  isPublic: boolean
}

export interface MondayCampaign {
  id: string
  name: string
  timelineFrom: string | null
  timelineTo: string | null
  beginningStock: number | null
  distributedUnits: number | null
  availableStock: number | null
  location: string | null
  manager: string | null
}

export interface MondayGrant {
  id: string
  name: string
  status: string | null
  dueDate: string | null
  amount: number | null
  provider: string | null
  group: string
}

export interface MondayGrantProvider {
  id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
}

export interface MondayVolunteer {
  id: string
  name: string
  status: string | null       // "New" | "Active" | "Past"
  email: string | null
  phone: string | null
  location: string | null
  skills: string | null       // comma-separated skill labels
  hoursPerWeek: string | null // "1-3" | "4-6" | "7-9" | "10+"
  startDate: string | null    // "YYYY-MM-DD"
  group: string               // "New volunteers" | "Active volunteers" | "Past volunteers"
}
