'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId.server'
import { getTypedContext } from './typed-contexts'

// Helper to get typed context data
async function enrichWorkContext(workEventRouter: any) {
  if (!workEventRouter) return null

  // Get companyId from workEventRouter or fetch it
  let companyId = workEventRouter.companyId
  if (!companyId) {
    // Try to get it from the originator
    const workMe = await prisma.workMe.findUnique({
      where: { id: workEventRouter.originatorId },
      select: { companyId: true },
    })
    companyId = workMe?.companyId || null
  }

  if (!companyId) {
    console.error('[enrichWorkContext] No companyId found')
    return {
      ...workEventRouter,
      typedData: null,
      title: 'Unknown',
    }
  }

  const typedResult = await getTypedContext({
    type: workEventRouter.type,
    typeRefId: workEventRouter.eventRefId, // Updated field name
  })

  return {
    ...workEventRouter,
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

    const existing = await prisma.workEventRouter.findFirst({
      where: { id, originatorId: workMeId },
    })

    if (!existing) {
      return { success: false, error: 'Work context not found' }
    }

    // Delete typed context model based on type
    // Note: This should be done via database cascade or manually for each type
    // For now, we'll just delete the WorkEventRouter (outputs cascade)
    
    await prisma.workEventRouter.delete({
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

    const workEventRouters = await prisma.workEventRouter.findMany({
      where: { originatorId: workMeId },
      orderBy: { createdAt: 'desc' },
    })

    // Enrich with typed context data
    const enrichedContexts = await Promise.all(
      workEventRouters.map((ctx) => enrichWorkContext(ctx))
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
      return { success: false, error: 'Not authenticated', workContext: null }
    }

    // Get companyId from workMe
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: { companyId: true },
    })

    if (!workMe?.companyId) {
      return { success: false, error: 'User must belong to a company', workContext: null }
    }

    // First try to find with workMeId filter
    let workEventRouter = await prisma.workEventRouter.findFirst({
      where: { 
        id, 
        originatorId: workMeId,
        companyId: workMe.companyId, // Multi-tenant security
      },
      include: {
        outputs: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    // If not found with workMeId, try without originatorId (still filter by companyId)
    if (!workEventRouter) {
      console.error('[getWorkContext] Not found with workMeId:', workMeId, 'Trying without originatorId filter...')
      workEventRouter = await prisma.workEventRouter.findFirst({
        where: { 
          id,
          companyId: workMe.companyId, // Still enforce multi-tenant
        },
        include: {
          outputs: {
            orderBy: { updatedAt: 'desc' },
          },
        },
      })
      
      if (workEventRouter) {
        console.error('[getWorkContext] Found but wrong workMeId. Context originator:', workEventRouter.originatorId, 'Query workMeId:', workMeId)
        return { success: false, error: 'Work context not found (authentication mismatch)', workContext: null }
      }
    }

    if (!workEventRouter) {
      console.error('[getWorkContext] Context not found at all. ID:', id)
      return { success: false, error: 'Work context not found', workContext: null }
    }

    // Enrich with typed context data
    const enriched = await enrichWorkContext(workEventRouter)

    return { success: true, workContext: enriched }
  } catch (error) {
    console.error('[getWorkContext] Error:', error)
    return { success: false, error: 'Failed to fetch work context: ' + (error instanceof Error ? error.message : 'Unknown error') }
  }
}

