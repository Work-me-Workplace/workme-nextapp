import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/next-job/target-jobs/[id]
 * Get one target job with career contacts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params

    const job = await prisma.targetJob.findFirst({
      where: { id, workMeId },
      include: { careerContacts: true },
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Target job not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      targetJob: job,
    })
  } catch (error: any) {
    console.error('❌ Get target job error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get target job' },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/next-job/target-jobs/[id]
 * Update a target job
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.targetJob.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Target job not found' },
        { status: 404 },
      )
    }

    const data: Record<string, unknown> = {}
    const allowed = [
      'jobTitle',
      'companyName',
      'rawDescription',
      'salaryBand',
      'industryOrRole',
      'sourceUrl',
      'parsedRequirements',
      'status',
    ]
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'parsedRequirements') {
          data[key] = body[key]
        } else if (typeof body[key] === 'string') {
          data[key] = body[key].trim()
        } else {
          data[key] = body[key]
        }
      }
    }

    const job = await prisma.targetJob.update({
      where: { id },
      data,
      include: { careerContacts: true },
    })

    return NextResponse.json({
      success: true,
      targetJob: job,
    })
  } catch (error: any) {
    console.error('❌ Update target job error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update target job' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/next-job/target-jobs/[id]
 * Delete a target job (career contacts get targetJobId set null via onDelete: SetNull)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params

    const existing = await prisma.targetJob.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Target job not found' },
        { status: 404 },
      )
    }

    await prisma.targetJob.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Target job deleted',
    })
  } catch (error: any) {
    console.error('❌ Delete target job error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete target job' },
      { status: 500 },
    )
  }
}
