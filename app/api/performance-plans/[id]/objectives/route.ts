import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/performance-plans/[id]/objectives
 * List objectives for a performance plan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: performancePlanId } = await params

    const plan = await prisma.performancePlan.findFirst({
      where: { id: performancePlanId, workMeId },
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Performance plan not found' },
        { status: 404 },
      )
    }

    const objectives = await prisma.performancePlanObjective.findMany({
      where: { performancePlanId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      objectives,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get objectives'
    console.error('❌ GetPerformancePlanObjectives error:', error)
    return NextResponse.json(
      { success: false, error: message, objectives: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/performance-plans/[id]/objectives
 * Create an objective under this performance plan
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: performancePlanId } = await params
    const body = await request.json()
    const { name, howIllContribute, howMeasured, skillTopicIds, sortOrder } = body

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 },
      )
    }

    const plan = await prisma.performancePlan.findFirst({
      where: { id: performancePlanId, workMeId },
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Performance plan not found' },
        { status: 404 },
      )
    }

    const objective = await prisma.performancePlanObjective.create({
      data: {
        performancePlanId,
        name: String(name).trim(),
        howIllContribute:
          howIllContribute != null ? String(howIllContribute).trim() || null : null,
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
    console.error('❌ CreatePerformancePlanObjective error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
