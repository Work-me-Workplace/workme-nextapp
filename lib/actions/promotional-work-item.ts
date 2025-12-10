/**
 * Promotional Work Item Actions
 * 
 * NOTE: PromotionalWorkItem has been migrated to EventItem with metadata.
 * This module provides compatibility functions that use EventItem.
 */

import { prisma } from '@/lib/prisma'

export interface PromotionalWorkItemData {
  eventId: string
  name: string
  type: string
  title?: string | null
  headline?: string | null
  subheadline?: string | null
  details?: string | null
  perks?: string | null
  participation?: string | null
  foodProvided?: string | null
  foodTypes?: string | null
  theme?: string | null
  eventDateBlock?: string | null
  eventTimeBlock?: string | null
  rsvpLink?: string | null
  metadata?: any
}

export interface PromotionalWorkItem {
  id: string
  eventId: string
  name: string
  type: string
  title?: string | null
  headline?: string | null
  subheadline?: string | null
  details?: string | null
  perks?: string | null
  participation?: string | null
  foodProvided?: string | null
  foodTypes?: string | null
  theme?: string | null
  eventDateBlock?: string | null
  eventTimeBlock?: string | null
  rsvpLink?: string | null
  createdAt: string
}

/**
 * Create a promotional work item (stored as EventItem with metadata)
 */
export async function createPromotionalWorkItem(
  data: PromotionalWorkItemData
): Promise<{ success: boolean; promotionalWorkItem?: PromotionalWorkItem; error?: string }> {
  try {
    // Store promotional item data in EventItem with metadata
    const eventItem = await prisma.eventItem.create({
      data: {
        eventId: data.eventId,
        title: data.name, // Use name as the EventItem title
        description: data.details || null,
        metadata: {
          type: 'promotional',
          productType: data.type,
          title: data.title,
          headline: data.headline,
          subheadline: data.subheadline,
          perks: data.perks,
          participation: data.participation,
          foodProvided: data.foodProvided,
          foodTypes: data.foodTypes,
          theme: data.theme,
          eventDateBlock: data.eventDateBlock,
          eventTimeBlock: data.eventTimeBlock,
          rsvpLink: data.rsvpLink,
          ...(data.metadata || {}),
        },
      },
    })

    // Transform EventItem back to PromotionalWorkItem format for compatibility
    const promotionalWorkItem: PromotionalWorkItem = {
      id: eventItem.id,
      eventId: eventItem.eventId,
      name: eventItem.title,
      type: (eventItem.metadata as any)?.productType || 'poster_22x26',
      title: (eventItem.metadata as any)?.title || null,
      headline: (eventItem.metadata as any)?.headline || null,
      subheadline: (eventItem.metadata as any)?.subheadline || null,
      details: eventItem.description,
      perks: (eventItem.metadata as any)?.perks || null,
      participation: (eventItem.metadata as any)?.participation || null,
      foodProvided: (eventItem.metadata as any)?.foodProvided || null,
      foodTypes: (eventItem.metadata as any)?.foodTypes || null,
      theme: (eventItem.metadata as any)?.theme || null,
      eventDateBlock: (eventItem.metadata as any)?.eventDateBlock || null,
      eventTimeBlock: (eventItem.metadata as any)?.eventTimeBlock || null,
      rsvpLink: (eventItem.metadata as any)?.rsvpLink || null,
      createdAt: eventItem.createdAt.toISOString(),
    }

    return {
      success: true,
      promotionalWorkItem,
    }
  } catch (error: any) {
    console.error('[createPromotionalWorkItem] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create promotional work item',
    }
  }
}

/**
 * Get a promotional work item by ID (from EventItem)
 */
export async function getPromotionalWorkItem(
  id: string
): Promise<{ success: boolean; item?: PromotionalWorkItem; error?: string }> {
  try {
    const eventItem = await prisma.eventItem.findUnique({
      where: { id },
    })

    if (!eventItem) {
      return {
        success: false,
        error: 'Promotional work item not found',
      }
    }

    // Check if it's a promotional item
    const metadata = eventItem.metadata as any
    if (metadata?.type !== 'promotional') {
      return {
        success: false,
        error: 'Item is not a promotional work item',
      }
    }

    // Transform EventItem to PromotionalWorkItem format
    const item: PromotionalWorkItem = {
      id: eventItem.id,
      eventId: eventItem.eventId,
      name: eventItem.title,
      type: metadata?.productType || 'poster_22x26',
      title: metadata?.title || null,
      headline: metadata?.headline || null,
      subheadline: metadata?.subheadline || null,
      details: eventItem.description,
      perks: metadata?.perks || null,
      participation: metadata?.participation || null,
      foodProvided: metadata?.foodProvided || null,
      foodTypes: metadata?.foodTypes || null,
      theme: metadata?.theme || null,
      eventDateBlock: metadata?.eventDateBlock || null,
      eventTimeBlock: metadata?.eventTimeBlock || null,
      rsvpLink: metadata?.rsvpLink || null,
      createdAt: eventItem.createdAt.toISOString(),
    }

    return {
      success: true,
      item,
    }
  } catch (error: any) {
    console.error('[getPromotionalWorkItem] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get promotional work item',
    }
  }
}

/**
 * Get all promotional work items for an event (from EventItems)
 */
export async function getPromotionalWorkItemsByEvent(
  eventId: string
): Promise<{ success: boolean; items?: PromotionalWorkItem[]; error?: string }> {
  try {
    // Get all event items and filter for promotional ones
    const allEventItems = await prisma.eventItem.findMany({
      where: {
        eventId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter for promotional items
    const eventItems = allEventItems.filter((item) => {
      const metadata = item.metadata as any
      return metadata?.type === 'promotional'
    })

    // Transform EventItems to PromotionalWorkItem format
    const items: PromotionalWorkItem[] = eventItems.map((eventItem) => {
      const metadata = eventItem.metadata as any
      return {
        id: eventItem.id,
        eventId: eventItem.eventId,
        name: eventItem.title,
        type: metadata?.productType || 'poster_22x26',
        title: metadata?.title || null,
        headline: metadata?.headline || null,
        subheadline: metadata?.subheadline || null,
        details: eventItem.description,
        perks: metadata?.perks || null,
        participation: metadata?.participation || null,
        foodProvided: metadata?.foodProvided || null,
        foodTypes: metadata?.foodTypes || null,
        theme: metadata?.theme || null,
        eventDateBlock: metadata?.eventDateBlock || null,
        eventTimeBlock: metadata?.eventTimeBlock || null,
        rsvpLink: metadata?.rsvpLink || null,
        createdAt: eventItem.createdAt.toISOString(),
      }
    })

    return {
      success: true,
      items,
    }
  } catch (error: any) {
    console.error('[getPromotionalWorkItemsByEvent] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to get promotional work items',
    }
  }
}
