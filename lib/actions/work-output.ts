'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getWorkMeId } from '@/lib/getWorkMeId.server'
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
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify at least one of contextId or supportId is provided
    if (!validated.contextId && !validated.supportId) {
      return { success: false, error: 'Either contextId or supportId is required' }
    }

    // If supportId provided, verify it exists and belongs to user
    if (validated.supportId) {
      const support = await prisma.workSupport.findFirst({
        where: { id: validated.supportId, createdByWorkMeId: workMeId },
      })

      if (!support) {
        return { success: false, error: 'WorkSupport not found' }
      }

      // Use support's contextId if contextId not provided
      const contextIdToUse = validated.contextId || support.contextId

      const workOutput = await prisma.workOutput.create({
        data: {
          contextId: contextIdToUse,
          supportId: validated.supportId,
          outputType: validated.outputType,
          dataJson: validated.dataJson ?? undefined,
          status: validated.status || 'draft',
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

    // If only contextId provided, verify it exists and belongs to user
    if (validated.contextId) {
      const context = await prisma.workContext.findFirst({
        where: { id: validated.contextId, createdByWorkMeId: workMeId },
      })

      if (!context) {
        return { success: false, error: 'Work context not found' }
      }

      const workOutput = await prisma.workOutput.create({
        data: {
          contextId: validated.contextId,
          outputType: validated.outputType,
          dataJson: validated.dataJson ?? undefined,
          status: validated.status || 'draft',
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
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.workOutput.findFirst({
      where: { id, createdByWorkMeId: workMeId },
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
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.workOutput.findFirst({
      where: { id, createdByWorkMeId: workMeId },
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
    const userId = workMeId || await getWorkMeId()

    if (!userId) {
      return { success: false, error: 'Not authenticated', workOutputs: [] }
    }

    const workOutputs = await prisma.workOutput.findMany({
      where: { createdByWorkMeId: userId },
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
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const workOutput = await prisma.workOutput.findFirst({
      where: { id, createdByWorkMeId: workMeId },
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
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated', workOutputs: [] }
    }

    // Verify context belongs to user
    const context = await prisma.workContext.findFirst({
      where: { id: contextId, createdByWorkMeId: workMeId },
    })

    if (!context) {
      return { success: false, error: 'Work context not found', workOutputs: [] }
    }

    const workOutputs = await prisma.workOutput.findMany({
      where: { contextId },
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

