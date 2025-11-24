'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getWorkMeId } from '@/lib/getWorkMeId.server'
import { WORK_OUTPUT_TYPE_VALUES } from './work-support'

const workOutputSchema = z.object({
  eventRouterId: z.string().optional().nullable(), // Renamed from contextId
  supportId: z.string().optional().nullable(),
  workforceCommsId: z.string().uuid().optional().nullable(), // FK to WorkforceComms
  outputType: z.enum(WORK_OUTPUT_TYPE_VALUES as [string, ...string[]]),
  dataJson: z.any().optional().nullable(),
  status: z.enum(['draft', 'final']).optional().default('draft'),
})

export async function createWorkOutput(data: z.infer<typeof workOutputSchema>) {
  try {
    const validated = workOutputSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    // Verify at least one of eventRouterId or supportId is provided
    if (!validated.eventRouterId && !validated.supportId) {
      return { success: false, error: 'Either eventRouterId or supportId is required' }
    }

    // If supportId provided, verify it exists and belongs to user's company
    if (validated.supportId) {
      const support = await prisma.workSupport.findFirst({
        where: { 
          id: validated.supportId,
          companyId, // Multi-tenant: ensure same company
        },
      })

      if (!support) {
        return { success: false, error: 'WorkSupport not found or unauthorized' }
      }

      // Use support's eventRouterId if eventRouterId not provided
      const eventRouterIdToUse = validated.eventRouterId || support.eventRouterId

      const workOutput = await prisma.workOutput.create({
        data: {
          eventRouterId: eventRouterIdToUse,
          supportId: validated.supportId,
          workforceCommsId: validated.workforceCommsId ?? undefined,
          outputType: validated.outputType,
          dataJson: validated.dataJson ?? undefined,
          status: (validated.status || 'draft') as 'draft' | 'final',
          companyId,
          originatorId: workMeId,
        },
        include: {
          eventRouter: true,
          support: true,
          workforceComms: true,
        },
      })

      // Update support assets with new output ID
      const currentAssets = (support.assets as string[]) || []
      await prisma.workSupport.update({
        where: { id: validated.supportId },
        data: {
          assets: [...currentAssets, workOutput.id],
        },
      })

      return { success: true, workOutput }
    }

    // If only eventRouterId provided, verify it exists and belongs to user's company
    if (validated.eventRouterId) {
      const eventRouter = await prisma.workEventRouter.findFirst({
        where: { 
          id: validated.eventRouterId,
          companyId, // Multi-tenant: ensure same company
        },
      })

      if (!eventRouter) {
        return { success: false, error: 'Work event router not found or unauthorized' }
      }

      const workOutput = await prisma.workOutput.create({
        data: {
          eventRouterId: validated.eventRouterId,
          workforceCommsId: validated.workforceCommsId ?? undefined,
          outputType: validated.outputType,
          dataJson: validated.dataJson ?? undefined,
          status: (validated.status || 'draft') as 'draft' | 'final',
          companyId,
          originatorId: workMeId,
        },
        include: {
          eventRouter: true,
          support: true,
          workforceComms: true,
        },
      })

      return { success: true, workOutput }
    }

    return { success: false, error: 'Invalid input' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error creating WorkOutput:', error)
    return { success: false, error: 'Failed to create work output' }
  }
}

export async function updateWorkOutput(id: string, data: Partial<Pick<z.infer<typeof workOutputSchema>, 'dataJson' | 'status' | 'workforceCommsId'>>) {
  try {
    const validated = workOutputSchema.pick({ dataJson: true, status: true, workforceCommsId: true }).partial().parse(data)
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    const existing = await prisma.workOutput.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
        originatorId: workMeId,
      },
    })

    if (!existing) {
      return { success: false, error: 'Work output not found' }
    }

    const updateData: any = {}
    if (validated.dataJson !== undefined) updateData.dataJson = validated.dataJson ?? undefined
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.workforceCommsId !== undefined) updateData.workforceCommsId = validated.workforceCommsId ?? undefined

    const workOutput = await prisma.workOutput.update({
      where: { id },
      data: updateData,
      include: {
        eventRouter: true,
        support: true,
        workforceComms: true,
      },
    })

    return { success: true, workOutput }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error updating WorkOutput:', error)
    return { success: false, error: 'Failed to update work output' }
  }
}

export async function deleteWorkOutput(id: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    const existing = await prisma.workOutput.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
        originatorId: workMeId,
      },
    })

    if (!existing) {
      return { success: false, error: 'Work output not found' }
    }

    await prisma.workOutput.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete work output' }
  }
}

export async function getWorkOutputs(workMeId?: string) {
  try {
    // Try to get workMeId from server (cookies/headers) first
    let userId = await getWorkMeId()
    
    // Fallback to provided workMeId if server can't get it
    if (!userId && workMeId) {
      // Verify the workMeId exists in the database for security
      const workMe = await prisma.workMe.findUnique({
        where: { id: workMeId },
        select: { id: true, companyId: true },
      })
      if (workMe) {
        userId = workMeId
      }
    }

    // If still no userId, try verifyAuth as last resort (requires Firebase token)
    let companyId: string | null = null
    if (!userId) {
      try {
        const auth = await verifyAuth()
        userId = auth.workMeId
        companyId = auth.companyId
      } catch (authError) {
        // verifyAuth failed, but that's okay if we have userId from other sources
      }
    }

    if (!userId) {
      return { success: false, error: 'Not authenticated', workOutputs: [] }
    }

    // Get companyId from WorkMe if we don't have it yet
    if (!companyId) {
      const workMe = await prisma.workMe.findUnique({
        where: { id: userId },
        select: { companyId: true },
      })
      companyId = workMe?.companyId || null
    }

    if (!companyId) {
      return { success: false, error: 'User must belong to a company', workOutputs: [] }
    }

    const workOutputs = await prisma.workOutput.findMany({
      where: { 
        companyId, // Multi-tenant: filter by company
      },
      include: {
        eventRouter: true,
        support: true,
        workforceComms: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, workOutputs }
  } catch (error) {
    console.error('[getWorkOutputs] Error:', error)
    return { success: false, error: 'Failed to fetch work outputs', workOutputs: [] }
  }
}

export async function getWorkOutput(id: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    const workOutput = await prisma.workOutput.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
      },
      include: {
        eventRouter: true,
        support: true,
        workforceComms: true,
      },
    })

    if (!workOutput) {
      return { success: false, error: 'Work output not found' }
    }

    return { success: true, workOutput }
  } catch (error) {
    return { success: false, error: 'Failed to fetch work output' }
  }
}

// Renamed for clarity — still accepts eventRouterId
export async function getWorkOutputsByRouter(routerId: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company', workOutputs: [] }
    }

    // Verify eventRouter belongs to user's company
    const eventRouter = await prisma.workEventRouter.findFirst({
      where: { 
        id: routerId,
        companyId, // Multi-tenant: ensure same company
      },
    })

    if (!eventRouter) {
      return { success: false, error: 'Work event router not found or unauthorized', workOutputs: [] }
    }

    const workOutputs = await prisma.workOutput.findMany({
      where: { 
        eventRouterId: routerId,
        companyId, // Multi-tenant: ensure same company
      },
      include: {
        eventRouter: true,
        support: true,
        workforceComms: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, workOutputs }
  } catch (error) {
    return { success: false, error: 'Failed to fetch work outputs', workOutputs: [] }
  }
}

// Legacy alias for backward compatibility
export const getWorkOutputsByContext = getWorkOutputsByRouter

