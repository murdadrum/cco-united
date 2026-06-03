import { NextResponse } from 'next/server'
import { fetchPublicEvents } from '@/lib/fetchEvents'

export async function GET() {
  try {
    const events = await fetchPublicEvents()
    return NextResponse.json(
      { events, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 502 })
  }
}
