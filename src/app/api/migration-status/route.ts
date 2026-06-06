import { NextResponse } from 'next/server'
import { fetchMigrationStatus } from '@/lib/fetchMigrationStatus'

export async function GET() {
  try {
    const status = await fetchMigrationStatus()
    return NextResponse.json(status, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch migration status' }, { status: 502 })
  }
}
