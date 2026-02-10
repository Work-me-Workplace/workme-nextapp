import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseEvent } from '@/lib/services/event-mapper-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 2: Event Hydration
 * 
 * Pure function - reads ingestRawText, parses it, returns structured model.
 * No DB writes. Hydration is read-only.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: Event record already has companyId from creation
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'eventId is required' },
        { status: 400 }
      )
    }

    // Load CompanyEvent
    const event = await prisma.companyEvent.findUnique({
      where: {
        id: eventId,
      },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!event.ingestRawText) {
      return NextResponse.json(
        { success: false, error: 'No raw text found for hydration' },
        { status: 400 }
      )
    }

    // Parse event data (pure function, no DB writes)
    const model = await parseEvent(event.ingestRawText)

    return NextResponse.json({
      success: true,
      model,
    })
  } catch (error: any) {
    console.error('[Event Hydrate] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate event' },
      { status: 500 }
    )
  }
}
