import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/highlights
 * 
 * Returns all highlights for current user's companyUnit
 * Filters by companyUnit via CompanyEmployeeHighlightUnit junction table
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { companyUnit } = workMe

    if (!companyUnit) {
      return NextResponse.json(
        { success: false, error: 'User must set a companyUnit' },
        { status: 400 }
      )
    }

    console.log('[API GET /api/highlights]', { companyUnit })

    // 2. Find all highlights for this companyUnit
    // Get highlight IDs from CompanyEmployeeHighlightUnit junction table
    const unitLinks = await prisma.companyEmployeeHighlightUnit.findMany({
      where: { companyUnit },
      select: { highlightId: true },
    })

    const highlightIds = unitLinks.map(link => link.highlightId)

    if (highlightIds.length === 0) {
      return NextResponse.json({
        success: true,
        highlights: [],
      })
    }

    // 3. Fetch highlights with employees
    const highlights = await prisma.companyEmployeeHighlight.findMany({
      where: {
        id: { in: highlightIds },
      },
      include: {
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                title: true,
                photoUrl: true,
              },
            },
          },
        },
        units: {
          select: {
            companyUnit: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 4. Transform for frontend
    const transformed = highlights.map(h => ({
      id: h.id,
      citationText: h.citationText,
      achievement: h.achievement,
      classification: h.classification,
      awardName: h.awardName,
      awardingAgency: h.awardingAgency,
      awardYear: h.awardYear,
      photoUrl: h.photoUrl,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      employees: h.employees.map(e => ({
        id: e.employee.id,
        fullName: e.employee.fullName,
        title: e.employee.title,
        photoUrl: e.employee.photoUrl,
      })),
      companyUnits: h.units.map(u => u.companyUnit),
    }))

    console.log('[API GET /api/highlights] Success', {
      count: transformed.length,
    })

    return NextResponse.json({
      success: true,
      highlights: transformed,
    })
  } catch (error: any) {
    console.error('[API GET /api/highlights] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch highlights',
      },
      { status: 500 }
    )
  }
}

