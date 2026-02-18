import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/appraisals/[id]
 * Get one appraisal with objectives and linked assessment(s)
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

    const appraisal = await prisma.appraisal.findFirst({
      where: { id, workMeId },
      include: {
        objectives: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        contributionSummaries: true,
      },
    })

    if (!appraisal) {
      return NextResponse.json(
        { success: false, error: 'Appraisal not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      appraisal,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get appraisal'
    console.error('❌ GetAppraisal error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/appraisals/[id]
 * Update appraisal
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
    const { periodStart, periodEnd, title } = body

    const existing = await prisma.appraisal.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Appraisal not found' },
        { status: 404 },
      )
    }

    const appraisal = await prisma.appraisal.update({
      where: { id },
      data: {
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
        title: title !== undefined ? (title === '' ? null : title) : undefined,
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      appraisal,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update appraisal'
    console.error('❌ UpdateAppraisal error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/appraisals/[id]
 * Delete appraisal (cascades to objectives; unlinks contribution summaries)
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

    const existing = await prisma.appraisal.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Appraisal not found' },
        { status: 404 },
      )
    }

    await prisma.contributionSummary.updateMany({
      where: { appraisalId: id },
      data: { appraisalId: null },
    })
    await prisma.appraisal.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Appraisal deleted',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete appraisal'
    console.error('❌ DeleteAppraisal error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
