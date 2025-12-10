import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company/search
 * 
 * Search companies by name (case-insensitive, partial match)
 * Public search - no auth required for searching
 * 
 * Body: { query: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query string is required' },
        { status: 400 },
      )
    }

    // Search companies by name (case-insensitive, partial match)
    const companies = await prisma.company.findMany({
      where: {
        name: {
          contains: query.trim(),
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        industry: true,
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
    console.error('❌ CompanySearch error:', error)
    
    // Handle table doesn't exist error gracefully
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Company search is temporarily unavailable', 
          details: 'Database table not found. Please try creating a new company instead.' 
        },
        { status: 503 },
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to search companies', details: error?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}
