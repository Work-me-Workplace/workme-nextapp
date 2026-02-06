import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/contribution-summaries
 * Get all contribution summaries (assessments) for current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const summaries = await prisma.contributionSummary.findMany({
      where: { workMeId },
      orderBy: { periodStart: 'desc' },
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
      summaries: summaries || [],
    })
  } catch (error: any) {
    console.error('❌ GetContributionSummaries error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get contribution summaries', summaries: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/contribution-summaries
 * Create a new contribution summary (assessment)
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { periodStart, periodEnd, periodType, title, summary, skillTopicIds, companyWorkId } = body

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: 'periodStart and periodEnd are required' },
        { status: 400 },
      )
    }

    const newSummary = await prisma.contributionSummary.create({
      data: {
        workMeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        periodType: periodType || null,
        title: title || null,
        summary: summary || null,
        skillTopicIds: skillTopicIds || [],
        companyWorkId: companyWorkId || null,
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
      summary: newSummary,
    })
  } catch (error: any) {
    console.error('❌ CreateContributionSummary error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create contribution summary' },
      { status: 500 },
    )
  }
}
