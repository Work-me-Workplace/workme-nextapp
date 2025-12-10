import { NextRequest, NextResponse } from 'next/server'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { prisma } from '@/lib/prisma'
import { createEmployee } from '@/lib/employee/service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/save
 * 
 * Save highlight and link to employee
 * Creates employee if not found (based on fullName match)
 * 
 * Body: {
 *   highlightId?: string (if provided, update existing highlight)
 *   employee: {
 *     fullName: string (required)
 *     title?: string
 *     email?: string
 *     unitRaw?: string
 *   }
 *   highlight: {
 *     citationText: string (required)
 *     achievement?: string
 *     narrative?: string
 *     classification?: string
 *     awardName?: string
 *     awardingAgency?: string
 *     awardYear?: number
 *     supervisorQuote?: string
 *     photoUrl?: string
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
    const { highlightId, employee, highlight } = body

    if (!employee || !employee.fullName) {
      return NextResponse.json(
        { success: false, error: 'employee.fullName is required' },
        { status: 400 }
      )
    }

    if (!highlight || !highlight.citationText) {
      return NextResponse.json(
        { success: false, error: 'highlight.citationText is required' },
        { status: 400 }
      )
    }

    // 2. Find or create employee
    let employeeRecord = await prisma.companyEmployee.findFirst({
      where: {
        companyId: context.companyId,
        fullName: {
          equals: employee.fullName.trim(),
          mode: 'insensitive',
        },
      },
    })

    if (!employeeRecord) {
      // Create employee if not found
      employeeRecord = await createEmployee({
        fullName: employee.fullName.trim(),
        title: employee.title || null,
        email: employee.email || null,
        companyUnit: employee.unitRaw || null,
      })
    } else {
      // Update employee if new info provided
      if (employee.title || employee.email || employee.unitRaw) {
        employeeRecord = await prisma.companyEmployee.update({
          where: { id: employeeRecord.id },
          data: {
            ...(employee.title && { title: employee.title }),
            ...(employee.email && { email: employee.email }),
            ...(employee.unitRaw && { companyUnit: employee.unitRaw }),
          },
        })
      }
    }

    // 3. Create or update highlight
    let highlightRecord
    if (highlightId) {
      // Update existing highlight
      highlightRecord = await prisma.companyEmployeeHighlight.update({
        where: { id: highlightId },
        data: {
          citationText: highlight.citationText,
          achievement: highlight.achievement || null,
          narrative: highlight.narrative || null,
          classification: highlight.classification || null,
          awardName: highlight.awardName || null,
          awardingAgency: highlight.awardingAgency || null,
          awardYear: highlight.awardYear || null,
          supervisorQuote: highlight.supervisorQuote || null,
          photoUrl: highlight.photoUrl || null,
          companyUnitLabel: employee.unitRaw || null,
        },
      })
    } else {
      // Create new highlight
      highlightRecord = await prisma.companyEmployeeHighlight.create({
        data: {
          citationText: highlight.citationText,
          achievement: highlight.achievement || null,
          narrative: highlight.narrative || null,
          classification: highlight.classification || null,
          awardName: highlight.awardName || null,
          awardingAgency: highlight.awardingAgency || null,
          awardYear: highlight.awardYear || null,
          supervisorQuote: highlight.supervisorQuote || null,
          photoUrl: highlight.photoUrl || null,
          companyUnitLabel: employee.unitRaw || null,
          createdByWorkMeId: context.workMeId,
        },
      })
    }

    // 4. Link highlight to employee (upsert - won't error if already linked)
    await prisma.companyEmployeeHighlightLink.upsert({
      where: {
        employeeId_highlightId: {
          employeeId: employeeRecord.id,
          highlightId: highlightRecord.id,
        },
      },
      create: {
        employeeId: employeeRecord.id,
        highlightId: highlightRecord.id,
      },
      update: {}, // No-op update if exists
    })

    // 5. Return full highlight with employee
    const result = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlightRecord.id },
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
