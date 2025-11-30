import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/user/update
 * 
 * Update user's companyUnit and companyDivision
 * Called from /setup/unit page
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit: currentCompanyUnit } = workMe
    const body = await request.json()
    const { companyUnit, companyDivision } = body

    if (!companyUnit || typeof companyUnit !== 'string' || !companyUnit.trim()) {
      return NextResponse.json(
        { success: false, error: 'companyUnit is required' },
        { status: 400 }
      )
    }

    // Update user's companyUnit and companyDivision
    const updated = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        companyUnit: companyUnit.trim(),
        companyDivision: companyDivision?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        companyUnit: true,
        companyDivision: true,
      },
    })

    console.log('[API POST /api/user/update] SUCCESS', {
      workMeId: updated.id,
      companyUnit: updated.companyUnit,
      companyDivision: updated.companyDivision,
    })

    return NextResponse.json({
      success: true,
      user: updated,
    })
  } catch (error: any) {
    console.error('[API POST /api/user/update] ERROR:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update user' 
      },
      { status: 500 }
    )
  }
}

