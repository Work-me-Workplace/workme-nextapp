import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/profile/company-division/save
 * 
 * Save companyUnitId and divisionUnitId to WorkProfile
 * This is the source of truth for workforce affiliation
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

    // 5. Upsert WorkProfile with company/division affiliation
    const profile = await prisma.workProfile.upsert({
      where: { userId: workMeId },
      create: {
        userId: workMeId,
        companyUnitId: companyUnitId || null,
        divisionUnitId: divisionUnitId || null,
        handle: `temp_${workMeId.slice(0, 8)}`, // Temporary handle - user must set their own
      },
      update: {
        companyUnitId: companyUnitId !== undefined ? companyUnitId : undefined,
        divisionUnitId: divisionUnitId !== undefined ? divisionUnitId : undefined,
      },
      include: {
        company: {
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
        id: profile.id,
        companyUnitId: profile.companyUnitId,
        divisionUnitId: profile.divisionUnitId,
        company: profile.company,
        division: profile.division,
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

