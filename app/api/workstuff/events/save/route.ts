/**
 * WorkStuff Events Save
 * 
 * POST /api/workstuff/events/save
 * Save parsed event data to database
 * 
 * Body: EventIngestionResponse (from AI parsing)
 * Returns: { success: true, eventId, itemCount } or { success: false, error }
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { normalizeGPTIngestionOutput } from '@/lib/server/gptJsonMapperService'
import { prisma } from '@/lib/prisma'
import type { EventIngestionResponse } from '@/lib/types/event-ingestion'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return NextResponse.json(
        { success: false, error: 'User must set a companyUnit' },
        { status: 400 }
      )
    }

    const body: EventIngestionResponse = await request.json()

    console.log('[API POST /api/workstuff/events/save]', {
      workMeId,
      companyUnit,
      hasEvent: !!body.event,
      itemsCount: body.items?.length || 0,
    })

    const normalized = normalizeGPTIngestionOutput(
      body,
      companyUnit,
      workMeId
    )

    console.log('[API POST /api/workstuff/events/save] Normalized data', {
      eventTitle: normalized.eventData.title,
      itemsCount: normalized.eventItemsData.length,
    })

    const result = await prisma.$transaction(async (tx) => {
      const { createdAt, updatedAt, ...eventCreateData } = normalized.eventData as any
      const companyEvent = await tx.companyEvent.create({
        data: {
          ...eventCreateData,
          workMeId: workMeId,
        },
      })

      console.log('[API POST /api/workstuff/events/save] CompanyEvent created', {
        eventId: companyEvent.id,
        title: companyEvent.title,
      })

      // Note: EventItem table has been deprecated. Products should link directly via CompanyWork.
      // eventItemsData is kept for backwards compatibility but items are no longer created.

      return {
        companyEvent,
        eventItems: [], // EventItem table deprecated
      }
    })

    return NextResponse.json({
      success: true,
      eventId: result.companyEvent.id,
      itemCount: normalized.eventItemsData.length, // Return count for backwards compatibility
    })
  } catch (error: any) {
    console.error('[API POST /api/workstuff/events/save] Error:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save event from ingestion',
      },
      { status: 500 }
    )
  }
}
