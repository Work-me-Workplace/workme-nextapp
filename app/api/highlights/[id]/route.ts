import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/highlights/[id]
 * 
 * Returns full detail for a specific highlight
 * Includes employees, units, and creator info
 * Validates companyUnit access via junction table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'User must be associated with a company' },
        { status: 400 }
      )
    }

    // 2. Get highlight ID from params
    const { id } = await params

    console.log('[API GET /api/highlights/[id]]', { highlightId: id, companyId })

    // 3. Fetch full highlight with all relations
    const highlight = await prisma.companyEmployeeHighlight.findUnique({
      where: { id },
      include: {
        employees: {
          include: {
            employee: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            headline: true,
            title: true,
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

    // 4. Verify access - check if any linked employee belongs to user's companyId
    const hasAccess = highlight.employees.some(
      link => link.employee.companyId === companyId
    )

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found or access denied' },
        { status: 404 }
      )
    }

    // 5. Transform for frontend
    const transformed = {
      id: highlight.id,
      citationText: highlight.citationText,
      achievement: highlight.achievement,
      narrative: highlight.narrative,
      classification: highlight.classification,
      awardName: highlight.awardName,
      awardingAgency: highlight.awardingAgency,
      awardYear: highlight.awardYear,
      supervisorQuote: highlight.supervisorQuote,
      photoUrl: highlight.photoUrl,
      createdAt: highlight.createdAt,
      updatedAt: highlight.updatedAt,
      companyUnitLabel: highlight.companyUnitLabel,
      employees: highlight.employees.map(e => ({
        id: e.employee.id,
        fullName: e.employee.fullName,
        title: e.employee.title,
        email: e.employee.email,
        phone: e.employee.phone,
        photoUrl: e.employee.photoUrl,
        companyId: e.employee.companyId,
        companyUnit: e.employee.companyUnit,
        division: e.employee.division,
      })),
      createdBy: highlight.createdBy,
    }

    console.log('[API GET /api/highlights/[id]] Success', {
      highlightId: id,
      employeeCount: transformed.employees.length,
    })

    return NextResponse.json({
      success: true,
      highlight: transformed,
    })
  } catch (error: any) {
    console.error('[API GET /api/highlights/[id]] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch highlight',
      },
      { status: 500 }
    )
  }
}

