"use server"

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
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
 * Create a PromotionalWorkItem
 */
export async function createPromotionalWorkItem(
  data: z.infer<typeof promotionalWorkItemSchema>
) {
  try {
    const validated = promotionalWorkItemSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return {
        success: false as const,
        error: 'Not authenticated or user must belong to a company',
      }
    }

    // Verify event exists and belongs to user's company
    const event = await prisma.workEvent.findFirst({
      where: {
        id: validated.eventId,
        companyId,
      },
    })

    if (!event) {
      return {
        success: false as const,
        error: 'Event not found or unauthorized',
      }
    }

    // Create PromotionalWorkItem
    const promotionalWorkItem = await prisma.promotionalWorkItem.create({
      data: {
        eventId: validated.eventId,
        name: validated.name,
        type: validated.type,
        title: validated.title ?? undefined,
        headline: validated.headline ?? undefined,
        subheadline: validated.subheadline ?? undefined,
        details: validated.details ?? undefined,
        perks: validated.perks ?? undefined,
        participation: validated.participation ?? undefined,
        foodProvided: validated.foodProvided ?? undefined,
        foodTypes: validated.foodTypes ?? undefined,
        theme: validated.theme ?? undefined,
        eventDateBlock: validated.eventDateBlock ?? undefined,
        eventTimeBlock: validated.eventTimeBlock ?? undefined,
        rsvpLink: validated.rsvpLink ?? undefined,
        metadata: validated.metadata ?? undefined,
      },
    })

    return {
      success: true as const,
      promotionalWorkItem,
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
 * Get a single PromotionalWorkItem by ID
 */
export async function getPromotionalWorkItem(id: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return {
        success: false as const,
        error: 'Not authenticated or user must belong to a company',
        item: null,
      }
    }

    // Get the promotional work item
    const item = await prisma.promotionalWorkItem.findFirst({
      where: {
        id,
      },
      include: {
        event: {
          select: {
            companyId: true,
          },
        },
      },
    })

    if (!item) {
      return {
        success: false as const,
        error: 'Promotional work item not found',
        item: null,
      }
    }

    // Verify it belongs to user's company
    if (item.event.companyId !== companyId) {
      return {
        success: false as const,
        error: 'Unauthorized',
        item: null,
      }
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
 * Get all PromotionalWorkItems for an event
 */
export async function getPromotionalWorkItemsByEvent(eventId: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return {
        success: false as const,
        error: 'Not authenticated or user must belong to a company',
        items: [],
      }
    }

    // Verify event exists and belongs to user's company
    const event = await prisma.workEvent.findFirst({
      where: {
        id: eventId,
        companyId,
      },
    })

    if (!event) {
      return {
        success: false as const,
        error: 'Event not found or unauthorized',
        items: [],
      }
    }

    // Get all promotional work items for this event
    const items = await prisma.promotionalWorkItem.findMany({
      where: {
        eventId,
      },
      orderBy: {
        createdAt: 'desc',
      },
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

