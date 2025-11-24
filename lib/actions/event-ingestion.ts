"use server"

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { normalizeGPTIngestionOutput } from '@/lib/server/gptJsonMapperService'
import type { EventIngestionResponse } from '@/lib/types/event-ingestion'

/**
 * Create WorkEvent and EventItems from AI ingestion output
 * 
 * @param ingestionData - Parsed GPT output from /api/ingest/event/ai
 * @returns { success: true, eventId, itemCount } or { success: false, error }
 */
export async function createWorkEventFromIngest(
  ingestionData: EventIngestionResponse
) {
  try {
    // Verify authentication
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return {
        success: false as const,
        error: 'Not authenticated or user must belong to a company',
      }
    }

    console.log('[createWorkEventFromIngest] Starting', {
      workMeId,
      companyId,
      hasEvent: !!ingestionData.event,
      itemsCount: ingestionData.items?.length || 0,
    })

    // Normalize GPT output
    const normalized = normalizeGPTIngestionOutput(
      ingestionData,
      companyId,
      workMeId
    )

    console.log('[createWorkEventFromIngest] Normalized data', {
      eventTitle: normalized.eventData.title,
      itemsCount: normalized.eventItemsData.length,
    })

    // Create WorkEvent and EventItems in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create WorkEvent
      const workEvent = await tx.workEvent.create({
        data: normalized.eventData,
      })

      console.log('[createWorkEventFromIngest] WorkEvent created', {
        eventId: workEvent.id,
        title: workEvent.title,
      })

      // 2. Create EventItems
      const eventItems = await Promise.all(
        normalized.eventItemsData.map((itemData) =>
          tx.eventItem.create({
            data: {
              title: itemData.title,
              description: itemData.description,
              metadata: itemData.metadata ?? undefined,
              eventId: workEvent.id,
            },
          })
        )
      )

      console.log('[createWorkEventFromIngest] EventItems created', {
        eventId: workEvent.id,
        itemsCount: eventItems.length,
      })

      // 3. Create WorkEventRouter entry
      const workEventRouter = await tx.workEventRouter.create({
        data: {
          type: 'event',
          eventRefId: workEvent.id,
          companyId,
          originatorId: workMeId,
        },
      })

      console.log('[createWorkEventFromIngest] WorkEventRouter created', {
        routerId: workEventRouter.id,
        eventId: workEvent.id,
      })

      return {
        workEvent,
        eventItems,
        workEventRouter,
      }
    })

    return {
      success: true as const,
      eventId: result.workEventRouter.id, // Return router ID for navigation
      itemCount: result.eventItems.length,
    }
  } catch (error: any) {
    console.error('[createWorkEventFromIngest] Error:', error)
    return {
      success: false as const,
      error: error.message || 'Failed to create event from ingestion',
    }
  }
}

