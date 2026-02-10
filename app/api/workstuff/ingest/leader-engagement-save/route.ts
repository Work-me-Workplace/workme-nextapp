import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface LeaderEngagementSaveRequest {
  leaderEngagementId: string
  title: string | null
  description: string | null
  engagementDate: string | null // ISO date string
  startTime: string | null
  endTime: string | null
  location: string | null
  topicAreas: string[] | null
  potentialQuestions: string[] | null
  keyMessages: string[] | null
  talkingPoints: string | null
  leaderName: string | null
  leaderTitle: string | null
  leaderId: string | null
  audience: string | null
  registrationRequired: string | null
  registrationLink: string | null
  format: string | null
  qAndAEnabled: boolean | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * STAGE 2 SAVE: Finalize Leader Engagement Entry
 * 
 * Updates ALL real leader engagement fields
 * Does NOT overwrite ingest fields (ingestRawText)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Leader Engagement record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: LeaderEngagementSaveRequest = await request.json()

    if (!data.leaderEngagementId) {
      return NextResponse.json(
        { success: false, error: 'leaderEngagementId is required' },
        { status: 400 }
      )
    }

    // Verify leader engagement exists
    const existing = await prisma.companyLeaderEngagement.findUnique({
      where: {
        id: data.leaderEngagementId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Leader Engagement not found' },
        { status: 404 }
      )
    }

    // Update ALL leader engagement fields to match the model
    // DO NOT overwrite ingest fields
    const updated = await prisma.companyLeaderEngagement.update({
      where: { id: data.leaderEngagementId },
      data: {
        // Core
        title: data.title || 'Untitled Leader Engagement',
        description: data.description,
        
        // Date / Time / Location
        engagementDate: data.engagementDate ? new Date(data.engagementDate) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        
        // Engagement-specific
        topicAreas: data.topicAreas ?? undefined,
        potentialQuestions: data.potentialQuestions ?? undefined,
        keyMessages: data.keyMessages ?? undefined,
        talkingPoints: data.talkingPoints,
        
        // Leader info
        leaderName: data.leaderName,
        leaderTitle: data.leaderTitle,
        leaderId: data.leaderId,
        
        // Audience / Registration
        audience: data.audience as any,
        registrationRequired: data.registrationRequired,
        registrationLink: data.registrationLink,
        
        // Format
        format: data.format,
        qAndAEnabled: data.qAndAEnabled ?? false,
        
        // POC
        pocEmail: data.pocEmail,
        pocPhone: data.pocPhone,

        // ingestRawText remains unchanged
      },
    })

    return NextResponse.json({
      success: true,
      leaderEngagementId: updated.id,
      leaderEngagement: updated,
    })
  } catch (error: any) {
    console.error('[Leader Engagement Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save leader engagement' },
      { status: 500 }
    )
  }
}
