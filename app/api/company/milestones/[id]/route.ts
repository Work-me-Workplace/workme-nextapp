/**
 * DELETE /api/company/milestones/[id]
 * 
 * Delete a CompanyMilestone
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify milestone exists and belongs to company
    const milestone = await prisma.companyMilestone.findFirst({
      where: {
        id,
        companyId,
      },
    })

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete the milestone
    await prisma.companyMilestone.delete({
      where: { id },
    })

    console.log(`✅ Deleted milestone ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ DELETE /api/company/milestones/[id] error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete milestone' },
      { status: 500 }
    )
  }
}

