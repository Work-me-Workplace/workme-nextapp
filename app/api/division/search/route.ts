import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/division/search
 * 
 * Search DivisionUnit registry within a CompanyUnit
 * Case-insensitive partial match on name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, companyUnitId } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 },
      )
    }

    if (!companyUnitId || typeof companyUnitId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 },
      )
    }

    const searchTerm = query.trim()

    // Case-insensitive partial match on name within the company
    const divisions = await prisma.divisionUnit.findMany({
      where: {
        companyUnitId,
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      take: 20, // Limit results
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      divisions,
    })
  } catch (error: any) {
    console.error('❌ Division search error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search divisions' },
      { status: 500 },
    )
  }
}

