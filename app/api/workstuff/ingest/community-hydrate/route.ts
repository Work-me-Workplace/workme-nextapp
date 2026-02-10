import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseCommunity } from '@/lib/services/community-mapper-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 2: Community Hydration
 * 
 * Pure function - reads ingestRawText, parses it, returns structured model.
 * No DB writes. Hydration is read-only.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Community record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { communityId } = await request.json()

    if (!communityId) {
      return NextResponse.json(
        { success: false, error: 'communityId is required' },
        { status: 400 }
      )
    }

    // Load CompanyCommunity
    const community = await prisma.companyCommunity.findUnique({
      where: {
        id: communityId,
      },
    })

    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    if (!community.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // Parse community data (pure function, no DB writes)
    const model = await parseCommunity(community.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[Community Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate community' },
      { status: 500 }
    )
  }
}
