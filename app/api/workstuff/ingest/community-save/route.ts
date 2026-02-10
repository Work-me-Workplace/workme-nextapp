import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface CommunitySaveRequest {
  communityId: string
  title: string | null
  description: string | null
  partnerOrg: string | null
  date: string | null // ISO date string
  startTime: string | null
  endTime: string | null
  location: string | null
  signUpLink: string | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * STAGE 2 SAVE: Finalize Community Entry
 * 
 * Updates ALL real community fields
 * Does NOT overwrite ingest fields (ingestRawText)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Community record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: CommunitySaveRequest = await request.json()

    if (!data.communityId) {
      return NextResponse.json(
        { success: false, error: 'communityId is required' },
        { status: 400 }
      )
    }

    // Verify community exists
    const existing = await prisma.companyCommunity.findUnique({
      where: {
        id: data.communityId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    // Update ALL community fields to match the model
    // DO NOT overwrite ingest fields
    const updated = await prisma.companyCommunity.update({
      where: { id: data.communityId },
      data: {
        // Core
        title: data.title || 'Untitled Community Opportunity',
        description: data.description,
        partnerOrg: data.partnerOrg,
        
        // Date / Time / Location
        date: data.date ? new Date(data.date) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        
        // Links
        signUpLink: data.signUpLink,
        
        // POC
        pocFirstName: data.pocFirstName,
        pocLastName: data.pocLastName,
        pocEmail: data.pocEmail,
        pocPhone: data.pocPhone,

        // ingestRawText remains unchanged
      },
    })

    return NextResponse.json({
      success: true,
      communityId: updated.id,
      community: updated,
    })
  } catch (error: any) {
    console.error('[Community Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save community' },
      { status: 500 }
    )
  }
}
