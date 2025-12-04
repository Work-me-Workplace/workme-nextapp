import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company-unit/create
 * 
 * Create company unit in registry (search-before-create pattern like RaceRegistry)
 * 
 * Body: { name: string }
 * 
 * Behavior:
 * - Search first by name (case-insensitive exact match)
 * - If exists, return existing
 * - If not, create new
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth (optional - for tracking creator, but registry is public)
    let workMeId: string | null = null
    try {
      const { firebaseId } = await verifyAuth(request as Request)
      const workMe = await loadWorkMe(firebaseId)
      workMeId = workMe.id
    } catch {
      // Auth optional - allow public creation
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company unit name is required' },
        { status: 400 },
      )
    }

    const normalizedName = name.trim()

    // REGISTRY PATTERN: Search first, if exists, return it. If not, create it.
    const existingCompanyUnit = await prisma.companyUnit.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    })

    if (existingCompanyUnit) {
      console.log('✅ CompanyUnit found in registry:', existingCompanyUnit.id)
      return NextResponse.json({
        success: true,
        companyUnit: {
          id: existingCompanyUnit.id,
          name: existingCompanyUnit.name,
        },
        message: 'Company unit found in registry',
      })
    }

    // Create new company unit
    const companyUnit = await prisma.companyUnit.create({
      data: {
        name: normalizedName,
      },
    })

    console.log('✅ CompanyUnit created:', companyUnit.id)

    return NextResponse.json({
      success: true,
      companyUnit: {
        id: companyUnit.id,
        name: companyUnit.name,
      },
    })
  } catch (error: any) {
    console.error('❌ CompanyUnitCreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create company unit' },
      { status: 500 },
    )
  }
}

