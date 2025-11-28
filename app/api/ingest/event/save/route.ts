import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { normalizeGPTIngestionOutput } from '@/lib/server/gptJsonMapperService'
import { prisma } from '@/lib/prisma'
import type { EventIngestionResponse } from '@/lib/types/event-ingestion'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/ingest/event/save
 * Save parsed event data to database
 * 
 * Body: EventIngestionResponse (from AI parsing)
 * Returns: { success: true, eventId, itemCount } or { success: false, error }
 */
export async function POST(request: Request) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    const body: EventIngestionResponse = await request.json()

    console.log('[API POST /api/ingest/event/save]', {
      workMeId,
      companyId,
      hasEvent: !!body.event,
      itemsCount: body.items?.length || 0,
    })

    // Normalize GPT output
    const normalized = normalizeGPTIngestionOutput(
      body,
      companyId,
      workMeId
    )

    console.log('[API POST /api/ingest/event/save] Normalized data', {
      eventTitle: normalized.eventData.title,
      itemsCount: normalized.eventItemsData.length,
    })

    // Create CompanyEvent and EventItems in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create CompanyEvent directly (no router needed)
      // Exclude createdAt/updatedAt - Prisma handles these automatically
      const { createdAt, updatedAt, ...eventCreateData } = normalized.eventData as any
      const companyEvent = await tx.companyEvent.create({
        data: eventCreateData,
      })

      console.log('[API POST /api/ingest/event/save] CompanyEvent created', {
        eventId: companyEvent.id,
        title: companyEvent.title,
      })

      // 2. Create EventItems
      const eventItems = await Promise.all(
        normalized.eventItemsData.map((itemData) =>
          tx.eventItem.create({
            data: {
              title: itemData.title,
              description: itemData.description,
              metadata: itemData.metadata ?? undefined,
              eventId: companyEvent.id,
            },
          })
        )
      )

      console.log('[API POST /api/ingest/event/save] EventItems created', {
        eventId: companyEvent.id,
        itemsCount: eventItems.length,
      })

      return {
        companyEvent,
        eventItems,
      }
    })

    return NextResponse.json({
      success: true,
      eventId: result.companyEvent.id, // Return CompanyEvent ID for navigation
      itemCount: result.eventItems.length,
    })
  } catch (error: any) {
    console.error('[API POST /api/ingest/event/save] Error:', error)
    
    // Handle auth errors
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

