'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId'
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
      where: { id, createdByWorkMeId: workMeId },
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
      where: { createdByWorkMeId: workMeId },
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

export async function getWorkContext(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const workContext = await prisma.workContext.findFirst({
      where: { id, createdByWorkMeId: workMeId },
      include: {
        outputs: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    if (!workContext) {
      return { success: false, error: 'Work context not found' }
    }

    // Enrich with typed context data
    const enriched = await enrichWorkContext(workContext)

    return { success: true, workContext: enriched }
  } catch (error) {
    return { success: false, error: 'Failed to fetch work context' }
  }
}

