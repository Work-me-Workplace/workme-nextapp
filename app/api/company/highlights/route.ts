import { NextRequest, NextResponse } from 'next/server'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/company/highlights
 * 
 * List all highlights for the user's company
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth and get context
    const context = await getWorkMeContext(request)

    if (!context.companyId) {
      return NextResponse.json(
        { success: false, error: 'User must belong to a company' },
        { status: 400 }
      )
    }

    // 2. Get all highlights for this company
    const highlights = await prisma.companyEmployeeHighlight.findMany({
      where: {
        employees: {
          some: {
            employee: {
              companyId: context.companyId,
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
        updatedAt: 'desc',
      },
    })

    // 3. Transform to match frontend interface
    const formattedHighlights = highlights.map(h => ({
      id: h.id,
      citationText: h.citationText,
      achievement: h.achievement,
      classification: h.classification,
      awardName: h.awardName,
      awardingAgency: h.awardingAgency,
      awardYear: h.awardYear,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
      employees: h.employees.map(e => ({
        id: e.employee.id,
        fullName: e.employee.fullName,
        title: e.employee.title,
        photoUrl: e.employee.photoUrl,
      })),
      companyUnits: h.companyUnitLabel ? [h.companyUnitLabel] : [],
    }))

    return NextResponse.json({
      success: true,
      highlights: formattedHighlights,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/highlights error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to load highlights',
      },
      { status: 500 }
    )
  }
}
