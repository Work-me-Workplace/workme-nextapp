"use server"

import { getWorkMeId } from '../getWorkMeId.server'
import { getWorkEventRouter } from '../server/get-work-context'
import { prisma } from '../prisma'

/**
 * Get WorkEventRouter by ID (server action for client components)
 * Uses getWorkMeId to get companyId for multi-tenant security
 */
export async function getWorkEventRouterAction(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get companyId from WorkMe
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: { companyId: true },
    })

    if (!workMe || !workMe.companyId) {
      return { success: false, error: 'User must belong to a company' }
    }

    // Get enriched WorkEventRouter
    const workEventRouter = await getWorkEventRouter(id, workMe.companyId)

    if (!workEventRouter) {
      return { success: false, error: 'WorkEventRouter not found or unauthorized' }
    }

    return {
      success: true,
      workContext: workEventRouter, // Using workContext name for compatibility
    }
  } catch (error) {
    console.error('[getWorkEventRouterAction] Error:', error)
    return {
      success: false,
      error: 'Failed to fetch WorkEventRouter: ' + (error instanceof Error ? error.message : 'Unknown error'),
    }
  }
}

