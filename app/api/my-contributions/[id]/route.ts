import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/my-contributions/[id]
 * Update a contribution
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
    const { title, description, whatDid, results, skillTopicIds, startedAt, completedAt } = body

    // Verify contribution belongs to user
    const existing = await prisma.myContribution.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Contribution not found' },
        { status: 404 },
      )
    }

    const updated = await prisma.myContribution.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        whatDid: whatDid !== undefined ? whatDid : undefined,
        results: results !== undefined ? results : undefined,
        skillTopicIds: skillTopicIds !== undefined ? skillTopicIds : undefined,
        startedAt: startedAt !== undefined ? (startedAt ? new Date(startedAt) : null) : undefined,
        completedAt: completedAt !== undefined ? (completedAt ? new Date(completedAt) : null) : undefined,
      },
      include: {
        companyEvent: {
          select: { id: true, title: true }
        },
      },
    })

    return NextResponse.json({
      success: true,
      contribution: updated,
    })
  } catch (error: any) {
    console.error('❌ UpdateMyContribution error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update contribution' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/my-contributions/[id]
 * Delete a contribution
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

    // Verify contribution belongs to user
    const existing = await prisma.myContribution.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Contribution not found' },
        { status: 404 },
      )
    }

    await prisma.myContribution.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Contribution deleted successfully',
    })
  } catch (error: any) {
    console.error('❌ DeleteMyContribution error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete contribution' },
      { status: 500 },
    )
  }
}
