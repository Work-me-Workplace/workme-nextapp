import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/contribution-summaries/[id]
 * Update a contribution summary
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
    const { periodStart, periodEnd, periodType, title, summary, skillTopicIds, companyWorkId } = body

    // Verify summary belongs to user
    const existingSummary = await prisma.contributionSummary.findFirst({
      where: { id, workMeId },
    })

    if (!existingSummary) {
      return NextResponse.json(
        { success: false, error: 'Contribution summary not found' },
        { status: 404 },
      )
    }

    const updatedSummary = await prisma.contributionSummary.update({
      where: { id },
      data: {
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
        periodType: periodType !== undefined ? periodType : undefined,
        title: title !== undefined ? title : undefined,
        summary: summary !== undefined ? summary : undefined,
        skillTopicIds: skillTopicIds !== undefined ? skillTopicIds : undefined,
        companyWorkId: companyWorkId !== undefined ? companyWorkId : undefined,
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        periodType: true,
        title: true,
        summary: true,
        skillTopicIds: true,
        companyWorkId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      summary: updatedSummary,
    })
  } catch (error: any) {
    console.error('❌ UpdateContributionSummary error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update contribution summary' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/contribution-summaries/[id]
 * Delete a contribution summary
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

    // Verify summary belongs to user
    const existingSummary = await prisma.contributionSummary.findFirst({
      where: { id, workMeId },
    })

    if (!existingSummary) {
      return NextResponse.json(
        { success: false, error: 'Contribution summary not found' },
        { status: 404 },
      )
    }

    await prisma.contributionSummary.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Contribution summary deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ DeleteContributionSummary error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete contribution summary' },
      { status: 500 },
    )
  }
}
