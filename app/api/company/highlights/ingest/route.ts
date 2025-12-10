import { NextRequest, NextResponse } from 'next/server'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { parseHighlight } from '@/lib/ai/highlightParser'
import { prisma } from '@/lib/prisma'
import { mapStringToClassification, HighlightClassification } from '@/lib/config/highlightClassification'

export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/ingest
 * 
 * Parse highlight text with AI and extract highlight information
 * Employee info is provided separately (employeeId, unit)
 * Creates a draft highlight in the database (can be updated later)
 * 
 * Body: {
 *   text: string (required) - raw citation text
 *   employeeId: string (required) - ID of the employee getting the highlight
 *   unit?: string (optional) - employee's unit
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
    const { text, employeeId, unit } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'text is required' },
        { status: 400 }
      )
    }

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'employeeId is required' },
        { status: 400 }
      )
    }

    // 2. Verify employee exists and belongs to company
    const employee = await prisma.companyEmployee.findFirst({
      where: {
        id: employeeId,
        companyId: context.companyId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      )
    }

    // 3. Parse with AI (still extracts everything, but we'll ignore employee fields)
    const parsed = await parseHighlight(text.trim())

    // 4. Map classification to enum if needed
    const classification = parsed.classification
      ? (mapStringToClassification(parsed.classification) || 
         (Object.values(HighlightClassification).includes(parsed.classification as HighlightClassification) 
           ? parsed.classification as HighlightClassification 
           : null))
      : null

    // 5. Create draft highlight in database (use provided unit, not parsed unit)
    const highlight = await prisma.companyEmployeeHighlight.create({
      data: {
        citationText: parsed.citationText,
        achievement: parsed.achievement || null,
        narrative: parsed.narrative || null,
        classification: classification,
        awardName: parsed.awardName || null,
        awardingAgency: parsed.awardingAgency || null,
        awardYear: parsed.awardYear || null,
        supervisorQuote: parsed.supervisorQuote || null,
        companyUnitLabel: unit || employee.companyUnit || null,
        createdByWorkMeId: context.workMeId,
      },
    })

    // 5. Return parsed highlight data (no employee info needed - already have it)
    return NextResponse.json({
      success: true,
      highlight: {
        id: highlight.id,
        citationText: highlight.citationText,
        achievement: highlight.achievement,
        narrative: highlight.narrative,
        classification: highlight.classification,
        awardName: highlight.awardName,
        awardingAgency: highlight.awardingAgency,
        awardYear: highlight.awardYear,
        supervisorQuote: highlight.supervisorQuote,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/highlights/ingest error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse highlight',
      },
      { status: 500 }
    )
  }
}
