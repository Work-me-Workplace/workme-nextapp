"use server"

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
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
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!workMeId || !companyUnit) {
      return {
        success: false as const,
        error: 'Not authenticated or user must set a companyUnit',
      }
    }

    console.log('[createWorkEventFromIngest] Starting', {
      workMeId,
      companyUnit,
      hasEvent: !!ingestionData.event,
      itemsCount: ingestionData.items?.length || 0,
    })

    // Normalize GPT output
    const normalized = normalizeGPTIngestionOutput(
      ingestionData,
      companyUnit,
      workMeId
    )

    console.log('[createWorkEventFromIngest] Normalized data', {
      eventTitle: normalized.eventData.title,
      itemsCount: normalized.eventItemsData.length,
    })

    // Create CompanyEvent and EventItems in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create CompanyEvent (WorkEvent renamed to CompanyEvent)
      const companyEvent = await tx.companyEvent.create({
        data: normalized.eventData,
      })

      console.log('[createWorkEventFromIngest] CompanyEvent created', {
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

      console.log('[createWorkEventFromIngest] EventItems created', {
        eventId: companyEvent.id,
        itemsCount: eventItems.length,
      })

      // NOTE: WorkEventRouter has been removed - CompanyEvent is now the direct model
      return {
        companyEvent,
        eventItems,
      }
    })

    return {
      success: true as const,
      eventId: result.companyEvent.id, // Return CompanyEvent ID for navigation
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

