import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/performance-review-accomplishments/[id]
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
    const { title, description, sortOrder } = body

    const existing = await prisma.performanceReviewAccomplishment.findFirst({
      where: { id },
      include: { performanceReview: true },
    })

    if (!existing || existing.performanceReview.workMeId !== workMeId) {
      return NextResponse.json(
        { success: false, error: 'Accomplishment not found' },
        { status: 404 },
      )
    }

    const accomplishment = await prisma.performanceReviewAccomplishment.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && {
          description: description === '' ? null : String(description).trim(),
        }),
        ...(sortOrder !== undefined && {
          sortOrder: sortOrder === '' || sortOrder == null ? null : Number(sortOrder),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      accomplishment,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update accomplishment'
    console.error('❌ UpdatePerformanceReviewAccomplishment error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/performance-review-accomplishments/[id]
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

    const existing = await prisma.performanceReviewAccomplishment.findFirst({
      where: { id },
      include: { performanceReview: true },
    })

    if (!existing || existing.performanceReview.workMeId !== workMeId) {
      return NextResponse.json(
        { success: false, error: 'Accomplishment not found' },
        { status: 404 },
      )
    }

    await prisma.performanceReviewAccomplishment.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Accomplishment deleted',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete accomplishment'
    console.error('❌ DeletePerformanceReviewAccomplishment error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
