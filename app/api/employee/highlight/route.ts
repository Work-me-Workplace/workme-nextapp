import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { parseHighlight } from '@/lib/ai/highlightParser'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/employee/highlight
 * 
 * Create a highlight for an employee
 * 
 * Body: {
 *   employeeId: string (required)
 *   citationText?: string (if using AI, this is the raw text)
 *   useAI?: boolean (if true, parse citationText with AI)
 *   // OR provide structured data directly:
 *   achievement?: string,
 *   narrative?: string,
 *   classification?: string,
 *   awardName?: string,
 *   awardingAgency?: string,
 *   awardYear?: number,
 *   supervisorQuote?: string,
 *   photoUrl?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!workMe.companyId) {
      return NextResponse.json(
        { success: false, error: 'User must belong to a company' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      employeeId,
      citationText,
      useAI,
      achievement,
      narrative,
      classification,
      awardName,
      awardingAgency,
      awardYear,
      supervisorQuote,
      photoUrl,
    } = body

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId is required' },
        { status: 400 }
      )
    }

    // Verify employee exists and belongs to user's company
    const employee = await prisma.companyEmployee.findFirst({
      where: {
        id: employeeId,
        companyId: workMe.companyId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    let highlightData: any = {}

    // 2. If using AI, parse the citation text
    if (useAI && citationText) {
      const parsed = await parseHighlight(citationText)

      highlightData = {
        citationText: parsed.citationText,
        achievement: parsed.achievement || null,
        narrative: parsed.narrative || null,
        classification: parsed.classification || null,
        awardName: parsed.awardName || null,
        awardingAgency: parsed.awardingAgency || null,
        awardYear: parsed.awardYear || null,
        supervisorQuote: parsed.supervisorQuote || null,
        companyUnitLabel: parsed.unit || companyUnit || null,
      }
    } else {
      // Use provided structured data
      highlightData = {
        citationText: citationText || '',
        achievement: achievement || null,
        narrative: narrative || null,
        classification: classification || null,
        awardName: awardName || null,
        awardingAgency: awardingAgency || null,
        awardYear: awardYear || null,
        supervisorQuote: supervisorQuote || null,
        companyUnitLabel: companyUnit || null,
      }
    }

    if (!highlightData.citationText || highlightData.citationText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'citationText is required' },
        { status: 400 }
      )
    }

    // 3. Create highlight
    const highlight = await prisma.companyEmployeeHighlight.create({
      data: {
        ...highlightData,
        photoUrl: photoUrl || null,
        createdByWorkMeId: workMeId,
      },
    })

    // 4. Link highlight to employee
    await prisma.companyEmployeeHighlightLink.create({
      data: {
        employeeId: employee.id,
        highlightId: highlight.id,
      },
    })

    // 5. Return full object
    const result = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlight.id },
      include: {
        employees: {
          include: {
            employee: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      highlight: result,
    })
  } catch (error: any) {
    console.error('❌ POST /api/employee/highlight error:', error)

    // Handle unique constraint violation (employee already linked)
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Highlight already linked to this employee',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create highlight',
      },
      { status: 500 }
    )
  }
}
