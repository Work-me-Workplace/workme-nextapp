import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/company/select
 * 
 * Associate the authenticated user with a company
 * Updates WorkMe.companyId to link user to the company
 * 
 * Body: { companyId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth required
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { companyId } = body

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 },
      )
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        industry: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 },
      )
    }

    // Update WorkMe with companyId
    const updatedWorkMe = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        companyId: companyId,
      },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            industry: true,
          },
        },
      },
    })

    console.log('[CompanySelect] WorkMe updated:', {
      workMeId,
      companyId: updatedWorkMe.companyId,
    })

    return NextResponse.json({
      success: true,
      workMe: {
        id: updatedWorkMe.id,
        companyId: updatedWorkMe.companyId,
        company: updatedWorkMe.Company,
      },
      message: 'Company association saved successfully',
    })
  } catch (error: any) {
    console.error('[CompanySelect] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to associate company' },
      { status: 500 },
    )
  }
}
