import { NextRequest, NextResponse } from 'next/server'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { prisma } from '@/lib/prisma'
import { mapStringToClassification, HighlightClassification } from '@/lib/config/highlightClassification'

export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/save
 * 
 * Save highlight and link to employee
 * Employee must already exist (created in step 1)
 * 
 * Body: {
 *   highlightId: string (required) - ID of the highlight to update
 *   employeeId: string (required) - ID of the employee
 *   highlight: {
 *     citationText: string (required)
 *     achievement?: string
 *     narrative?: string
 *     classification?: string
 *     awardName?: string
 *     awardingAgency?: string
 *     awardYear?: number
 *     supervisorQuote?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth and get context
    const context = await getWorkMeContext(request)

    if (!context.companyId) {
      return NextResponse.json(
        { success: false, error: 'User must belong to a company' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { highlightId, employeeId, highlight } = body

    if (!highlightId) {
      return NextResponse.json(
        { success: false, error: 'highlightId is required' },
        { status: 400 }
      )
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId is required' },
        { status: 400 }
      )
    }

    if (!highlight || !highlight.citationText) {
      return NextResponse.json(
        { success: false, error: 'highlight.citationText is required' },
        { status: 400 }
      )
    }

    // 2. Verify employee exists and belongs to company
    const employeeRecord = await prisma.companyEmployee.findFirst({
      where: {
        id: employeeId,
        companyId: context.companyId,
      },
    })

    if (!employeeRecord) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // 3. Map classification to enum if needed
    const classification = highlight.classification
      ? (mapStringToClassification(highlight.classification) || 
         (Object.values(HighlightClassification).includes(highlight.classification as HighlightClassification) 
           ? highlight.classification as HighlightClassification 
           : null))
      : null

    // 4. Verify highlight exists and belongs to company
    const existingHighlight = await prisma.companyEmployeeHighlight.findFirst({
      where: {
        id: highlightId,
        companyId: context.companyId,
      },
    })

    if (!existingHighlight) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found' },
        { status: 404 }
      )
    }

    // 5. Update highlight (it was created in ingest step)
    const highlightRecord = await prisma.companyEmployeeHighlight.update({
      where: { id: highlightId },
      data: {
        citationText: highlight.citationText,
        achievement: highlight.achievement || null,
        narrative: highlight.narrative || null,
        classification: classification,
        awardName: highlight.awardName || null,
        categoryOfAward: highlight.categoryOfAward || null,
        awardingAgency: highlight.awardingAgency || null,
        awardYear: highlight.awardYear || null,
        supervisorQuote: highlight.supervisorQuote || null,
        companyUnitLabel: employeeRecord.companyUnit || null,
        companyId: context.companyId, // Ensure companyId is set
        employeeId: employeeRecord.id, // Ensure employeeId is set
      },
    })

    // 6. Return full highlight with employee
    const result = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlightRecord.id },
      include: {
        employee: true,
      },
    })

    return NextResponse.json({
      success: true,
      highlight: result,
      employee: employeeRecord,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/highlights/save error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save highlight',
      },
      { status: 500 }
    )
  }
}
