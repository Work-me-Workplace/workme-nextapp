'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { WORK_OUTPUT_TYPE_VALUES } from './work-support'

const workOutputSchema = z.object({
  contextId: z.string().optional().nullable(),
  supportId: z.string().optional().nullable(),
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

    // Verify at least one of contextId or supportId is provided
    if (!validated.contextId && !validated.supportId) {
      return { success: false, error: 'Either contextId or supportId is required' }
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

      // Use support's contextId if contextId not provided
      const contextIdToUse = validated.contextId || support.contextId

      const workOutput = await prisma.workOutput.create({
        data: {
          contextId: contextIdToUse,
          supportId: validated.supportId,
          outputType: validated.outputType,
          dataJson: validated.dataJson ?? undefined,
          status: (validated.status || 'draft') as 'draft' | 'final',
          companyId,
          createdByWorkMeId: workMeId,
        },
        include: {
          context: true,
          support: true,
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

    // If only contextId provided, verify it exists and belongs to user's company
    if (validated.contextId) {
      const context = await prisma.workContext.findFirst({
        where: { 
          id: validated.contextId,
          companyId, // Multi-tenant: ensure same company
        },
      })

      if (!context) {
        return { success: false, error: 'Work context not found or unauthorized' }
      }

      const workOutput = await prisma.workOutput.create({
        data: {
          contextId: validated.contextId,
          outputType: validated.outputType,
          dataJson: validated.dataJson ?? undefined,
          status: (validated.status || 'draft') as 'draft' | 'final',
          companyId,
          createdByWorkMeId: workMeId,
        },
        include: {
          context: true,
          support: true,
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

export async function updateWorkOutput(id: string, data: Partial<Pick<z.infer<typeof workOutputSchema>, 'dataJson' | 'status'>>) {
  try {
    const validated = workOutputSchema.pick({ dataJson: true, status: true }).partial().parse(data)
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    const existing = await prisma.workOutput.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
        createdByWorkMeId: workMeId,
      },
    })

    if (!existing) {
      return { success: false, error: 'Work output not found' }
    }

    const updateData: any = {}
    if (validated.dataJson !== undefined) updateData.dataJson = validated.dataJson ?? undefined
    if (validated.status !== undefined) updateData.status = validated.status

    const workOutput = await prisma.workOutput.update({
      where: { id },
      data: updateData,
      include: {
        context: true,
        support: true,
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
        createdByWorkMeId: workMeId,
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
    const { workMeId: authWorkMeId, companyId } = await verifyAuth()
    const userId = workMeId || authWorkMeId

    if (!userId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company', workOutputs: [] }
    }

    const workOutputs = await prisma.workOutput.findMany({
      where: { 
        companyId, // Multi-tenant: filter by company
      },
      include: {
        context: true,
        support: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, workOutputs }
  } catch (error) {
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
        context: true,
        support: true,
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

export async function getWorkOutputsByContext(contextId: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company', workOutputs: [] }
    }

    // Verify context belongs to user's company
    const context = await prisma.workContext.findFirst({
      where: { 
        id: contextId,
        companyId, // Multi-tenant: ensure same company
      },
    })

    if (!context) {
      return { success: false, error: 'Work context not found or unauthorized', workOutputs: [] }
    }

    const workOutputs = await prisma.workOutput.findMany({
      where: { 
        contextId,
        companyId, // Multi-tenant: ensure same company
      },
      include: {
        context: true,
        support: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, workOutputs }
  } catch (error) {
    return { success: false, error: 'Failed to fetch work outputs', workOutputs: [] }
  }
}

