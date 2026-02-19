import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/performance-plan-objectives/[id]
 * Update an objective
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
    const { name, howIllContribute, howMeasured, skillTopicIds, sortOrder } = body

    const existing = await prisma.performancePlanObjective.findFirst({
      where: { id },
      include: { performancePlan: true },
    })

    if (!existing || existing.performancePlan.workMeId !== workMeId) {
      return NextResponse.json(
        { success: false, error: 'Objective not found' },
        { status: 404 },
      )
    }

    const objective = await prisma.performancePlanObjective.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(howIllContribute !== undefined && {
          howIllContribute:
            howIllContribute === '' ? null : String(howIllContribute).trim(),
        }),
        ...(howMeasured !== undefined && {
          howMeasured: howMeasured === '' ? null : String(howMeasured).trim(),
        }),
        ...(skillTopicIds !== undefined && {
          skillTopicIds: Array.isArray(skillTopicIds) ? skillTopicIds : [],
        }),
        ...(sortOrder !== undefined && {
          sortOrder: sortOrder === '' || sortOrder == null ? null : Number(sortOrder),
        }),
      },
    })

    return NextResponse.json({
      success: true,
      objective,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update objective'
    console.error('❌ UpdatePerformancePlanObjective error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/performance-plan-objectives/[id]
 * Delete an objective
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

    const existing = await prisma.performancePlanObjective.findFirst({
      where: { id },
      include: { performancePlan: true },
    })

    if (!existing || existing.performancePlan.workMeId !== workMeId) {
      return NextResponse.json(
        { success: false, error: 'Objective not found' },
        { status: 404 },
      )
    }

    await prisma.performancePlanObjective.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Objective deleted',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete objective'
    console.error('❌ DeletePerformancePlanObjective error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
