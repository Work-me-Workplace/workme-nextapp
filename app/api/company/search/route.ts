import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company/search
 * 
 * Search CompanyUnit registry (matches RaceRegistry pattern)
 * Case-insensitive partial match on name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 },
      )
    }

    const searchTerm = query.trim()

    // Case-insensitive partial match on name
    const companies = await prisma.companyUnit.findMany({
      where: {
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
      companies,
    })
  } catch (error: any) {
    console.error('❌ Company search error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search companies' },
      { status: 500 },
    )
  }
}

