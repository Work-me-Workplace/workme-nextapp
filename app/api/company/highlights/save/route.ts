import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { upsertEmployee } from '@/lib/company/employee/upsertEmployee'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/save
 * 
 * Saves an edited highlight after user review.
 * Updates highlight and employee records.
 * 
 * Body: {
 *   highlightId: string,
 *   employee: { fullName, title, email, ... },
 *   highlight: { citationText, achievement, ... },
 *   companyUnitId?: string,
 *   divisionId?: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User must set a companyUnit before saving highlights' 
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { highlightId, employee, highlight, companyUnitId, divisionId } = body

    if (!highlightId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'highlightId is required' 
        },
        { status: 400 },
      )
    }

    // Verify highlight exists and user created it
    const existingHighlight = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlightId },
    })

    if (!existingHighlight) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Highlight not found' 
        },
        { status: 404 },
      )
    }

    if (existingHighlight.createdByWorkMeId !== workMeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized: You can only edit highlights you created' 
        },
        { status: 403 },
      )
    }

    // Get companyId from user's companyUnit
    const companyUnitRecord = await prisma.companyUnit.findFirst({
      where: {
        name: {
          equals: companyUnit,
          mode: 'insensitive',
        },
      },
    })

    const companyId = companyUnitRecord?.companyId || null

    if (!companyId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User must belong to a company unit with a company' 
        },
        { status: 400 },
      )
    }

    // 3. Upsert employee with provided data
    const employeeRecord = await upsertEmployee({
      fullName: employee.fullName,
      title: employee.title || null,
      email: employee.email || null,
      phone: employee.phone || null,
      photoUrl: employee.photoUrl || null,
      unitRaw: employee.unitRaw || null,
      companyId,
      companyUnitId: companyUnitId || null,
      divisionId: divisionId || null,
    })

    // 4. Update highlight
    const updatedHighlight = await prisma.companyEmployeeHighlight.update({
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
      },
    })

    // 5. Update employee link (delete old, create new if changed)
    const existingLink = await prisma.companyEmployeeHighlightLink.findFirst({
      where: { highlightId },
    })

    if (existingLink && existingLink.employeeId !== employeeRecord.id) {
      await prisma.companyEmployeeHighlightLink.delete({
        where: { id: existingLink.id },
      })
      await prisma.companyEmployeeHighlightLink.create({
        data: {
          employeeId: employeeRecord.id,
          highlightId: highlightId,
        },
      })
    } else if (!existingLink) {
      await prisma.companyEmployeeHighlightLink.create({
        data: {
          employeeId: employeeRecord.id,
          highlightId: highlightId,
        },
      })
    }

    // 6. Return updated object
    const result = await prisma.companyEmployeeHighlight.findUnique({
      where: { id: highlightId },
      include: {
        employees: {
          include: {
            employee: true,
          },
        },
        units: true,
      },
    })

    console.log('[API POST /api/company/highlights/save] SUCCESS', {
      highlightId,
      employeeId: employeeRecord.id,
    })

    return NextResponse.json({
      success: true,
      highlight: result,
      employee: employeeRecord,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/highlights/save error:', error)

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to save highlight',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

