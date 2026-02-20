import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/performance-plans/[id]
 * Get one performance plan with objectives and linked contribution summaries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params

    const plan = await prisma.performancePlan.findFirst({
      where: { id, workMeId },
      include: {
        objectives: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Performance plan not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      performancePlan: plan,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get performance plan'
    console.error('❌ GetPerformancePlan error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/performance-plans/[id]
 * Update performance plan
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
    const { periodStart, periodEnd, periodType, title } = body

    const existing = await prisma.performancePlan.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Performance plan not found' },
        { status: 404 },
      )
    }

    const plan = await prisma.performancePlan.update({
      where: { id },
      data: {
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
        periodType: periodType !== undefined ? (periodType === '' ? null : periodType) : undefined,
        title: title !== undefined ? (title === '' ? null : title) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      performancePlan: plan,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update performance plan'
    console.error('❌ UpdatePerformancePlan error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/performance-plans/[id]
 * Delete performance plan (cascades to objectives; unlinks contribution summaries)
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

    const existing = await prisma.performancePlan.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Performance plan not found' },
        { status: 404 },
      )
    }

    await prisma.performancePlan.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Performance plan deleted',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete performance plan'
    console.error('❌ DeletePerformancePlan error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
