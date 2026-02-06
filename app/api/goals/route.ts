import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/goals
 * Get all goals for current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const goals = await prisma.workGoal.findMany({
      where: { workMeId },
      orderBy: { createdAt: 'desc' },
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
      goals: goals || [],
    })
  } catch (error: any) {
    console.error('❌ GetGoals error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get goals', goals: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/goals
 * Create a new goal
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { goal, targetDate } = body

    if (!goal || !goal.trim()) {
      return NextResponse.json(
        { success: false, error: 'Goal is required' },
        { status: 400 },
      )
    }

    const newGoal = await prisma.workGoal.create({
      data: {
        workMeId,
        goal: goal.trim(),
        targetDate: targetDate ? new Date(targetDate) : null,
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
      goal: newGoal,
    })
  } catch (error: any) {
    console.error('❌ CreateGoal error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create goal' },
      { status: 500 },
    )
  }
}
