import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface CampaignSaveRequest {
  campaignId: string
  title: string | null
  description: string | null
  windowStart: string | null // ISO date string
  windowEnd: string | null // ISO date string
  ctaLink: string | null
  sponsor: string | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * STAGE 2 SAVE: Finalize Campaign Entry
 * 
 * Updates ALL real campaign fields
 * Does NOT overwrite ingest fields (ingestRawText)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Campaign record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: CampaignSaveRequest = await request.json()

    if (!data.campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const existing = await prisma.companyCampaign.findUnique({
      where: {
        id: data.campaignId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Update ALL campaign fields to match the model
    // DO NOT overwrite ingest fields
    const updated = await prisma.companyCampaign.update({
      where: { id: data.campaignId },
      data: {
        // Core
        title: data.title || 'Untitled Campaign',
        description: data.description,
        
        // Dates
        windowStart: data.windowStart ? new Date(data.windowStart) : null,
        windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
        
        // Links / Sponsor
        ctaLink: data.ctaLink,
        sponsor: data.sponsor,
        
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
      campaignId: updated.id,
      campaign: updated,
    })
  } catch (error: any) {
    console.error('[Campaign Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save campaign' },
      { status: 500 }
    )
  }
}
