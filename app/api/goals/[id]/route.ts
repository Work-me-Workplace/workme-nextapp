import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/goals/[id]
 * Update a goal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params
    const body = await request.json()
    const { goal, targetDate } = body

    // Verify goal belongs to user
    const existingGoal = await prisma.workGoal.findFirst({
      where: { id, workMeId },
    })

    if (!existingGoal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 },
      )
    }

    const updatedGoal = await prisma.workGoal.update({
      where: { id },
      data: {
        goal: goal !== undefined ? goal.trim() : undefined,
        targetDate: targetDate !== undefined ? (targetDate ? new Date(targetDate) : null) : undefined,
      },
      select: {
        id: true,
        goal: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
    })
  } catch (error: any) {
    console.error('❌ UpdateGoal error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update goal' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/goals/[id]
 * Delete a goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params

    // Verify goal belongs to user
    const existingGoal = await prisma.workGoal.findFirst({
      where: { id, workMeId },
    })

    if (!existingGoal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 },
      )
    }

    await prisma.workGoal.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ DeleteGoal error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete goal' },
      { status: 500 },
    )
  }
}
