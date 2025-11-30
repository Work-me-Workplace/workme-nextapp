"use server"

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { z } from 'zod'

const promotionalWorkItemSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  title: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  subheadline: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  perks: z.string().optional().nullable(),
  participation: z.string().optional().nullable(),
  foodProvided: z.string().optional().nullable(),
  foodTypes: z.string().optional().nullable(),
  theme: z.string().optional().nullable(),
  eventDateBlock: z.string().optional().nullable(),
  eventTimeBlock: z.string().optional().nullable(),
  rsvpLink: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
})

/**
 * Create an EventItem (replaces PromotionalWorkItem)
 * Stores promotional content as an EventItem with metadata
 */
export async function createPromotionalWorkItem(
  data: z.infer<typeof promotionalWorkItemSchema>
) {
  try {
    const validated = promotionalWorkItemSchema.parse(data)
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return {
        success: false as const,
        error: 'Not authenticated or user must set a companyUnit',
      }
    }

    // Verify event exists and belongs to user's company unit
    const event = await prisma.companyEvent.findFirst({
      where: {
        id: validated.eventId,
        companyUnit,
      },
    })

    if (!event) {
      return {
        success: false as const,
        error: 'Event not found or unauthorized',
      }
    }

    // Create EventItem with promotional data stored in metadata
    const eventItem = await prisma.eventItem.create({
      data: {
        eventId: validated.eventId,
        title: validated.title || validated.name || 'Promotional Item',
        description: validated.details || validated.headline || null,
        metadata: {
          // Store all promotional fields in metadata
          name: validated.name,
          type: validated.type,
          headline: validated.headline,
          subheadline: validated.subheadline,
          details: validated.details,
          perks: validated.perks,
          participation: validated.participation,
          foodProvided: validated.foodProvided,
          foodTypes: validated.foodTypes,
          theme: validated.theme,
          eventDateBlock: validated.eventDateBlock,
          eventTimeBlock: validated.eventTimeBlock,
          rsvpLink: validated.rsvpLink,
          // Merge with any existing metadata
          ...(validated.metadata || {}),
        },
      },
    })

    return {
      success: true as const,
      promotionalWorkItem: {
        id: eventItem.id,
        eventId: eventItem.eventId,
        title: eventItem.title,
        description: eventItem.description,
        ...(eventItem.metadata as any), // Spread metadata fields for backward compatibility
        createdAt: eventItem.createdAt,
        updatedAt: eventItem.updatedAt,
      },
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        error: error.errors,
      }
    }
    console.error('[createPromotionalWorkItem] Error:', error)
    return {
      success: false as const,
      error: error.message || 'Failed to create promotional work item',
    }
  }
}

/**
 * Get a single EventItem by ID (replaces PromotionalWorkItem)
 */
export async function getPromotionalWorkItem(id: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return {
        success: false as const,
        error: 'Not authenticated or user must set a companyUnit',
        item: null,
      }
    }

    // Get the event item
    const eventItem = await prisma.eventItem.findFirst({
      where: {
        id,
      },
      include: {
        event: {
          select: {
            companyUnit: true,
          },
        },
      },
    })

    if (!eventItem) {
      return {
        success: false as const,
        error: 'Promotional work item not found',
        item: null,
      }
    }

    // Verify it belongs to user's company unit
    if (eventItem.event.companyUnit !== companyUnit) {
      return {
        success: false as const,
        error: 'Unauthorized',
        item: null,
      }
    }

    // Transform EventItem to match PromotionalWorkItem shape for backward compatibility
    const metadata = (eventItem.metadata as any) || {}
    const item = {
      id: eventItem.id,
      eventId: eventItem.eventId,
      name: metadata.name || '',
      type: metadata.type || '',
      title: eventItem.title || metadata.title || '',
      headline: metadata.headline || '',
      subheadline: metadata.subheadline || '',
      details: eventItem.description || metadata.details || '',
      perks: metadata.perks || '',
      participation: metadata.participation || '',
      foodProvided: metadata.foodProvided || '',
      foodTypes: metadata.foodTypes || '',
      theme: metadata.theme || '',
      eventDateBlock: metadata.eventDateBlock || '',
      eventTimeBlock: metadata.eventTimeBlock || '',
      rsvpLink: metadata.rsvpLink || '',
      metadata: eventItem.metadata,
      createdAt: eventItem.createdAt,
      updatedAt: eventItem.updatedAt,
    }

    return {
      success: true as const,
      item,
    }
  } catch (error: any) {
    console.error('[getPromotionalWorkItem] Error:', error)
    return {
      success: false as const,
      error: error.message || 'Failed to fetch promotional work item',
      item: null,
    }
  }
}

/**
 * Get all EventItems for an event (replaces PromotionalWorkItems)
 */
export async function getPromotionalWorkItemsByEvent(eventId: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return {
        success: false as const,
        error: 'Not authenticated or user must set a companyUnit',
        items: [],
      }
    }

    // Verify event exists and belongs to user's company unit
    const event = await prisma.companyEvent.findFirst({
      where: {
        id: eventId,
        companyUnit,
      },
    })

    if (!event) {
      return {
        success: false as const,
        error: 'Event not found or unauthorized',
        items: [],
      }
    }

    // Get all event items for this event
    const eventItems = await prisma.eventItem.findMany({
      where: {
        eventId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform EventItems to match PromotionalWorkItem shape for backward compatibility
    const items = eventItems.map((eventItem) => {
      const metadata = (eventItem.metadata as any) || {}
      return {
        id: eventItem.id,
        eventId: eventItem.eventId,
        name: metadata.name || '',
        type: metadata.type || '',
        title: eventItem.title || metadata.title || '',
        headline: metadata.headline || '',
        subheadline: metadata.subheadline || '',
        details: eventItem.description || metadata.details || '',
        perks: metadata.perks || '',
        participation: metadata.participation || '',
        foodProvided: metadata.foodProvided || '',
        foodTypes: metadata.foodTypes || '',
        theme: metadata.theme || '',
        eventDateBlock: metadata.eventDateBlock || '',
        eventTimeBlock: metadata.eventTimeBlock || '',
        rsvpLink: metadata.rsvpLink || '',
        metadata: eventItem.metadata,
        createdAt: eventItem.createdAt,
        updatedAt: eventItem.updatedAt,
      }
    })

    return {
      success: true as const,
      items,
    }
  } catch (error: any) {
    console.error('[getPromotionalWorkItemsByEvent] Error:', error)
    return {
      success: false as const,
      error: error.message || 'Failed to fetch promotional work items',
      items: [],
    }
  }
}
