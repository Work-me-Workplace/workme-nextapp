import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { buildDigitalSignFromHighlight } from '@/lib/services/digital-sign-employee-highlight-builder-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mywork/digital-signage/build/employee-highlight
 * 
 * Step 2: Build digital slide with AI
 * 
 * Loads highlight and employee, then calls GPT to generate signage fields
 */
export async function POST(request: NextRequest) {
  try {
    await requireWorkMeAuth(request)
    const body = await request.json()
    
    const { highlightId } = body

    if (!highlightId) {
      return NextResponse.json(
        { success: false, error: 'highlightId is required' },
        { status: 400 }
      )
    }

    // Load highlight with employee
    const highlight = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlightId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            title: true,
            companyUnit: true,
          }
        }
      }
    })

    if (!highlight || !highlight.employee) {
      return NextResponse.json(
        { success: false, error: 'Highlight not found or has no employee' },
        { status: 404 }
      )
    }

    // Call GPT using the WorkMeDigitalSignEmployeeHighlightBuilderService
    const built = await buildDigitalSignFromHighlight({
      employeeFullName: highlight.employee.fullName,
      employeeTitle: highlight.employee.title,
      employeeUnit: highlight.companyUnitLabel || highlight.employee.companyUnit,
      companyUnitLabel: highlight.companyUnitLabel || highlight.employee.companyUnit,
      awardName: highlight.awardName,
      awardingAgency: highlight.awardingAgency,
      awardYear: highlight.awardYear,
      achievement: highlight.achievement,
      citationText: highlight.citationText,
      classification: highlight.classification,
    })

    // Return GPT JSON exactly as specified
    return NextResponse.json({
      success: true,
      headline: built.headline,
      subhead: built.subhead,
      detailBlock: built.detailBlock,
      runtimeGuidance: built.runtimeGuidance,
      suggestedImageDescription: built.suggestedImageDescription,
    })
  } catch (error: any) {
    console.error('❌ POST /api/mywork/digital-signage/build/employee-highlight error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to build digital signage with AI',
      },
      { status: 500 }
    )
  }
}
