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
    const { name, companyId } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Company unit name is required' },
        { status: 400 },
      )
    }

    const normalizedName = name.trim()

    // Validate companyId exists if provided
    if (companyId) {
      const companyRegistry = await prisma.companyRegistry.findUnique({
        where: { id: companyId },
      })
      
      if (!companyRegistry) {
        return NextResponse.json(
          { success: false, error: 'Company HQ not found' },
          { status: 404 },
        )
      }
    }

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
      // If companyId provided and (different or unit has no companyId), update it
      if (companyId && (existingCompanyUnit.companyId !== companyId || !existingCompanyUnit.companyId)) {
        const updated = await prisma.companyUnit.update({
          where: { id: existingCompanyUnit.id },
          data: { companyId },
        })
        console.log('✅ CompanyUnit found and linked to Company HQ:', updated.id)
        return NextResponse.json({
          success: true,
          companyUnit: {
            id: updated.id,
            name: updated.name,
            companyId: updated.companyId,
          },
          message: 'Company unit found in registry and linked to Company HQ',
        })
      }
      
      console.log('✅ CompanyUnit found in registry:', existingCompanyUnit.id)
      return NextResponse.json({
        success: true,
        companyUnit: {
          id: existingCompanyUnit.id,
          name: existingCompanyUnit.name,
          companyId: existingCompanyUnit.companyId,
        },
        message: 'Company unit found in registry',
      })
    }

    // Create new company unit (with optional companyId link to Company HQ)
    const companyUnit = await prisma.companyUnit.create({
      data: {
        name: normalizedName,
        companyId: companyId || null,
      },
    })

    console.log('✅ CompanyUnit created:', companyUnit.id, companyId ? `linked to Company HQ: ${companyId}` : '(standalone)')

    return NextResponse.json({
      success: true,
      companyUnit: {
        id: companyUnit.id,
        name: companyUnit.name,
        companyId: companyUnit.companyId,
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

