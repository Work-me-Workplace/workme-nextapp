import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema
const createHighlightSchema = z.object({
  citationText: z.string().min(1),
  achievement: z.string().optional().nullable(),
  classification: z.string().optional().nullable(),
  awardName: z.string().optional().nullable(),
  awardingAgency: z.string().optional().nullable(),
  awardYear: z.number().optional().nullable(),
  supervisorQuote: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  narrative: z.string().optional().nullable(),
  employees: z.array(z.object({
    fullName: z.string(),
    title: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    photoUrl: z.string().optional().nullable(),
    companyId: z.string().optional().nullable(),
    companyUnitId: z.string().optional().nullable(),
    divisionId: z.string().optional().nullable(),
  })).min(1),
  companyUnits: z.array(z.string()).min(1), // Array of company unit strings
})

/**
 * POST /api/highlights/create
 * 
 * Creates a highlight with employees and company units
 * Upserts employees if they don't exist
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return NextResponse.json(
        { success: false, error: 'User must set a companyUnit' },
        { status: 400 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validated = createHighlightSchema.parse(body)

    console.log('[API POST /api/highlights/create]', {
      workMeId,
      companyUnit,
      employeeCount: validated.employees.length,
      unitCount: validated.companyUnits.length,
    })

    // 3. Upsert employees (create or find existing)
    const employeeIds: string[] = []
    
    for (const empData of validated.employees) {
      // Try to find existing employee by fullName and email (if provided)
      let employee = null
      
      if (empData.email) {
        employee = await prisma.companyEmployee.findFirst({
          where: {
            email: empData.email,
            fullName: empData.fullName,
          },
        })
      } else {
        // If no email, try to find by name and companyUnit
        employee = await prisma.companyEmployee.findFirst({
          where: {
            fullName: empData.fullName,
            companyUnitId: empData.companyUnitId || undefined,
          },
        })
      }

      if (employee) {
        // Update existing employee
        employee = await prisma.companyEmployee.update({
          where: { id: employee.id },
          data: {
            title: empData.title || employee.title,
            email: empData.email || employee.email,
            phone: empData.phone || employee.phone,
            photoUrl: empData.photoUrl || employee.photoUrl,
            companyId: empData.companyId || employee.companyId,
            companyUnitId: empData.companyUnitId || employee.companyUnitId,
            divisionId: empData.divisionId || employee.divisionId,
          },
        })
        employeeIds.push(employee.id)
      } else {
        // Create new employee
        // Need at least a companyId - use the first employee's companyId or create a default
        if (!empData.companyId) {
          return NextResponse.json(
            { success: false, error: 'companyId is required for new employees' },
            { status: 400 }
          )
        }

        const newEmployee = await prisma.companyEmployee.create({
          data: {
            fullName: empData.fullName,
            title: empData.title || null,
            email: empData.email || null,
            phone: empData.phone || null,
            photoUrl: empData.photoUrl || null,
            companyId: empData.companyId,
            companyUnitId: empData.companyUnitId || null,
            divisionId: empData.divisionId || null,
          },
        })
        employeeIds.push(newEmployee.id)
      }
    }

    // 4. Create highlight
    const highlight = await prisma.companyEmployeeHighlight.create({
      data: {
        citationText: validated.citationText,
        achievement: validated.achievement || null,
        classification: validated.classification || null,
        awardName: validated.awardName || null,
        awardingAgency: validated.awardingAgency || null,
        awardYear: validated.awardYear || null,
        supervisorQuote: validated.supervisorQuote || null,
        photoUrl: validated.photoUrl || null,
        narrative: validated.narrative || null,
        createdByWorkMeId: workMeId,
      },
    })

    // 5. Create employee links (junction table)
    for (const employeeId of employeeIds) {
      await prisma.companyEmployeeHighlightLink.create({
        data: {
          employeeId,
          highlightId: highlight.id,
        },
      })
    }

    // 6. Create company unit links (tenantization)
    for (const unit of validated.companyUnits) {
      await prisma.companyEmployeeHighlightUnit.create({
        data: {
          highlightId: highlight.id,
          companyUnit: unit,
        },
      })
    }

    // 7. Fetch hydrated highlight with relations
    const hydrated = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlight.id },
      include: {
        employees: {
          include: {
            employee: true,
          },
        },
        units: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            headline: true,
          },
        },
      },
    })

    console.log('[API POST /api/highlights/create] Success', {
      highlightId: highlight.id,
      employeeCount: employeeIds.length,
      unitCount: validated.companyUnits.length,
    })

    return NextResponse.json({
      success: true,
      highlight: hydrated,
    })
  } catch (error: any) {
    console.error('[API POST /api/highlights/create] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
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

