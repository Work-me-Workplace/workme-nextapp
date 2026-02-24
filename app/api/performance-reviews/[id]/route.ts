import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/performance-reviews/[id]
 * Get one performance review with accomplishments and linked contribution summaries
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

    const review = await prisma.performanceReview.findFirst({
      where: { id, workMeId },
      include: {
        accomplishments: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        contributionSummaries: true,
      },
    })

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Performance review not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      performanceReview: review,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get performance review'
    console.error('❌ GetPerformanceReview error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/performance-reviews/[id]
 * Update performance review
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

    const existing = await prisma.performanceReview.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Performance review not found' },
        { status: 404 },
      )
    }

    const review = await prisma.performanceReview.update({
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
      performanceReview: review,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update performance review'
    console.error('❌ UpdatePerformanceReview error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/performance-reviews/[id]
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

    const existing = await prisma.performanceReview.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Performance review not found' },
        { status: 404 },
      )
    }

    await prisma.contributionSummary.updateMany({
      where: { performanceReviewId: id },
      data: { performanceReviewId: null },
    })
    await prisma.performanceReview.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Performance review deleted',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete performance review'
    console.error('❌ DeletePerformanceReview error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
