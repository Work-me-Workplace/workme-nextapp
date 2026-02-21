import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/performance-plans
 * List performance plans for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const plans = await prisma.performancePlan.findMany({
      where: { workMeId },
      orderBy: { periodStart: 'desc' },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        periodType: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { objectives: true } },
      },
    })

    return NextResponse.json({
      success: true,
      performancePlans: plans || [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get performance plans'
    console.error('❌ GetPerformancePlans error:', error)
    return NextResponse.json(
      { success: false, error: message, performancePlans: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/performance-plans
 * Create a performance plan
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { periodStart, periodEnd, periodType, title } = body

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: 'periodStart and periodEnd are required' },
        { status: 400 },
      )
    }

    const plan = await prisma.performancePlan.create({
      data: {
        workMeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        periodType: periodType?.trim() || null,
        title: title?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      performancePlan: plan,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create performance plan'
    console.error('❌ CreatePerformancePlan error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
