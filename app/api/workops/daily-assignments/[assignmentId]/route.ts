import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { deleteDailyAssignment } from '@/lib/server/workops/daily-assignments'
import { getOrCreateOutlook } from '@/lib/server/workops/outlook'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * DELETE /api/workops/daily-assignments/[assignmentId]
 * Delete a daily assignment
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { assignmentId } = await context.params

    // 3. Get outlook to verify ownership
    const outlook = await getOrCreateOutlook(workMeId)

    // Verify assignment belongs to this outlook
    const { prisma } = await import('@/lib/prisma')
    const assignment = await prisma.workOpsDailyAssignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (assignment.outlookId !== outlook.id) {
      return NextResponse.json(
        { error: 'Assignment does not belong to this outlook' },
        { status: 403 }
      )
    }

    await deleteDailyAssignment(assignmentId)

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    })
  } catch (error: any) {
    console.error(
      '❌ DELETE /api/workops/daily-assignments/[assignmentId] error:',
      error
    )

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete daily assignment',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status }
    )
  }
}
