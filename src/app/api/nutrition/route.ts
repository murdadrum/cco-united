import { NextResponse } from 'next/server'
import { fetchNutritionCampaigns } from '@/lib/fetchNutrition'

export const revalidate = 300

export async function GET() {
  try {
    const campaigns = await fetchNutritionCampaigns()
    return NextResponse.json(
      { campaigns, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 502 })
  }
}
