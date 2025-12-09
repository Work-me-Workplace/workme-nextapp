import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company-registry/search
 * 
 * Search company (Company) - for Company HQ
 * Public search - no auth required
 * 
 * Body: { query: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query string required' },
        { status: 400 },
      )
    }

    // Fuzzy search by name (case-insensitive, partial match)
    const companies = await prisma.company.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      take: 20,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      companies,
    })
  } catch (error: any) {
    console.error('❌ CompanyRegistrySearch error:', error)
    
    // Handle table doesn't exist error gracefully
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Company registry search is temporarily unavailable', 
          details: 'Database table not found. Please try creating a new company HQ instead.' 
        },
        { status: 503 },
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to search company registry', details: error?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}

