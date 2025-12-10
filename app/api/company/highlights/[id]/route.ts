import { NextRequest, NextResponse } from 'next/server'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/company/highlights/[id]
 * 
 * Get a single highlight by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth and get context
    const context = await getWorkMeContext(request)

    if (!context.companyId) {
      return NextResponse.json(
        { success: false, error: 'User must belong to a company' },
        { status: 400 }
      )
    }

    const { id: highlightId } = await params

    if (!highlightId) {
      return NextResponse.json(
        { success: false, error: 'Highlight ID is required' },
        { status: 400 }
      )
    }

    // 2. Get highlight and verify it belongs to the company (using direct companyId)
    const highlight = await prisma.companyEmployeeHighlight.findFirst({
      where: {
        id: highlightId,
        companyId: context.companyId,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            title: true,
            email: true,
            photoUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!highlight) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found' },
        { status: 404 }
      )
    }

    // 3. Format response
    const formattedHighlight = {
      id: highlight.id,
      citationText: highlight.citationText,
      achievement: highlight.achievement,
      narrative: highlight.narrative,
      classification: highlight.classification,
      awardName: highlight.awardName,
      categoryOfAward: highlight.categoryOfAward,
      awardingAgency: highlight.awardingAgency,
      awardYear: highlight.awardYear,
      supervisorQuote: highlight.supervisorQuote,
      createdAt: highlight.createdAt.toISOString(),
      updatedAt: highlight.updatedAt.toISOString(),
      employees: [{
        employee: highlight.employee,
      }],
      units: highlight.companyUnitLabel ? [{
        companyUnit: highlight.companyUnitLabel,
      }] : [],
      createdBy: highlight.createdBy,
    }

    return NextResponse.json({
      success: true,
      highlight: formattedHighlight,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/highlights/[id] error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to load highlight',
      },
      { status: 500 }
    )
  }
}
