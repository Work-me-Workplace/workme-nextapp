import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/performance-reviews
 * List performance reviews for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const reviews = await prisma.performanceReview.findMany({
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
        _count: { select: { accomplishments: true } },
      },
    })

    return NextResponse.json({
      success: true,
      performanceReviews: reviews || [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get performance reviews'
    console.error('❌ GetPerformanceReviews error:', error)
    return NextResponse.json(
      { success: false, error: message, performanceReviews: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/performance-reviews
 * Create a performance review
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

    const review = await prisma.performanceReview.create({
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
      performanceReview: review,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create performance review'
    console.error('❌ CreatePerformanceReview error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
