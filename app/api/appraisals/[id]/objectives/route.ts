import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/appraisals/[id]/objectives
 * List objectives for an appraisal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: appraisalId } = await params

    const appraisal = await prisma.appraisal.findFirst({
      where: { id: appraisalId, workMeId },
    })

    if (!appraisal) {
      return NextResponse.json(
        { success: false, error: 'Appraisal not found' },
        { status: 404 },
      )
    }

    const objectives = await prisma.appraisalObjective.findMany({
      where: { appraisalId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      objectives,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get objectives'
    console.error('❌ GetAppraisalObjectives error:', error)
    return NextResponse.json(
      { success: false, error: message, objectives: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/appraisals/[id]/objectives
 * Create an objective under this appraisal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: appraisalId } = await params
    const body = await request.json()
    const { name, howMeasured, skillTopicIds, sortOrder } = body

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 },
      )
    }

    const appraisal = await prisma.appraisal.findFirst({
      where: { id: appraisalId, workMeId },
    })

    if (!appraisal) {
      return NextResponse.json(
        { success: false, error: 'Appraisal not found' },
        { status: 404 },
      )
    }

    const objective = await prisma.appraisalObjective.create({
      data: {
        appraisalId,
        name: String(name).trim(),
        howMeasured: howMeasured != null ? String(howMeasured).trim() || null : null,
        skillTopicIds: Array.isArray(skillTopicIds) ? skillTopicIds : [],
        sortOrder: sortOrder != null ? Number(sortOrder) : null,
      },
    })

    return NextResponse.json({
      success: true,
      objective,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create objective'
    console.error('❌ CreateAppraisalObjective error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
