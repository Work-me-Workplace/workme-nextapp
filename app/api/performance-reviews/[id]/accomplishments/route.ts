import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/performance-reviews/[id]/accomplishments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: performanceReviewId } = await params

    const review = await prisma.performanceReview.findFirst({
      where: { id: performanceReviewId, workMeId },
    })

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Performance review not found' },
        { status: 404 },
      )
    }

    const accomplishments = await prisma.performanceReviewAccomplishment.findMany({
      where: { performanceReviewId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      accomplishments,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get accomplishments'
    console.error('❌ GetPerformanceReviewAccomplishments error:', error)
    return NextResponse.json(
      { success: false, error: message, accomplishments: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/performance-reviews/[id]/accomplishments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: performanceReviewId } = await params
    const body = await request.json()
    const { title, description, sortOrder } = body

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 },
      )
    }

    const review = await prisma.performanceReview.findFirst({
      where: { id: performanceReviewId, workMeId },
    })

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Performance review not found' },
        { status: 404 },
      )
    }

    const accomplishment = await prisma.performanceReviewAccomplishment.create({
      data: {
        performanceReviewId,
        title: String(title).trim(),
        description: description != null ? String(description).trim() || null : null,
        sortOrder: sortOrder != null ? Number(sortOrder) : null,
      },
    })

    return NextResponse.json({
      success: true,
      accomplishment,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create accomplishment'
    console.error('❌ CreatePerformanceReviewAccomplishment error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
