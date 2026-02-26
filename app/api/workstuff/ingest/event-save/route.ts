import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { normalizeEventCategory, normalizeAudience } from '@/lib/server/gptJsonMapperService'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface EventSaveRequest {
  eventId: string
  title: string | null
  theme: string | null
  description: string | null
  eventDate: string | null // ISO date string
  startTime: string | null
  endTime: string | null
  location: string | null
  eventCategory: string | null
  registrationRequired: string | null
  registrationLink: string | null
  audience: string | null
  vibe: string | null
  eventItems: string[] | null
  participation: string[] | null
  foodProvided: string | null
  foodTypes: string | null
  speakers: string[] | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * STAGE 2 SAVE: Finalize Event Entry
 * 
 * Updates ALL real event fields
 * Does NOT overwrite ingest fields (ingestRawText)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Event record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const data: EventSaveRequest = await request.json()

    if (!data.eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId is required' },
        { status: 400 }
      )
    }

    // Verify event exists
    const existing = await prisma.companyEvent.findUnique({
      where: {
        id: data.eventId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Update ALL event fields to match the model
    // DO NOT overwrite ingest fields
    const updated = await prisma.companyEvent.update({
      where: { id: data.eventId },
      data: {
        // Core
        title: data.title || 'Untitled Event',
        theme: data.theme,
        description: data.description,
        
        // Date / Time / Location
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        
        // Event-specific (normalize to Prisma enums; invalid values become null)
        eventCategory: normalizeEventCategory(data.eventCategory),
        registrationRequired: data.registrationRequired,
        registrationLink: data.registrationLink,
        audience: normalizeAudience(data.audience),
        vibe: data.vibe,
        eventItems: data.eventItems ?? undefined,
        participation: data.participation ?? undefined,
        foodProvided: data.foodProvided,
        foodTypes: data.foodTypes,
        speakers: data.speakers ?? undefined,

        // POC
        pocEmail: data.pocEmail,
        pocPhone: data.pocPhone,

        // ingestRawText remains unchanged
      },
    })

    return NextResponse.json({
      success: true,
      eventId: updated.id,
      event: updated,
    })
  } catch (error: any) {
    console.error('[Event Save] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save event' },
      { status: 500 }
    )
  }
}
