import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/next-job/resume-blocks
 * Returns building blocks for a resume: contribution summaries, skill topics, work profile.
 * Used by future resume builder / converter.
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const [contributionSummaries, skillTopics, workProfile] = await Promise.all([
      prisma.contributionSummary.findMany({
        where: { workMeId },
        orderBy: { periodEnd: 'desc' },
        select: {
          id: true,
          title: true,
          summary: true,
          periodStart: true,
          periodEnd: true,
          periodType: true,
          skillTopicIds: true,
          createdAt: true,
        },
      }),
      prisma.skillTopic.findMany({
        where: { workMeId },
        orderBy: { lastDemonstratedAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          firstDemonstratedAt: true,
          lastDemonstratedAt: true,
        },
      }),
      prisma.workProfile.findUnique({
        where: { workMeId },
        select: {
          id: true,
          jobRole: true,
          industry: true,
          salaryRange: true,
          responsibilitySummary: true,
          seniority: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      resumeBlocks: {
        contributionSummaries,
        skillTopics,
        workProfile,
      },
    })
  } catch (error: any) {
    console.error('❌ Get resume blocks error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get resume blocks', resumeBlocks: null },
      { status: 500 },
    )
  }
}
