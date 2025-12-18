import { NextRequest, NextResponse } from 'next/server'
import { getCompanyXItemsByDateRange, getCompanyXItemsByType } from '@/lib/actions/companyx-items'

// GET /api/workforce/companyx/items?startDate=2025-12-01&endDate=2025-12-31
// OR
// GET /api/workforce/companyx/items?type=CompanyEvent
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // By type
    if (type) {
      const result = await getCompanyXItemsByType(type as any)
      return NextResponse.json(result)
    }

    // By date range
    if (startDate && endDate) {
      const result = await getCompanyXItemsByDateRange(
        new Date(startDate),
        new Date(endDate)
      )
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { success: false, error: 'Must provide either type or startDate+endDate' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in companyx/items route:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}
