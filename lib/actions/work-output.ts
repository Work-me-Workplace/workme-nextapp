'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId.server'

const workOutputSchema = z.object({
  contextId: z.string().min(1, 'Context ID is required'),
  outputType: z.enum(['email', 'poster', 'talking_points', 'sharepoint', 'event_kit']),
  dataJson: z.any().optional().nullable(),
})

export async function createWorkOutput(data: z.infer<typeof workOutputSchema>) {
  try {
    const validated = workOutputSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify context exists and belongs to user
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
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, workOutput }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create work output' }
  }
}

export async function updateWorkOutput(id: string, data: Partial<Pick<z.infer<typeof workOutputSchema>, 'dataJson'>>) {
  try {
    const validated = workOutputSchema.pick({ dataJson: true }).partial().parse(data)
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

    const workOutput = await prisma.workOutput.update({
      where: { id },
      data: {
        dataJson: validated.dataJson ?? undefined,
      },
    })

    return { success: true, workOutput }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
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
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, workOutputs }
  } catch (error) {
    return { success: false, error: 'Failed to fetch work outputs', workOutputs: [] }
  }
}

