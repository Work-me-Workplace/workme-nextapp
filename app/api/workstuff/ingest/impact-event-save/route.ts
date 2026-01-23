import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface ImpactEventSaveRequest {
  impactEventId: string
  title: string | null
  description: string | null
  summary: string | null
  effectiveDate: string | null // ISO date string
  location: string | null
  impactedPopulation: string | null
  urgency: string | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * STAGE 2 SAVE: Finalize Impact Event Entry
 * 
 * Updates ALL real impact event fields
 * Does NOT overwrite ingest fields (ingestRawText)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Impact Event record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: ImpactEventSaveRequest = await request.json()

    if (!data.impactEventId) {
      return NextResponse.json(
        { success: false, error: 'impactEventId is required' },
        { status: 400 }
      )
    }

    // Verify impact event exists
    const existing = await prisma.companyImpactEvent.findUnique({
      where: {
        id: data.impactEventId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Impact Event not found' },
        { status: 404 }
      )
    }

    // Update ALL real impact event fields
    // DO NOT overwrite ingest fields
    const updated = await prisma.companyImpactEvent.update({
      where: { id: data.impactEventId },
      data: {
        // Core
        title: data.title || 'Untitled Impact Event',
        description: data.description,
        summary: data.summary,

        // Date / Location
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
        location: data.location,

        // Impact Details
        impactedPopulation: data.impactedPopulation,
        urgency: data.urgency,

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
      impactEventId: updated.id,
      impactEvent: updated,
    })
  } catch (error: any) {
    console.error('[Impact Event Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save impact event' },
      { status: 500 }
    )
  }
}

