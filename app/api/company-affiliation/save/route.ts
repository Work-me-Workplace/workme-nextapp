import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company-affiliation/save
 * 
 * Save company and division to CompanyAffiliation module
 * Do NOT write to WorkMe
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { companyUnitId, divisionUnitId } = body

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 },
      )
    }

    // Upsert CompanyAffiliation (NOT WorkMe)
    const companyAffiliation = await prisma.companyAffiliation.upsert({
      where: { workMeId },
      create: {
        workMeId,
        companyUnitId: companyUnitId || null,
        divisionUnitId: divisionUnitId || null,
      },
      update: {
        companyUnitId: companyUnitId !== undefined ? companyUnitId : undefined,
        divisionUnitId: divisionUnitId !== undefined ? divisionUnitId : undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      companyAffiliation,
    })
  } catch (error: any) {
    console.error('❌ CompanyAffiliationSave error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save company affiliation' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/company-affiliation
 * 
 * Get CompanyAffiliation for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const companyAffiliation = await prisma.companyAffiliation.findUnique({
      where: { workMeId },
      include: {
        company: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      companyAffiliation: companyAffiliation || null,
    })
  } catch (error: any) {
    console.error('❌ CompanyAffiliationGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get company affiliation' },
      { status: 500 },
    )
  }
}

