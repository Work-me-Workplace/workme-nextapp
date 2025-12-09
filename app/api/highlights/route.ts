import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/highlights (MVP1 Architecture)
 * 
 * Returns all highlights for current user's company.
 * Filters by companyId (authoritative) and optional companyUnit string.
 * 
 * NOTE: This route conflicts with /api/company/highlights - consider consolidating.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId, companyUnit } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'User must belong to a company' },
        { status: 400 }
      )
    }

    console.log('[API GET /api/highlights]', { companyId, companyUnit })

    // 2. Filter by companyId and optional companyUnit string
    const highlights = await prisma.companyEmployeeHighlight.findMany({
      where: {
        employees: {
          some: {
            employee: {
              companyId,
              ...(companyUnit ? { companyUnit } : {}),
            },
          },
        },
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // 3. Transform for frontend
    const transformed = highlights.map(h => ({
      id: h.id,
      citationText: h.citationText,
      achievement: h.achievement,
      classification: h.classification,
      awardName: h.awardName,
      awardingAgency: h.awardingAgency,
      awardYear: h.awardYear,
      photoUrl: h.photoUrl,
      companyUnitLabel: h.companyUnitLabel,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      employees: h.employees.map(e => ({
        id: e.employee.id,
        fullName: e.employee.fullName,
        title: e.employee.title,
        photoUrl: e.employee.photoUrl,
      })),
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

