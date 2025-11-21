'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId.server'
import { getTypedContext } from './typed-contexts'

// Helper to get typed context data
async function enrichWorkContext(workContext: any) {
  if (!workContext) return null

  const typedResult = await getTypedContext({
    type: workContext.type,
    typeRefId: workContext.typeRefId,
  })

  return {
    ...workContext,
    typedData: typedResult.success ? typedResult.data : null,
    title: typedResult.success ? typedResult.title : 'Unknown',
  }
}

export async function deleteWorkContext(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.workContext.findFirst({
      where: { id, originatorId: workMeId },
    })

    if (!existing) {
      return { success: false, error: 'Work context not found' }
    }

    // Delete typed context model based on type
    // Note: This should be done via database cascade or manually for each type
    // For now, we'll just delete the WorkContext (outputs cascade)
    
    await prisma.workContext.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete work context' }
  }
}

export async function getWorkContexts() {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated', workContexts: [] }
    }

    const workContexts = await prisma.workContext.findMany({
      where: { originatorId: workMeId },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with typed context data
    const enrichedContexts = await Promise.all(
      workContexts.map((ctx) => enrichWorkContext(ctx))
    )

    return { success: true, workContexts: enrichedContexts.filter(Boolean) }
  } catch (error) {
    return { success: false, error: 'Failed to fetch work contexts', workContexts: [] }
  }
}

export async function getWorkContext(id: string, clientWorkMeId?: string | null) {
  try {
    let workMeId = await getWorkMeId()

    // Fallback to client-provided workMeId if server can't get it
    if (!workMeId && clientWorkMeId) {
      // Verify the workMeId exists in the database for security
      const workMe = await prisma.workMe.findUnique({
        where: { id: clientWorkMeId },
        select: { id: true },
      })
      if (workMe) {
        workMeId = clientWorkMeId
      }
    }

    if (!workMeId) {
      console.error('[getWorkContext] No workMeId found. Client provided:', clientWorkMeId)
      return { success: false, error: 'Not authenticated' }
    }

    // First try to find with workMeId filter
    let workContext = await prisma.workContext.findFirst({
      where: { id, originatorId: workMeId },
      include: {
        outputs: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    // If not found with workMeId, try without (for debugging - remove in production)
    if (!workContext) {
      console.error('[getWorkContext] Not found with workMeId:', workMeId, 'Trying without filter...')
      workContext = await prisma.workContext.findFirst({
        where: { id },
        include: {
          outputs: {
            orderBy: { updatedAt: 'desc' },
          },
        },
      })
      
      if (workContext) {
        console.error('[getWorkContext] Found but wrong workMeId. Context originator:', workContext.originatorId, 'Query workMeId:', workMeId)
        return { success: false, error: 'Work context not found (authentication mismatch)' }
      }
    }

    if (!workContext) {
      console.error('[getWorkContext] Context not found at all. ID:', id)
      return { success: false, error: 'Work context not found' }
    }

    // Enrich with typed context data
    const enriched = await enrichWorkContext(workContext)

    return { success: true, workContext: enriched }
  } catch (error) {
    console.error('[getWorkContext] Error:', error)
    return { success: false, error: 'Failed to fetch work context: ' + (error instanceof Error ? error.message : 'Unknown error') }
  }
}

