import { NextRequest, NextResponse } from 'next/server'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company/[companyId]/employees/upsert
 * 
 * Employee-first architecture: Upsert employee under authenticated user's company.
 * 
 * Request does NOT include companyId - server assigns it from WorkMe context.
 * 
 * Upsert by email (case-insensitive).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: paramCompanyId } = await params
    
    // 1. Get WorkMe context (gives us workMeId, companyId, workMeCompanyId)
    const workme = await getWorkMeContext(request)

    // 2. Validate companyId matches authenticated user's company
    if (workme.companyId !== paramCompanyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: companyId mismatch',
        },
        { status: 403 },
      )
    }

    if (!workme.companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User must belong to a company before creating employees',
        },
        { status: 400 },
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const { id, fullName, title, email, phone, photoUrl, companyUnit, division } = body

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'fullName is required',
        },
        { status: 400 },
      )
    }

    // 4. Upsert employee by email (case-insensitive) or fullName
    // First, try to find existing employee
    let existingEmployee = null
    if (email) {
      existingEmployee = await prisma.companyEmployee.findFirst({
        where: {
          email: email.toLowerCase(),
          companyId: workme.companyId,
        },
      })
    }
    
    // Fallback to fullName search if no email match
    if (!existingEmployee && fullName) {
      existingEmployee = await prisma.companyEmployee.findFirst({
        where: {
          fullName: {
            equals: fullName,
            mode: 'insensitive',
          },
          companyId: workme.companyId,
        },
      })
    }

    // Upsert logic
    const employee = existingEmployee
      ? // Update existing
        await prisma.companyEmployee.update({
          where: { id: existingEmployee.id },
          data: {
            fullName,
            title: title || existingEmployee.title,
            email: email?.toLowerCase() || existingEmployee.email,
            phone: phone || existingEmployee.phone,
            photoUrl: photoUrl || existingEmployee.photoUrl,
            companyUnit: companyUnit !== undefined ? companyUnit : existingEmployee.companyUnit,
            division: division !== undefined ? division : existingEmployee.division,
            // Don't update companyId, workMeCompanyId, or createdByWorkMeId on update
          },
        })
      : // Create new
        await prisma.companyEmployee.create({
          data: {
            fullName,
            title: title || null,
            email: email?.toLowerCase() || null,
            phone: phone || null,
            photoUrl: photoUrl || null,
            companyUnit: companyUnit || null,
            division: division || null,
            companyId: workme.companyId, // Authoritative org FK
            workMeCompanyId: workme.workMeCompanyId || '', // Silent tenant tag
            createdByWorkMeId: workme.workMeId, // Audit trail
          },
        })

    console.log('[API POST /api/company/[companyId]/employees/upsert]', {
      employeeId: employee.id,
      companyId: employee.companyId,
      workMeCompanyId: employee.workMeCompanyId,
    })

    return NextResponse.json({
      success: true,
      employee,
    })
  } catch (error: any) {
    console.error('[API POST /api/company/[companyId]/employees/upsert] Error:', {
      error: error.message,
      stack: error.stack,
    })

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee with this email already exists',
        },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upsert employee',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

