import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseLeaderEngagement } from '@/lib/services/leader-engagement-mapper-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 2: Leader Engagement Hydration
 * 
 * Pure function - reads ingestRawText, parses it, returns structured model.
 * No DB writes. Hydration is read-only.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Leader Engagement record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { leaderEngagementId } = await request.json()

    if (!leaderEngagementId) {
      return NextResponse.json(
        { success: false, error: 'leaderEngagementId is required' },
        { status: 400 }
      )
    }

    // Load CompanyLeaderEngagement
    const leaderEngagement = await prisma.companyLeaderEngagement.findUnique({
      where: {
        id: leaderEngagementId,
      },
    })

    if (!leaderEngagement) {
      return NextResponse.json(
        { success: false, error: 'Leader Engagement not found' },
        { status: 404 }
      )
    }

    if (!leaderEngagement.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // Parse leader engagement data (pure function, no DB writes)
    const model = await parseLeaderEngagement(leaderEngagement.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[Leader Engagement Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate leader engagement' },
      { status: 500 }
    )
  }
}
