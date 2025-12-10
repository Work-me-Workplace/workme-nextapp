/**
 * ⚠️ DEPRECATED - COMMENTED OUT
 * 
 * This route referenced the deleted CompanyUnit/DivisionUnit models.
 * Use /api/company-affiliation/save instead (MVP1 architecture).
 */

/*
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/profile/company-division/save
 * 
 * DEPRECATED: Use /api/company-affiliation/save instead
 * 
 * Save companyUnitId and divisionId directly to WorkMe
 * (CompanyAffiliation model has been removed)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 2. Get data from body
    const body = await request.json()
    const { companyUnitId, divisionUnitId } = body

    // 3. Validate companyUnitId exists (if provided)
    if (companyUnitId) {
      const company = await prisma.companyUnit.findUnique({
        where: { id: companyUnitId },
      })

      if (!company) {
        return NextResponse.json(
          { success: false, error: 'Company not found' },
          { status: 404 },
        )
      }

      // 4. Validate divisionUnitId belongs to companyUnitId (if provided)
      if (divisionUnitId) {
        const division = await prisma.divisionUnit.findUnique({
          where: { id: divisionUnitId },
        })

        if (!division) {
          return NextResponse.json(
            { success: false, error: 'Division not found' },
            { status: 404 },
          )
        }

        if (division.companyUnitId !== companyUnitId) {
          return NextResponse.json(
            { success: false, error: 'Division does not belong to the selected company' },
            { status: 400 },
          )
        }
      }
    }

    // 5. Update WorkMe directly (CompanyAffiliation model removed)
    const updatedWorkMe = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        companyUnitId: companyUnitId !== undefined ? companyUnitId : undefined,
        divisionId: divisionUnitId !== undefined ? divisionUnitId : undefined,
      },
      include: {
        companyUnit: {
          select: {
            id: true,
            name: true,
          },
        },
        division: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      profile: {
        companyUnitId: updatedWorkMe.companyUnitId,
        divisionId: updatedWorkMe.divisionId,
        company: updatedWorkMe.companyUnit,
        division: updatedWorkMe.division,
      },
      // Backward compatibility
      companyAffiliation: {
        companyUnitId: updatedWorkMe.companyUnitId,
        divisionUnitId: updatedWorkMe.divisionId, // Note: field name changed to divisionId
        company: updatedWorkMe.companyUnit,
        division: updatedWorkMe.division,
      },
    })
  } catch (error: any) {
    console.error('❌ Profile company-division save error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save company/division' },
      { status: 500 },
    )
  }
}
*/

// Stub to prevent 404
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'This route has been deprecated. Use /api/company-affiliation/save instead.' },
    { status: 410 }, // 410 Gone
  )
}
